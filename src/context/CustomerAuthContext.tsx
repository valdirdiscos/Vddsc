import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  CustomerAccount, 
  CustomerOnlineOrder, 
  CustomerAddress 
} from '../types';
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot,
  query,
  where,
  orderBy
} from '../firebase';

// Initial Demo Customer for fast exploration
const DEMO_CUSTOMER: CustomerAccount = {
  id: 'cust_demo_marcos',
  email: 'marcos.vinil@gmail.com',
  password: 'disco123',
  name: 'Marcos Vinicius (Colecionador)',
  phone: '(11) 98765-4321',
  cpf: '123.456.789-00',
  address: {
    cep: '01310-100',
    street: 'Avenida Paulista',
    number: '1578',
    complement: 'Apto 42',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP'
  },
  wishlist: [],
  favoriteGenres: ['MPB', 'Samba', 'Jazz & Soul'],
  createdAt: '2026-01-15T14:30:00.000Z',
  ordersCount: 2,
  totalSpent: 480
};

interface CustomerAuthContextType {
  currentCustomer: CustomerAccount | null;
  isCustomerLoggedIn: boolean;
  isLoading: boolean;
  allCustomerAccounts: CustomerAccount[];
  customerOrders: CustomerOnlineOrder[];
  allOnlineOrders: CustomerOnlineOrder[];
  loginCustomer: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginWithDemo: () => void;
  registerCustomer: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    cpf?: string;
    address?: CustomerAddress;
  }) => Promise<{ success: boolean; message: string }>;
  updateCustomerProfile: (data: Partial<CustomerAccount>) => Promise<{ success: boolean; message: string }>;
  logoutCustomer: () => void;
  toggleWishlist: (listingId: string) => Promise<boolean>;
  isInWishlist: (listingId: string) => boolean;
  createOnlineOrder: (orderData: Omit<CustomerOnlineOrder, 'id' | 'orderNumber' | 'createdAt'>) => Promise<CustomerOnlineOrder>;
  updateOrderStatus: (orderId: string, updates: Partial<CustomerOnlineOrder>) => Promise<void>;
  refreshCustomerData: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'valdir_logged_customer';
const LOCAL_ACCOUNTS_KEY = 'valdir_customer_accounts_cache';
const LOCAL_ORDERS_KEY = 'valdir_online_orders_cache';

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentCustomer, setCurrentCustomer] = useState<CustomerAccount | null>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  const [allCustomerAccounts, setAllCustomerAccounts] = useState<CustomerAccount[]>(() => {
    const cached = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return [DEMO_CUSTOMER];
  });

  const [allOnlineOrders, setAllOnlineOrders] = useState<CustomerOnlineOrder[]>(() => {
    const cached = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync Customer Accounts from Firestore
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    try {
      const q = collection(db, 'customer_accounts');
      unsubscribe = onSnapshot(q, (snapshot) => {
        const list: CustomerAccount[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as CustomerAccount);
        });

        if (list.length > 0) {
          // If demo not in cloud, merge it locally
          if (!list.some(c => c.email.toLowerCase() === DEMO_CUSTOMER.email.toLowerCase())) {
            list.unshift(DEMO_CUSTOMER);
          }
          setAllCustomerAccounts(list);
          localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(list));

          // If current customer is logged in, refresh from cloud
          if (currentCustomer) {
            const updated = list.find(c => c.id === currentCustomer.id || c.email.toLowerCase() === currentCustomer.email.toLowerCase());
            if (updated) {
              setCurrentCustomer(updated);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
            }
          }
        }
      }, (error) => {
        console.warn('Could not listen to customer_accounts snapshot:', error);
      });
    } catch (e) {
      console.warn('Customer accounts listener error:', e);
    }
    return () => unsubscribe();
  }, []);

  // Sync Online Orders from Firestore
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    try {
      const q = collection(db, 'online_orders');
      unsubscribe = onSnapshot(q, (snapshot) => {
        const list: CustomerOnlineOrder[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as CustomerOnlineOrder);
        });
        
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllOnlineOrders(list);
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
      }, (error) => {
        console.warn('Could not listen to online_orders snapshot:', error);
      });
    } catch (e) {
      console.warn('Online orders listener error:', e);
    }
    return () => unsubscribe();
  }, []);

  // Filter orders for the currently logged-in customer
  const customerOrders = currentCustomer 
    ? allOnlineOrders.filter(o => 
        o.customerId === currentCustomer.id || 
        o.customerEmail.toLowerCase() === currentCustomer.email.toLowerCase()
      )
    : [];

  const loginCustomer = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      // Check if account exists in all accounts
      let matched = allCustomerAccounts.find(
        acc => acc.email.toLowerCase() === cleanEmail
      );

      // Try fetching directly from Firestore if not in memory
      if (!matched) {
        try {
          const snap = await getDocs(collection(db, 'customer_accounts'));
          snap.forEach(d => {
            const data = d.data() as CustomerAccount;
            if (data.email.toLowerCase() === cleanEmail) {
              matched = data;
            }
          });
        } catch {}
      }

      if (!matched) {
        setIsLoading(false);
        return { success: false, message: 'Nenhuma conta encontrada com este e-mail. Verifique a digitação ou cadastre-se.' };
      }

      // Password comparison (simple verification for e-commerce client account)
      if (matched.password && matched.password !== cleanPassword) {
        setIsLoading(false);
        return { success: false, message: 'Senha incorreta. Tente novamente ou use a recuperação de senha.' };
      }

      // Update last login
      const updatedProfile: CustomerAccount = {
        ...matched,
        lastLoginAt: new Date().toISOString()
      };

      setCurrentCustomer(updatedProfile);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfile));

      // Persist last login to Firestore
      try {
        await setDoc(doc(db, 'customer_accounts', updatedProfile.id), updatedProfile, { merge: true });
      } catch (e) {
        console.warn('Failed updating lastLogin in Firestore:', e);
      }

      setIsLoading(false);
      return { success: true, message: `Bem-vindo de volta, ${updatedProfile.name.split(' ')[0]}!` };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, message: err.message || 'Erro ao realizar login.' };
    }
  };

  const loginWithDemo = () => {
    setCurrentCustomer(DEMO_CUSTOMER);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEMO_CUSTOMER));
  };

  const registerCustomer = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    cpf?: string;
    address?: CustomerAddress;
  }): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = data.email.trim().toLowerCase();

      // Check if email already registered
      const existing = allCustomerAccounts.find(
        acc => acc.email.toLowerCase() === cleanEmail
      );

      if (existing) {
        setIsLoading(false);
        return { success: false, message: 'Este e-mail já está cadastrado. Por favor, faça login na sua conta existente.' };
      }

      const accountId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newAccount: CustomerAccount = {
        id: accountId,
        email: cleanEmail,
        password: data.password.trim(),
        name: data.name.trim(),
        phone: data.phone?.trim() || '',
        cpf: data.cpf?.trim() || '',
        address: data.address,
        wishlist: [],
        favoriteGenres: [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        ordersCount: 0,
        totalSpent: 0
      };

      // Save to state and local storage
      const updatedList = [...allCustomerAccounts, newAccount];
      setAllCustomerAccounts(updatedList);
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(updatedList));

      setCurrentCustomer(newAccount);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newAccount));

      // Save to Firestore
      try {
        await setDoc(doc(db, 'customer_accounts', accountId), newAccount);
      } catch (e) {
        console.warn('Saved customer locally, error syncing to cloud:', e);
      }

      // Also register in the store's customer database if not present
      try {
        await setDoc(doc(db, 'customers', accountId), {
          id: accountId,
          name: newAccount.name,
          phone: newAccount.phone,
          email: newAccount.email,
          city: newAccount.address?.city || '',
          state: newAccount.address?.state || '',
          address: newAccount.address,
          notes: 'Cadastrado pela Loja Online',
          createdAt: newAccount.createdAt
        });
      } catch {}

      setIsLoading(false);
      return { success: true, message: `Conta criada com sucesso! Seja muito bem-vindo, ${newAccount.name.split(' ')[0]}!` };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, message: err.message || 'Erro ao cadastrar conta.' };
    }
  };

  const updateCustomerProfile = async (data: Partial<CustomerAccount>): Promise<{ success: boolean; message: string }> => {
    if (!currentCustomer) {
      return { success: false, message: 'Você precisa estar logado para atualizar os dados.' };
    }

    try {
      const updated: CustomerAccount = {
        ...currentCustomer,
        ...data,
        id: currentCustomer.id, // Immutable ID
        email: data.email ? data.email.trim().toLowerCase() : currentCustomer.email
      };

      setCurrentCustomer(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

      // Update in list
      setAllCustomerAccounts(prev => 
        prev.map(c => c.id === updated.id ? updated : c)
      );

      // Save to Firestore
      try {
        await setDoc(doc(db, 'customer_accounts', updated.id), updated, { merge: true });
      } catch (e) {
        console.warn('Saved update locally, error on cloud:', e);
      }

      return { success: true, message: 'Dados e endereço atualizados com sucesso!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro ao atualizar dados.' };
    }
  };

  const logoutCustomer = () => {
    setCurrentCustomer(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const toggleWishlist = async (listingId: string): Promise<boolean> => {
    if (!currentCustomer) {
      return false;
    }

    const currentList = currentCustomer.wishlist || [];
    const exists = currentList.includes(listingId);
    const updatedWishlist = exists 
      ? currentList.filter(id => id !== listingId)
      : [...currentList, listingId];

    const updatedProfile: CustomerAccount = {
      ...currentCustomer,
      wishlist: updatedWishlist
    };

    setCurrentCustomer(updatedProfile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfile));

    // Update in Firestore
    try {
      await updateDoc(doc(db, 'customer_accounts', updatedProfile.id), {
        wishlist: updatedWishlist
      });
    } catch (e) {
      console.warn('Saved wishlist locally:', e);
    }

    return !exists;
  };

  const isInWishlist = (listingId: string): boolean => {
    if (!currentCustomer || !currentCustomer.wishlist) return false;
    return currentCustomer.wishlist.includes(listingId);
  };

  const createOnlineOrder = async (
    orderData: Omit<CustomerOnlineOrder, 'id' | 'orderNumber' | 'createdAt'>
  ): Promise<CustomerOnlineOrder> => {
    const timestamp = Date.now();
    const orderNumber = `VD-ONL-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ord_onl_${timestamp}`;

    const newOrder: CustomerOnlineOrder = {
      ...orderData,
      id: orderId,
      orderNumber,
      createdAt: new Date().toISOString()
    };

    // Update local state and storage
    const updatedOrders = [newOrder, ...allOnlineOrders];
    setAllOnlineOrders(updatedOrders);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updatedOrders));

    // If logged in, update customer metrics
    if (currentCustomer) {
      const updatedCustomer: CustomerAccount = {
        ...currentCustomer,
        ordersCount: (currentCustomer.ordersCount || 0) + 1,
        totalSpent: (currentCustomer.totalSpent || 0) + newOrder.totalAmount
      };
      setCurrentCustomer(updatedCustomer);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCustomer));

      try {
        await setDoc(doc(db, 'customer_accounts', updatedCustomer.id), updatedCustomer, { merge: true });
      } catch {}
    }

    // Save order to Firestore
    try {
      await setDoc(doc(db, 'online_orders', orderId), newOrder);
    } catch (e) {
      console.warn('Saved order locally, error saving to Firestore:', e);
    }

    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, updates: Partial<CustomerOnlineOrder>) => {
    const updatedList = allOnlineOrders.map(order => {
      if (order.id === orderId) {
        return { ...order, ...updates, updatedAt: new Date().toISOString() };
      }
      return order;
    });

    setAllOnlineOrders(updatedList);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updatedList));

    try {
      await updateDoc(doc(db, 'online_orders', orderId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Updated order status locally, cloud sync failed:', e);
    }
  };

  const refreshCustomerData = async () => {
    try {
      const snap = await getDocs(collection(db, 'customer_accounts'));
      const list: CustomerAccount[] = [];
      snap.forEach(d => list.push(d.data() as CustomerAccount));
      if (list.length > 0) {
        setAllCustomerAccounts(list);
      }
    } catch {}
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        currentCustomer,
        isCustomerLoggedIn: !!currentCustomer,
        isLoading,
        allCustomerAccounts,
        customerOrders,
        allOnlineOrders,
        loginCustomer,
        loginWithDemo,
        registerCustomer,
        updateCustomerProfile,
        logoutCustomer,
        toggleWishlist,
        isInWishlist,
        createOnlineOrder,
        updateOrderStatus,
        refreshCustomerData
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = (): CustomerAuthContextType => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};

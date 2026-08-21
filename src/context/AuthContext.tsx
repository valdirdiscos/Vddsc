import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  collection, 
  deleteDoc, 
  updateDoc,
  FirebaseUser 
} from '../firebase';
import { UserProfile, UserRole, RolePermissions } from '../types';

export const MASTER_ADMIN_EMAIL = 'valdirdiscos@gmail.com';

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canCreateListings: true,
    canEditListings: true,
    canDeleteListings: true,
    canViewFinancialMargins: true,
    canEditPricingSettings: true,
    canOperatePOS: true,
    canManageCustomers: true,
    canPrintLabels: true,
    canManagePlaylists: true,
    canManageUsers: true,
  },
  operador: {
    canCreateListings: true,
    canEditListings: true,
    canDeleteListings: false,
    canViewFinancialMargins: false,
    canEditPricingSettings: false,
    canOperatePOS: true,
    canManageCustomers: true,
    canPrintLabels: true,
    canManagePlaylists: true,
    canManageUsers: false,
  },
  estoquista: {
    canCreateListings: true,
    canEditListings: true,
    canDeleteListings: false,
    canViewFinancialMargins: false,
    canEditPricingSettings: false,
    canOperatePOS: false,
    canManageCustomers: false,
    canPrintLabels: true,
    canManagePlaylists: false,
    canManageUsers: false,
  },
  visitante: {
    canCreateListings: false,
    canEditListings: false,
    canDeleteListings: false,
    canViewFinancialMargins: false,
    canEditPricingSettings: false,
    canOperatePOS: false,
    canManageCustomers: false,
    canPrintLabels: false,
    canManagePlaylists: true,
    canManageUsers: false,
  }
};

export const ROLE_LABELS: Record<UserRole, { label: string; badgeColor: string; description: string; icon: string }> = {
  admin: {
    label: 'Administrador (Master)',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Acesso total: financeiro, custos, margens, exclusão de dados e gestão de equipe.',
    icon: '👑'
  },
  operador: {
    label: 'Operador / Vendedor',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Acesso ao caixa (PDV), vendas, cadastro de clientes, anúncios e emissão de etiquetas.',
    icon: '💼'
  },
  estoquista: {
    label: 'Estoquista / Catalogador',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Acesso ao Discogs, cadastro de discos, localização de gavetas e impressão de etiquetas.',
    icon: '📦'
  },
  visitante: {
    label: 'Modo Consulta (Visitante)',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Somente leitura: busca no acervo e visualização de playlists de DJ.',
    icon: '👁️'
  }
};

// Default initial Master Admin profile
export const DEFAULT_VALDIR_PROFILE: UserProfile = {
  uid: 'valdir-master-admin',
  email: MASTER_ADMIN_EMAIL,
  displayName: 'Valdir (Administrador Master)',
  role: 'admin',
  customPin: '1975',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  userRole: UserRole;
  permissions: RolePermissions;
  isStaff: boolean;
  isMasterAdmin: boolean;
  isLoadingAuth: boolean;
  allUsers: UserProfile[];
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  switchUserWithPin: (pin: string) => boolean;
  quickSwitchRole: (role: UserRole) => void;
  saveUser: (user: Partial<UserProfile> & { email: string; displayName: string; role: UserRole }) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  verifyMasterPin: (pin: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    // Only restore user if an authenticated staff profile was previously stored
    const cached = localStorage.getItem('valdir_active_user');
    if (cached) {
      try { 
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.role === 'admin' || parsed.role === 'operador' || parsed.role === 'estoquista')) {
          return parsed;
        }
      } catch {}
    }
    return null;
  });
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Sync users from Firestore
  const fetchAllUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        list.push(d.data() as UserProfile);
      });
      
      // Ensure master admin is in list if not present
      if (!list.some(u => u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase())) {
        list.unshift(DEFAULT_VALDIR_PROFILE);
      }
      setAllUsers(list);
    } catch (err) {
      console.warn('Could not fetch users list from cloud:', err);
      // Fallback local list
      setAllUsers([DEFAULT_VALDIR_PROFILE]);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const isMaster = user.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
        
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const updatedProfile: UserProfile = {
              ...data,
              displayName: user.displayName || data.displayName || 'Colaborador',
              photoURL: user.photoURL || data.photoURL,
              role: isMaster ? 'admin' : data.role || 'operador',
              lastLoginAt: new Date().toISOString()
            };
            setCurrentUser(updatedProfile);
            localStorage.setItem('valdir_active_user', JSON.stringify(updatedProfile));
          } else {
            // New user registration in Firestore
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
              photoURL: user.photoURL || undefined,
              role: isMaster ? 'admin' : 'operador',
              isActive: true,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setCurrentUser(newProfile);
            localStorage.setItem('valdir_active_user', JSON.stringify(newProfile));
          }
        } catch (e) {
          console.warn('Error reading user profile from Firestore:', e);
          const fallbackProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Colaborador',
            photoURL: user.photoURL || undefined,
            role: isMaster ? 'admin' : 'operador',
            isActive: true,
            createdAt: new Date().toISOString()
          };
          setCurrentUser(fallbackProfile);
          localStorage.setItem('valdir_active_user', JSON.stringify(fallbackProfile));
        }
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      await fetchAllUsers();
    } catch (err: any) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Signout warning:', e);
    }
    // Remove staff token and clear active user
    localStorage.removeItem('valdir_active_user');
    setCurrentUser(null);
  };

  const switchUserWithPin = (pin: string): boolean => {
    const trimmedPin = pin.trim();
    if (!trimmedPin) return false;

    // Check Master PIN (Valdir Master)
    if (trimmedPin === '1975' || trimmedPin === '2026') {
      setCurrentUser(DEFAULT_VALDIR_PROFILE);
      localStorage.setItem('valdir_active_user', JSON.stringify(DEFAULT_VALDIR_PROFILE));
      return true;
    }

    // Match PIN in all registered users
    const matchedUser = allUsers.find(u => u.customPin === trimmedPin && u.isActive);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      localStorage.setItem('valdir_active_user', JSON.stringify(matchedUser));
      return true;
    }

    return false;
  };

  const quickSwitchRole = (newRole: UserRole) => {
    if (!currentUser || currentUser.role !== 'admin') {
      console.warn('Somente administradores autenticados podem alternar papéis.');
      return;
    }
    const updated: UserProfile = {
      ...currentUser,
      role: newRole,
      displayName: `${currentUser?.displayName?.replace(/\(.*\)/, '').trim()} (${ROLE_LABELS[newRole].label})`
    };
    setCurrentUser(updated);
    localStorage.setItem('valdir_active_user', JSON.stringify(updated));
  };

  const saveUser = async (userData: Partial<UserProfile> & { email: string; displayName: string; role: UserRole }) => {
    const targetUid = userData.uid || `usr_${Date.now()}`;
    const userToSave: UserProfile = {
      uid: targetUid,
      email: userData.email.trim(),
      displayName: userData.displayName.trim(),
      role: userData.role,
      customPin: userData.customPin?.trim() || undefined,
      isActive: userData.isActive !== false,
      createdAt: userData.createdAt || new Date().toISOString(),
      lastLoginAt: userData.lastLoginAt
    };

    try {
      await setDoc(doc(db, 'users', targetUid), userToSave);
      await fetchAllUsers();
    } catch (err) {
      console.warn('Failed saving user to Firestore, keeping locally:', err);
      setAllUsers(prev => {
        const filtered = prev.filter(u => u.uid !== targetUid);
        return [...filtered, userToSave];
      });
    }
  };

  const deleteUser = async (uid: string) => {
    if (uid === DEFAULT_VALDIR_PROFILE.uid) {
      throw new Error('O Administrador Master não pode ser removido.');
    }
    try {
      await deleteDoc(doc(db, 'users', uid));
      await fetchAllUsers();
    } catch (err) {
      console.warn('Failed removing user in cloud:', err);
      setAllUsers(prev => prev.filter(u => u.uid !== uid));
    }
  };

  const verifyMasterPin = (pin: string): boolean => {
    const clean = pin.trim();
    return clean === '1975' || clean === '2026' || (currentUser?.role === 'admin' && currentUser?.customPin === clean);
  };

  const userRole: UserRole = currentUser?.role || 'visitante';
  const permissions: RolePermissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.visitante;
  const isStaff = userRole === 'admin' || userRole === 'operador' || userRole === 'estoquista';
  const isMasterAdmin = userRole === 'admin' || currentUser?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        userRole,
        permissions,
        isStaff,
        isMasterAdmin,
        isLoadingAuth,
        allUsers,
        loginWithGoogle,
        logout,
        switchUserWithPin,
        quickSwitchRole,
        saveUser,
        deleteUser,
        refreshUsers: fetchAllUsers,
        verifyMasterPin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

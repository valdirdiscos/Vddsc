/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Disc, 
  Music, 
  Video, 
  FileAudio, 
  DollarSign, 
  Clipboard, 
  Check, 
  RotateCcw, 
  History, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Sparkles, 
  Save, 
  ExternalLink,
  ChevronRight,
  Info,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Camera,
  Download,
  Image,
  Upload,
  X,
  Database,
  User,
  ShoppingBag,
  Heart,
  FileText,
  ListMusic,
  CheckCircle,
  Loader2,
  Globe,
  QrCode,
  Store,
  Scan,
  Tag,
  Printer,
  Flame,
  HardDrive,
  Cloud
} from 'lucide-react';
import { toPng } from 'html-to-image';

import { DiscogsRelease, ConditionSelection, PricingConfig, SavedListing, ShopeeListing, MercadoLivreListing, Customer, DJPlaylist, SalesChannel, SavedLabel, CartItem, PhysicalSaleOrder, LabelFormatType, DigitalAlbumProduct, StorageProviderConfig } from './types';
import { DIGITAL_ALBUM_PRODUCTS, DEFAULT_STORAGE_PROVIDERS } from './data/digitalMusicData';
import { DigitalMusicManager } from './components/DigitalMusicManager';
import { BarcodeQrScannerModal } from './components/BarcodeQrScannerModal';
import { StoreOmnichannelManager } from './components/StoreOmnichannelManager';
import { PhysicalStorePos } from './components/PhysicalStorePos';
import { PosCartDrawer } from './components/PosCartDrawer';
import { SavedLabelsManager } from './components/SavedLabelsManager';
import { DiscQRCodeModal } from './components/DiscQRCodeModal';
import { ThermalPrintModal } from './components/ThermalPrintModal';
import { PublicStorefront } from './components/PublicStorefront';
import { OnlineOrdersIntranetTab } from './components/OnlineOrdersIntranetTab';
import { IntranetAuthModal } from './components/IntranetAuthModal';
import { useCustomerAuth } from './context/CustomerAuthContext';
import { getSalesChannelMeta } from './utils/qrcode';

function isImportedCountry(country?: string): boolean {
  if (!country) return false;
  const clean = country.trim().toLowerCase();
  if (!clean || clean === 'brasil' || clean === 'brazil' || clean === 'br' || clean === 'nacional' || clean === 'desconhecido' || clean === 'n/a') {
    return false;
  }
  return true;
}

function getImportTag(country?: string): string {
  if (!isImportedCountry(country)) return "";
  const clean = country!.trim().toUpperCase();
  if (clean === 'US' || clean === 'USA' || clean === 'UNITED STATES' || clean === 'ESTADOS UNIDOS' || clean === 'EUA') {
    return 'IMPORTADO EUA';
  }
  if (clean === 'UK' || clean === 'UNITED KINGDOM' || clean === 'REINO UNIDO' || clean === 'ENGLAND' || clean === 'INGLATERRA') {
    return 'IMPORTADO UK';
  }
  if (clean === 'JAPAN' || clean === 'JAPÃO' || clean === 'JAPAO') {
    return 'IMPORTADO JAPÃO';
  }
  if (clean === 'GERMANY' || clean === 'ALEMANHA') {
    return 'IMPORTADO ALEMANHA';
  }
  if (clean === 'EUROPE' || clean === 'EUROPA' || clean === 'EU') {
    return 'IMPORTADO EUROPA';
  }
  if (clean === 'FRANCE' || clean === 'FRANÇA' || clean === 'FRANCA') {
    return 'IMPORTADO FRANÇA';
  }
  if (clean === 'ITALY' || clean === 'ITÁLIA' || clean === 'ITALIA') {
    return 'IMPORTADO ITÁLIA';
  }
  if (clean.length <= 12) {
    return `IMPORTADO ${clean}`;
  }
  return 'IMPORTADO';
}
import { SleeveMediaConditionSelector } from './components/SleeveMediaConditionSelector';
import { PricingCalculator } from './components/PricingCalculator';
import { HistoryList } from './components/HistoryList';
import { TracklistViewer } from './components/TracklistViewer';
import { DiscDescriptionEditor } from './components/DiscDescriptionEditor';
import { ManualRegistrationForm } from './components/ManualRegistrationForm';
import { OrganizedCatalog } from './components/OrganizedCatalog';
import { CustomersManager } from './components/CustomersManager';
import { DjPlaylists } from './components/DjPlaylists';
import { UserHeaderBadge } from './components/UserHeaderBadge';
import { UserAccessManagerModal } from './components/UserAccessManagerModal';
import { AdminPinOverrideModal } from './components/AdminPinOverrideModal';
import { LogoUploadModal } from './components/LogoUploadModal';
import { LOGO_COLOR, LOGO_BADGE } from './assets/logos';
import { useAuth, ROLE_LABELS } from './context/AuthContext';
import { GOLDMINE_CONDITIONS, DEFAULT_PRICING } from './constants';
import { db, collection, getDocs, setDoc, doc, deleteDoc, query } from './firebase';

export default function App() {
  // Authorization & Permissions State
  const { currentUser, userRole, permissions, isStaff, isMasterAdmin } = useAuth();
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isIntranetAuthModalOpen, setIsIntranetAuthModalOpen] = useState(false);
  const [isLogoUploadModalOpen, setIsLogoUploadModalOpen] = useState(false);
  const [pinOverrideModal, setPinOverrideModal] = useState<{
    isOpen: boolean;
    title: string;
    requiredRole?: string;
    onSuccess: () => void;
  }>({
    isOpen: false,
    title: '',
    onSuccess: () => {}
  });

  // Guard action helper
  const requestGuardedAction = (
    allowed: boolean,
    action: () => void,
    title: string,
    requiredRole: string = 'Administrador'
  ) => {
    if (allowed) {
      action();
    } else {
      setPinOverrideModal({
        isOpen: true,
        title,
        requiredRole,
        onSuccess: action
      });
    }
  };

  // App Mode ('storefront' = public e-commerce for customers, 'intranet' = internal store POS & backoffice)
  const [appMode, setAppMode] = useState<'storefront' | 'intranet'>('storefront');

  // Main Tab Navigation ('store_pos' = physical store real-time POS, 'online_orders' = website orders, 'digital_storage' = hi-res music & storage manager, 'announce' = create announcements, 'catalog' = organized database catalog, 'omnichannel' = sales channels, 'playlists' = dj sets, 'clients' = customer management)
  const [mainTab, setMainTab] = useState<'store_pos' | 'online_orders' | 'digital_storage' | 'announce' | 'catalog' | 'omnichannel' | 'playlists' | 'clients'>('store_pos');
  const { customerOrders } = useCustomerAuth();
  const [salesOrders, setSalesOrders] = useState<PhysicalSaleOrder[]>([]);

  // Digital Albums & Cloud Storage Providers State
  const [digitalAlbums, setDigitalAlbums] = useState<DigitalAlbumProduct[]>(() => {
    try {
      const stored = localStorage.getItem('valdir_digital_albums_v1');
      return stored ? JSON.parse(stored) : DIGITAL_ALBUM_PRODUCTS;
    } catch {
      return DIGITAL_ALBUM_PRODUCTS;
    }
  });

  const [storageProviders, setStorageProviders] = useState<StorageProviderConfig[]>(() => {
    try {
      const stored = localStorage.getItem('valdir_storage_providers_v1');
      return stored ? JSON.parse(stored) : DEFAULT_STORAGE_PROVIDERS;
    } catch {
      return DEFAULT_STORAGE_PROVIDERS;
    }
  });

  // Load and sync Digital Albums from Firestore
  useEffect(() => {
    const fetchDigital = async () => {
      try {
        const q = query(collection(db, 'digital_albums'));
        const snap = await getDocs(q);
        const fbAlbums: DigitalAlbumProduct[] = [];
        snap.forEach((docSnap) => {
          fbAlbums.push({ id: docSnap.id, ...docSnap.data() } as DigitalAlbumProduct);
        });

        if (fbAlbums.length > 0) {
          setDigitalAlbums(fbAlbums);
          localStorage.setItem('valdir_digital_albums_v1', JSON.stringify(fbAlbums));
        } else {
          for (const item of DIGITAL_ALBUM_PRODUCTS) {
            const cleaned = JSON.parse(JSON.stringify(item));
            await setDoc(doc(db, 'digital_albums', item.id), cleaned);
          }
        }
      } catch (err) {
        console.warn('Aviso: Operando em modo cache local para álbuns digitais:', err);
      }
    };
    fetchDigital();
  }, []);

  // Load and sync Storage Providers from Firestore
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const q = query(collection(db, 'storage_providers'));
        const snap = await getDocs(q);
        const fbProviders: StorageProviderConfig[] = [];
        snap.forEach((docSnap) => {
          fbProviders.push({ id: docSnap.id, ...docSnap.data() } as StorageProviderConfig);
        });

        if (fbProviders.length > 0) {
          setStorageProviders(fbProviders);
          localStorage.setItem('valdir_storage_providers_v1', JSON.stringify(fbProviders));
        } else {
          for (const prov of DEFAULT_STORAGE_PROVIDERS) {
            const cleaned = JSON.parse(JSON.stringify(prov));
            await setDoc(doc(db, 'storage_providers', prov.id), cleaned);
          }
        }
      } catch (err) {
        console.warn('Aviso: Operando em modo cache local para provedores de storage:', err);
      }
    };
    fetchProviders();
  }, []);

  const handleSaveDigitalAlbum = async (album: DigitalAlbumProduct) => {
    setDigitalAlbums(prev => {
      const filtered = prev.filter(a => a.id !== album.id);
      const updated = [album, ...filtered];
      try {
        localStorage.setItem('valdir_digital_albums_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSuccessMsg(`✓ Álbum digital "${album.title}" salvo com sucesso!`);

    try {
      const cleaned = JSON.parse(JSON.stringify(album));
      await setDoc(doc(db, 'digital_albums', album.id), cleaned);
    } catch (err) {
      console.warn('Aviso: Álbum salvo no cache local (sync pendente):', err);
    }
  };

  const handleDeleteDigitalAlbum = async (albumId: string) => {
    setDigitalAlbums(prev => {
      const updated = prev.filter(a => a.id !== albumId);
      try {
        localStorage.setItem('valdir_digital_albums_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSuccessMsg('Álbum digital excluído.');

    try {
      await deleteDoc(doc(db, 'digital_albums', albumId));
    } catch (err) {
      console.warn('Aviso: Álbum excluído localmente:', err);
    }
  };

  const handleSaveStorageProvider = async (provider: StorageProviderConfig) => {
    setStorageProviders(prev => {
      let updated = prev.filter(p => p.id !== provider.id);
      if (provider.isDefault) {
        updated = updated.map(p => ({ ...p, isDefault: false }));
      }
      const combined = [provider, ...updated];
      try {
        localStorage.setItem('valdir_storage_providers_v1', JSON.stringify(combined));
      } catch {}
      return combined;
    });
    setSuccessMsg(`✓ Conexão de storage "${provider.name}" salva!`);

    try {
      const cleaned = JSON.parse(JSON.stringify(provider));
      await setDoc(doc(db, 'storage_providers', provider.id), cleaned);
    } catch (err) {
      console.warn('Aviso: Provedor salvo no cache local:', err);
    }
  };

  const handleDeleteStorageProvider = async (providerId: string) => {
    setStorageProviders(prev => {
      const updated = prev.filter(p => p.id !== providerId);
      try {
        localStorage.setItem('valdir_storage_providers_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSuccessMsg('Conexão de storage removida.');

    try {
      await deleteDoc(doc(db, 'storage_providers', providerId));
    } catch (err) {
      console.warn('Aviso: Provedor excluído localmente:', err);
    }
  };

  // Omnichannel & Scanner Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [initialScannerCode, setInitialScannerCode] = useState<string | undefined>(undefined);
  const [activeSalesChannels, setActiveSalesChannels] = useState<SalesChannel[]>([
    'physical_store',
    'online_store',
    'shopee',
    'mercadolivre'
  ]);

  // Global USB Barcode Reader Wedge Listener
  // Hardware barcode guns simulate very fast keystrokes (<50ms per char) followed by Enter.
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 150) {
        keyBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (keyBuffer.trim().length >= 3) {
          const scannedCode = keyBuffer.trim();
          keyBuffer = '';
          setInitialScannerCode(scannedCode);
          setIsScannerOpen(true);
        }
      } else if (e.key.length === 1) {
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // POS / Cart State & Saved Labels
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('valdir_active_cart_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [savedLabels, setSavedLabels] = useState<SavedLabel[]>([]);

  // DJ Playlists State
  const [playlists, setPlaylists] = useState<DJPlaylist[]>([]);

  // Customer State
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Navigation / Extraction Tab State
  const [activeTab, setActiveTab] = useState<'url' | 'manual' | 'custom_manual' | 'batch'>('url');

  // Batch extraction states
  const [batchText, setBatchText] = useState('');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchItems, setBatchItems] = useState<{
    id: string;
    input: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    error?: string;
    artistAlbum?: string;
    savedListingId?: string;
    drawer?: string;
  }[]>([]);
  const [batchLoc, setBatchLoc] = useState('');
  const [batchMediaPreset, setBatchMediaPreset] = useState('VG+');
  const [batchSleevePreset, setBatchSleevePreset] = useState('VG+');
  const [cancelBatchFlag, setCancelBatchFlag] = useState(false);
  const cancelBatchRef = useRef(false);
  
  // Input states
  const [discogsUrl, setDiscogsUrl] = useState('');
  const [manualQuery, setManualQuery] = useState('');
  const [drawer, setDrawer] = useState('');

  // Core workspace states
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [drawerSaveNotice, setDrawerSaveNotice] = useState<string | null>(null);
  const [release, setRelease] = useState<DiscogsRelease | null>(null);
  const [condition, setCondition] = useState<ConditionSelection>({
    mediaCondition: 'VG+',
    mediaDetails: 'Mídia em ótimo estado. Poucos riscos superficiais normais de uso que não afetam a reprodução (toca sem pulos).',
    sleeveCondition: 'VG+',
    sleeveDetails: 'Capa conservada. Leves desgastes naturais nas pontas e bordas devido ao tempo de armazenamento.'
  });
  const [pricing, setPricing] = useState<PricingConfig>({ ...DEFAULT_PRICING });
  const [shopeeListing, setShopeeListing] = useState<ShopeeListing | null>(null);
  const [mercadoLivreListing, setMercadoLivreListing] = useState<MercadoLivreListing | null>(null);
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [isPersonal, setIsPersonal] = useState<boolean>(false);
  const [isGarimpo, setIsGarimpo] = useState<boolean>(false);
  const [garimpoDetails, setGarimpoDetails] = useState<string>('');
  const [activeCover, setActiveCover] = useState<string>('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [generatingAd, setGeneratingAd] = useState(false);
  const [isSavingListing, setIsSavingListing] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [saveToast, setSaveToast] = useState<{ message: string; title: string; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);

  // Copy buttons interactive states
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedMlTitle, setCopiedMlTitle] = useState(false);
  const [copiedMlDesc, setCopiedMlDesc] = useState(false);

  // Price overlay on generated art
  const [showPriceOnArt, setShowPriceOnArt] = useState(false);
  const [priceOnArtType, setPriceOnArtType] = useState<'shopee' | 'direct'>('shopee');

  // Cover image source selector: 'discogs' or 'real' (product photos)
  const [coverSource, setCoverSource] = useState<'discogs' | 'real'>('discogs');

  const [activePlatform, setActivePlatform] = useState<'shopee' | 'mercadolivre'>('shopee');

  // QR Code Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalListing, setQrModalListing] = useState<any | null>(null);
  const [thermalPrintListing, setThermalPrintListing] = useState<SavedListing | null>(null);

  // Saved listings state (loaded from local storage)
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);

  // Load and sync saved listings on mount (from Firestore and LocalStorage fallback)
  useEffect(() => {
    const fetchListings = async () => {
      let localData: SavedListing[] = [];
      try {
        const stored = localStorage.getItem('valdir_shopee_listings');
        if (stored) {
          localData = JSON.parse(stored);
          setSavedListings(localData);
        }
      } catch (e) {
        console.error('Erro ao ler rascunhos locais', e);
      }

      try {
        const q = query(collection(db, 'listings'));
        const querySnapshot = await getDocs(q);
        const fbData: SavedListing[] = [];
        querySnapshot.forEach((docSnap) => {
          fbData.push({ id: docSnap.id, ...docSnap.data() } as SavedListing);
        });

        // Sort by createdAt desc in memory to prevent any index errors
        fbData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Sync local storage listings that are not in firebase yet
        if (localData.length > 0) {
          let migrated = false;
          for (const localItem of localData) {
            const exists = fbData.some(fbItem => fbItem.id === localItem.id || (fbItem.release.title === localItem.release.title && fbItem.createdAt === localItem.createdAt));
            if (!exists) {
              // Strip undefined values to prevent Firestore from throwing "Unsupported field value: undefined"
              const cleanedItem = JSON.parse(JSON.stringify(localItem));
              await setDoc(doc(db, 'listings', localItem.id), cleanedItem);
              fbData.push(localItem);
              migrated = true;
            }
          }
          if (migrated) {
            fbData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
        }

        // Deduplicate saved listings to prevent React duplicate key warning
        const uniqueListings: SavedListing[] = [];
        const seenIds = new Set<string>();
        for (const item of fbData) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            uniqueListings.push(item);
          }
        }

        setSavedListings(uniqueListings);
        localStorage.setItem('valdir_shopee_listings', JSON.stringify(uniqueListings));
      } catch (err) {
        console.warn('Aviso: Operando em modo cache local para anúncios (Firestore offline/conectando):', err);
      }
    };

    fetchListings();
  }, []);

  // Load and sync customers from Firestore on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const q = query(collection(db, 'customers'));
        const querySnapshot = await getDocs(q);
        const fbCustomers: Customer[] = [];
        querySnapshot.forEach((docSnap) => {
          fbCustomers.push({ id: docSnap.id, ...docSnap.data() } as Customer);
        });
        fbCustomers.sort((a, b) => a.name.localeCompare(b.name));
        setCustomers(fbCustomers);
      } catch (err) {
        console.warn('Aviso: Operando em modo cache local para clientes (Firestore offline/conectando):', err);
      }
    };
    fetchCustomers();
  }, []);

  // Load and sync DJ Playlists from Firestore/LocalStorage on mount
  useEffect(() => {
    const fetchPlaylists = async () => {
      let localData: DJPlaylist[] = [];
      try {
        const stored = localStorage.getItem('valdir_dj_playlists_v1');
        if (stored) {
          localData = JSON.parse(stored);
          setPlaylists(localData);
        }
      } catch (e) {
        console.warn('Erro ao ler playlists locais:', e);
      }

      try {
        const q = query(collection(db, 'playlists'));
        const querySnapshot = await getDocs(q);
        const fbPlaylists: DJPlaylist[] = [];
        querySnapshot.forEach((docSnap) => {
          fbPlaylists.push({ id: docSnap.id, ...docSnap.data() } as DJPlaylist);
        });

        if (fbPlaylists.length > 0) {
          fbPlaylists.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          setPlaylists(fbPlaylists);
          localStorage.setItem('valdir_dj_playlists_v1', JSON.stringify(fbPlaylists));
        } else if (localData.length > 0) {
          for (const item of localData) {
            const cleaned = JSON.parse(JSON.stringify(item));
            await setDoc(doc(db, 'playlists', item.id), cleaned);
          }
        }
      } catch (err) {
        console.warn('Aviso: Operando em modo cache local para playlists (Firestore offline/conectando):', err);
      }
    };

    fetchPlaylists();
  }, []);

  const handleSavePlaylists = async (updated: DJPlaylist[]) => {
    setPlaylists(updated);
    try {
      localStorage.setItem('valdir_dj_playlists_v1', JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar playlists no localStorage:', e);
    }

    try {
      for (const pl of updated) {
        const cleaned = JSON.parse(JSON.stringify(pl));
        await setDoc(doc(db, 'playlists', pl.id), cleaned);
      }
    } catch (e) {
      console.warn('Aviso: Playlist salva localmente (sincronização na nuvem pendente):', e);
    }
  };

  // Add / Update Customer
  const handleAddCustomer = async (newCustomer: Customer) => {
    setCustomers(prev => {
      const filtered = prev.filter(c => c.id !== newCustomer.id);
      const updated = [newCustomer, ...filtered];
      updated.sort((a, b) => a.name.localeCompare(b.name));
      return updated;
    });
    setSuccessMsg(`Cliente "${newCustomer.name}" cadastrado/atualizado com sucesso!`);

    try {
      const cleaned = JSON.parse(JSON.stringify(newCustomer));
      await setDoc(doc(db, 'customers', newCustomer.id), cleaned);
    } catch (err) {
      console.warn('Aviso: Cliente salvo no cache local (sincronização na nuvem pendente):', err);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setSuccessMsg('Cliente removido com sucesso.');

    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (err) {
      console.warn('Aviso: Cliente excluído localmente (sincronização na nuvem pendente):', err);
    }
  };

  // Load and sync Saved Labels from Firestore & LocalStorage
  useEffect(() => {
    const fetchLabels = async () => {
      let localLabels: SavedLabel[] = [];
      try {
        const stored = localStorage.getItem('valdir_saved_labels_v1');
        if (stored) {
          localLabels = JSON.parse(stored);
          setSavedLabels(localLabels);
        }
      } catch (e) {
        console.warn('Erro lendo etiquetas locais:', e);
      }

      try {
        const q = query(collection(db, 'saved_labels'));
        const querySnapshot = await getDocs(q);
        const fbLabels: SavedLabel[] = [];
        querySnapshot.forEach((docSnap) => {
          fbLabels.push({ id: docSnap.id, ...docSnap.data() } as SavedLabel);
        });

        if (fbLabels.length > 0) {
          fbLabels.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setSavedLabels(fbLabels);
          localStorage.setItem('valdir_saved_labels_v1', JSON.stringify(fbLabels));
        } else if (localLabels.length > 0) {
          for (const lbl of localLabels) {
            const cleaned = JSON.parse(JSON.stringify(lbl));
            await setDoc(doc(db, 'saved_labels', lbl.id), cleaned);
          }
        }
      } catch (err) {
        console.warn('Aviso: Operando em modo cache local para etiquetas (Firestore offline/conectando):', err);
      }
    };

    fetchLabels();
  }, []);

  // Load and sync sales orders from Firestore & LocalStorage on mount
  useEffect(() => {
    const fetchSalesOrders = async () => {
      let localOrders: PhysicalSaleOrder[] = [];
      try {
        const stored = localStorage.getItem('valdir_sales_orders_v1');
        if (stored) {
          localOrders = JSON.parse(stored);
          setSalesOrders(localOrders);
        }
      } catch (e) {
        console.warn('Erro lendo pedidos locais:', e);
      }

      try {
        const q = query(collection(db, 'sales_orders'));
        const querySnapshot = await getDocs(q);
        const fbOrders: PhysicalSaleOrder[] = [];
        querySnapshot.forEach((docSnap) => {
          fbOrders.push({ id: docSnap.id, ...docSnap.data() } as PhysicalSaleOrder);
        });

        if (fbOrders.length > 0) {
          fbOrders.sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
          setSalesOrders(fbOrders);
          localStorage.setItem('valdir_sales_orders_v1', JSON.stringify(fbOrders));
        } else if (localOrders.length > 0) {
          for (const ord of localOrders) {
            const cleaned = JSON.parse(JSON.stringify(ord));
            await setDoc(doc(db, 'sales_orders', ord.id), cleaned);
          }
        }
      } catch (err) {
        console.warn('Aviso: Operando em modo cache local para pedidos de venda (Firestore offline/conectando):', err);
      }
    };

    fetchSalesOrders();
  }, []);

  // Save Cart to LocalStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('valdir_active_cart_v1', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Erro ao persistir carrinho:', e);
    }
  }, [cartItems]);

  // Save Label Handler
  const handleSaveLabel = async (newLabel: SavedLabel) => {
    setSavedLabels(prev => {
      const filtered = prev.filter(l => l.id !== newLabel.id && !(l.barcode === newLabel.barcode && l.format === newLabel.format));
      const updated = [newLabel, ...filtered];
      try {
        localStorage.setItem('valdir_saved_labels_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const cleaned = JSON.parse(JSON.stringify(newLabel));
      await setDoc(doc(db, 'saved_labels', newLabel.id), cleaned);
    } catch (err) {
      console.error('Erro ao salvar etiqueta no Firestore:', err);
    }
  };

  // Delete Label Handler
  const handleDeleteLabel = async (id: string) => {
    setSavedLabels(prev => {
      const updated = prev.filter(l => l.id !== id);
      try {
        localStorage.setItem('valdir_saved_labels_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'saved_labels', id));
      setSuccessMsg('Etiqueta removida do histórico.');
    } catch (err) {
      console.error('Erro ao excluir etiqueta no Firestore:', err);
    }
  };

  const handleClearAllLabels = () => {
    setSavedLabels([]);
    localStorage.removeItem('valdir_saved_labels_v1');
  };

  // Cart Handlers
  const handleAddToCart = (listing: SavedListing, customPrice?: number) => {
    const originalPrice = customPrice !== undefined ? customPrice : (listing.pricing?.basePriceBrl || 0);
    const cartItemId = `cart_${listing.id}_${Date.now()}`;
    const newCartItem: CartItem = {
      id: cartItemId,
      listingId: listing.id,
      listing,
      barcode: listing.barcode || `VD-${listing.id.replace('list_', '').slice(-8)}`,
      artist: listing.release.artist,
      title: listing.release.title,
      coverImage: listing.customImages?.[0] || listing.release.coverImage,
      drawer: listing.drawer,
      originalPrice,
      discount: 0,
      finalPrice: originalPrice,
      mediaCondition: listing.condition?.mediaCondition || 'VG+',
      sleeveCondition: listing.condition?.sleeveCondition || 'VG+',
      addedAt: new Date().toISOString()
    };

    setCartItems(prev => {
      // If already in cart, don't duplicate unique vinyl record
      const exists = prev.some(item => item.listingId === listing.id);
      if (exists) {
        return prev;
      }
      return [newCartItem, ...prev];
    });

    setSuccessMsg(`✓ Adicionado ao Carrinho: ${listing.release.artist} - ${listing.release.title}`);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleUpdateCartDiscount = (itemId: string, discount: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const safeDisc = Math.max(0, discount);
        return {
          ...item,
          discount: safeDisc,
          finalPrice: Math.max(0, item.originalPrice - safeDisc)
        };
      }
      return item;
    }));
  };

  const handleClearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem('valdir_active_cart_v1');
    } catch {}
  };

  // Complete Physical Sale Order
  const handleCompleteSale = async (order: PhysicalSaleOrder) => {
    try {
      // 1. Save order to Firestore 'sales_orders'
      const cleanedOrder = JSON.parse(JSON.stringify(order));
      await setDoc(doc(db, 'sales_orders', order.id), cleanedOrder);

      setSalesOrders(prev => {
        const filtered = prev.filter(o => o.id !== order.id);
        const updated = [order, ...filtered];
        try {
          localStorage.setItem('valdir_sales_orders_v1', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // 2. Mark all items in listing database as 'sold'
      const updatedListings = [...savedListings];
      for (const item of order.items) {
        const idx = updatedListings.findIndex(l => l.id === item.listingId || l.barcode === item.barcode);
        if (idx !== -1) {
          const updatedListing: SavedListing = {
            ...updatedListings[idx],
            status: 'sold',
            customerId: order.customerId,
            customerName: order.customerName,
            saleDetails: {
              salePrice: item.finalPrice,
              platform: order.channel,
              soldAt: order.soldAt,
              netProfit: item.finalPrice,
              paymentStatus: 'pago',
              paymentMethod: order.paymentMethod
            }
          };
          updatedListings[idx] = updatedListing;
          const cleanedListing = JSON.parse(JSON.stringify(updatedListing));
          await setDoc(doc(db, 'listings', updatedListing.id), cleanedListing);
        }
      }

      setSavedListings(updatedListings);
      localStorage.setItem('valdir_shopee_listings', JSON.stringify(updatedListings));
      setSuccessMsg(`✓ Pedido ${order.orderNumber} finalizado! Total: R$ ${order.totalAmount.toFixed(2)}`);
    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
      throw err;
    }
  };

  // Refund / Cancel Sale Order
  const handleRefundSale = async (orderId: string) => {
    try {
      const ord = salesOrders.find(o => o.id === orderId);
      if (!ord) return;

      // 1. Restore items to 'available' in listings
      const updatedListings = [...savedListings];
      for (const item of ord.items) {
        const idx = updatedListings.findIndex(l => l.id === item.listingId || l.barcode === item.barcode);
        if (idx !== -1) {
          const restored: SavedListing = {
            ...updatedListings[idx],
            status: 'available',
            saleDetails: undefined
          };
          updatedListings[idx] = restored;
          const cleaned = JSON.parse(JSON.stringify(restored));
          await setDoc(doc(db, 'listings', restored.id), cleaned);
        }
      }
      setSavedListings(updatedListings);
      localStorage.setItem('valdir_shopee_listings', JSON.stringify(updatedListings));

      // 2. Delete from sales_orders
      await deleteDoc(doc(db, 'sales_orders', orderId));
      setSalesOrders(prev => {
        const updated = prev.filter(o => o.id !== orderId);
        try {
          localStorage.setItem('valdir_sales_orders_v1', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setSuccessMsg(`✓ Pedido ${ord.orderNumber} estornado com sucesso. Discos retornaram ao estoque!`);
    } catch (err) {
      console.error('Erro ao estornar venda:', err);
      setError('Erro ao estornar venda no banco de dados.');
    }
  };

  // Sync pricing if release lowest price changes
  useEffect(() => {
    if (release && release.lowestPriceUsd && !release.isManual) {
      setPricing((prev) => {
        const usdVal = release.lowestPriceUsd || 0;
        const exchangeVal = prev.exchangeRate || 5.60;
        const converted = Math.round(usdVal * exchangeVal);
        return {
          ...prev,
          basePriceBrl: usdVal || prev.basePriceBrl,
          useExchange: true,
          directPrice: converted > 0 ? converted : prev.directPrice
        };
      });
    } else if (release && release.isManual) {
      setPricing((prev) => ({
        ...prev,
        basePriceBrl: release.lowestPriceUsd || prev.basePriceBrl,
        useExchange: false,
        directPrice: release.lowestPriceUsd || prev.directPrice
      }));
    }
  }, [release]);

  // Clean success/error alerts automatically
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // Helper formula to compute listed Shopee price (replicated from PricingCalculator for sync)
  const calculateShopeePrice = (p: PricingConfig) => {
    if ((p.mode || 'direct') === 'direct') {
      return p.directPrice ?? p.basePriceBrl;
    }
    const baseInBrl = p.useExchange ? p.basePriceBrl * p.exchangeRate : p.basePriceBrl;
    const costWithPackaging = baseInBrl + p.packagingCost;
    const targetNetPayout = costWithPackaging * (1 + p.profitMarginPercent / 100);
    const commissionRate = p.shopeeCommissionPercent / 100;
    const divisor = 1 - commissionRate;
    return divisor > 0 ? (targetNetPayout + p.shopeeFixedFee) / divisor : 0;
  };

  // Export metadata card as image (screenshot)
  const handleExportImage = async () => {
    if (!release) return;
    
    setExportingImage(true);
    setIsCapturing(true);
    
    // Give state/DOM a brief moment to update and render fully expanded tracklist
    await new Promise((resolve) => setTimeout(resolve, 350));
    
    try {
      const node = document.getElementById('album-metadata-card');
      if (!node) {
        throw new Error('Card do álbum não encontrado.');
      }
      
      const dataUrl = await toPng(node, {
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          borderRadius: '16px',
          boxShadow: 'none',
        },
        backgroundColor: '#ffffff',
        pixelRatio: 2.5, // Super crisp high resolution image!
      });
      
      // Download trigger
      const link = document.createElement('a');
      const safeTitle = release.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `valdir_discos_${safeTitle}.png`;
      link.href = dataUrl;
      link.click();
      
      setSuccessMsg('Foto do álbum gerada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao gerar imagem:', err);
      setError('Não foi possível gerar a imagem do álbum. Tente novamente.');
    } finally {
      setIsCapturing(false);
      setExportingImage(false);
    }
  };

  // Extract metadata
  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRelease(null);
    setShopeeListing(null);

    const payload: { url?: string; query?: string } = {};
    if (activeTab === 'url') {
      if (!discogsUrl.trim()) {
        setError('Por favor, cole um link válido do Discogs.');
        return;
      }
      payload.url = discogsUrl.trim();
    } else {
      if (!manualQuery.trim()) {
        setError('Por favor, digite o nome do Artista e do Álbum.');
        return;
      }
      payload.query = manualQuery.trim();
    }

    setLoading(true);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível extrair as informações do disco.');
      }

      setRelease(data.release);
      setCustomImages([]);
      setIsPersonal(false);
      setActiveCover(data.release.coverImage || '');
      setCoverSource('discogs');
      setSuccessMsg('Metadados extraídos com sucesso! Gerando anúncio...');
      
      // Auto-trigger Dual Ad Generation for an absolute magic experience
      await autoGenerateAllAds(data.release, condition, pricing, drawer);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for immediate auto-generation (unified Shopee and Mercado Livre call)
  const autoGenerateAllAds = async (
    currentRelease: DiscogsRelease,
    currentCondition: ConditionSelection,
    currentPricing: PricingConfig,
    currentDrawer: string = drawer
  ) => {
    setGeneratingAd(true);
    try {
      const shopeePrice = calculateShopeePrice(currentPricing);
      const payload = {
        release: currentRelease,
        condition: currentCondition,
        pricing: { ...currentPricing, basePriceBrl: shopeePrice },
        drawer: currentDrawer
      };

      const res = await fetch('/api/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro na geração unificada de anúncios IA.');
      }

      setShopeeListing(data.shopee);
      setMercadoLivreListing(data.mercadolivre);
      setSuccessMsg('Anúncios Shopee e Mercado Livre gerados com Inteligência Artificial!');
    } catch (err: any) {
      setError(`Metadados extraídos, mas a geração do anúncio falhou: ${err.message}`);
    } finally {
      setGeneratingAd(false);
    }
  };

  // Trigger manual re-generation of all ads
  const handleGenerateAd = async () => {
    if (!release) return;
    setError(null);
    setGeneratingAd(true);

    try {
      const shopeePrice = calculateShopeePrice(pricing);
      const payload = {
        release,
        condition,
        pricing: { ...pricing, basePriceBrl: shopeePrice },
        drawer,
        isGarimpo,
        garimpoDetails: isGarimpo ? garimpoDetails : undefined
      };

      const res = await fetch('/api/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar anúncios.');
      }

      setShopeeListing(data.shopee);
      setMercadoLivreListing(data.mercadolivre);
      setSuccessMsg('Anúncios Shopee e Mercado Livre atualizados com novas condições!');
    } catch (err: any) {
      setError(err.message || 'Erro ao re-gerar anúncios.');
    } finally {
      setGeneratingAd(false);
    }
  };

  // Robust clipboard copying function (handles iframe security)
  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    try {
      // Standard method
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch (e) {
      console.warn('Clipboard writeText failed, attempting fallback...', e);
    }

    // Fallback selection copying
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setError('Não foi possível copiar automaticamente. Selecione e copie manualmente.');
      }
    } catch (err) {
      setError('Erro ao tentar copiar texto.');
    }
    document.body.removeChild(textArea);
  };

  // Cancel current batch processing
  const handleCancelBatch = () => {
    cancelBatchRef.current = true;
    setCancelBatchFlag(true);
    setSuccessMsg('Solicitação de cancelamento enviada. Aguardando conclusão da linha atual...');
  };

  // Run sequential batch extraction and storage
  const handleProcessBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchText.trim()) {
      setError('Por favor, insira pelo menos um link ou nome de disco na área de texto.');
      return;
    }

    const lines = batchText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setError('Nenhum link ou nome de disco válido encontrado.');
      return;
    }

    setError(null);
    cancelBatchRef.current = false;
    setCancelBatchFlag(false);
    setIsProcessingBatch(true);

    const initialItems = lines.map((line, idx) => ({
      id: 'batch_' + Date.now() + '_' + idx,
      input: line,
      status: 'pending' as const,
      drawer: batchLoc || undefined
    }));

    setBatchItems(initialItems);

    const getPresetDetails = (media: string, sleeve: string) => {
      const mediaDetailsMap: Record<string, string> = {
        'NM': 'Mídia em estado de nova, brilhante, sem nenhum sinal perceptível de uso. Excelente fidelidade sonora.',
        'VG+': 'Mídia em ótimo estado. Poucos riscos superficiais normais de uso que não afetam a reprodução (toca sem pulos).',
        'VG': 'Mídia muito bem conservada, com marcas normais de manuseio e uso contínuo que podem gerar leve chiado de fundo.',
        'G+': 'Mídia com marcas visíveis e riscos mais evidentes que geram chiado de fundo perceptível, mas toca sem trancar.'
      };
      const sleeveDetailsMap: Record<string, string> = {
        'NM': 'Capa praticamente nova, muito bem preservada, sem marcas evidentes ou desgaste de prateleira.',
        'VG+': 'Capa conservada. Leves desgastes naturais nas pontas e bordas devido ao tempo de armazenamento.',
        'VG': 'Capa com sinais de manuseio moderados, marcas de ringwear (aro do disco) ou pequenas avarias nas bordas.',
        'G+': 'Capa com desgaste acentuado, possivelmente com assinaturas, rasgos parciais ou fita adesiva de reforço.'
      };
      return {
        mediaCondition: media,
        mediaDetails: mediaDetailsMap[media] || 'Mídia em bom estado de reprodução.',
        sleeveCondition: sleeve,
        sleeveDetails: sleeveDetailsMap[sleeve] || 'Capa íntegra com sinais normais do tempo.',
        hasInsert: false
      };
    };

    const conditionPreset = getPresetDetails(batchMediaPreset, batchSleevePreset);

    // Copy list to prevent closure captures
    let currentSavedListings = [...savedListings];

    for (let i = 0; i < initialItems.length; i++) {
      // Check for cancellation flag in each iteration
      if (cancelBatchRef.current) {
        setSuccessMsg('Processamento em lote cancelado!');
        break;
      }

      const currentItem = initialItems[i];
      
      // Update state to 'processing' for this item
      setBatchItems(prev =>
        prev.map(item => item.id === currentItem.id ? { ...item, status: 'processing' } : item)
      );

      try {
        const payload: { url?: string; query?: string } = {};
        const isUrl = currentItem.input.startsWith('http') || currentItem.input.includes('discogs.com');
        const isDirectId = /^\d+$/.test(currentItem.input);
        
        if (isUrl || isDirectId) {
          payload.url = currentItem.input;
        } else {
          payload.query = currentItem.input;
        }

        // 1. Extract Details
        const extractRes = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const extractData = await extractRes.json();
        if (!extractRes.ok || !extractData.success) {
          throw new Error(extractData.error || 'Não foi possível extrair metadados.');
        }

        const extractedRelease: DiscogsRelease = extractData.release;

        // 2. Generate Ads using IA
        const shopeePrice = calculateShopeePrice(pricing);
        const payloadGen = {
          release: extractedRelease,
          condition: conditionPreset,
          pricing: { ...pricing, basePriceBrl: shopeePrice },
          drawer: batchLoc
        };

        const genRes = await fetch('/api/generate-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadGen)
        });

        const genData = await genRes.json();
        if (!genRes.ok || !genData.success) {
          throw new Error(genData.error || 'Erro na geração IA de anúncios.');
        }

        // 3. Save to database
        const newListId = 'list_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const newListing: SavedListing = {
          id: newListId,
          release: extractedRelease,
          condition: conditionPreset,
          pricing: pricing,
          shopee: genData.shopee,
          mercadolivre: genData.mercadolivre || undefined,
          createdAt: new Date().toISOString(),
          drawer: batchLoc || undefined,
          status: 'available'
        };

        // Save to Firestore Database
        const cleanedListing = JSON.parse(JSON.stringify(newListing));
        await setDoc(doc(db, 'listings', newListId), cleanedListing);

        // Update local state incrementally
        currentSavedListings = [newListing, ...currentSavedListings];
        setSavedListings(currentSavedListings);
        localStorage.setItem('valdir_shopee_listings', JSON.stringify(currentSavedListings));

        // Mark as completed
        setBatchItems(prev =>
          prev.map(item =>
            item.id === currentItem.id
              ? {
                  ...item,
                  status: 'completed',
                  artistAlbum: `${extractedRelease.artist} - ${extractedRelease.title}`,
                  savedListingId: newListId
                }
              : item
          )
        );

      } catch (err: any) {
        console.error('Erro ao processar item do lote:', err);
        setBatchItems(prev =>
          prev.map(item =>
            item.id === currentItem.id
              ? { ...item, status: 'error', error: err.message || 'Erro desconhecido' }
              : item
          )
        );
      }

      // Self-throttling delay to prevent rate limiting (1.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsProcessingBatch(false);
    cancelBatchRef.current = false;
    setCancelBatchFlag(false);
  };

  // Save listing to Firestore and LocalStorage
  const handleSaveListing = async () => {
    if (!release) return;

    setIsSavingListing(true);
    setIsSavedSuccess(false);

    // Ensure we have valid Shopee and Mercado Livre listings
    let finalShopee = shopeeListing;
    let finalMl = mercadoLivreListing;

    const baseShopeePrice = calculateShopeePrice(pricing);
    const locTag = drawer ? ` - [Loc: ${drawer}]` : '';

    if (!finalShopee) {
      const fallbackDesc = [
        drawer ? `📍 **Loc:** ${drawer}\n` : '',
        `📷 **Observação importante:** fotos originais do produto\n`,
        `🎵 **Álbum:** ${release.title}`,
        `🎤 **Artista:** ${release.artist}`,
        release.year ? `📅 **Ano:** ${release.year}` : '',
        release.label ? `🏷️ **Selo:** ${release.label}` : '',
        `\n🔍 **Estado de Conservação:**`,
        `• Mídia: ${condition.mediaCondition} - ${condition.mediaDetails || ''}`,
        `• Capa: ${condition.sleeveCondition} - ${condition.sleeveDetails || ''}`,
        release.notes ? `\nℹ️ **Observações do Disco:**\n${release.notes}` : '',
        `\n🧼 **Higienização:** Disco 100% higienizado profissionalmente com plásticos protetores novos inclusos.`
      ].filter(Boolean).join('\n');

      finalShopee = {
        title: `${release.artist} - ${release.title}${locTag}`.slice(0, 120),
        description: fallbackDesc,
        suggestedPrice: baseShopeePrice,
        hashtags: ['#vinil', '#discodevinil', '#lp', '#valdir_discos']
      };
      setShopeeListing(finalShopee);
    }

    if (!finalMl) {
      const mlLocTag = drawer ? ` [Loc:${drawer}]` : '';
      finalMl = {
        title: `Vinil LP ${release.artist} - ${release.title}${mlLocTag}`.slice(0, 60),
        description: finalShopee.description,
        suggestedPrice: baseShopeePrice
      };
      setMercadoLivreListing(finalMl);
    }

    // Check if an existing listing is active or matches this title/artist
    const existingListing = activeListingId 
      ? savedListings.find(l => l.id === activeListingId)
      : savedListings.find(l => l.release.title === release.title && l.release.artist === release.artist);

    const id = existingListing ? existingListing.id : ('list_' + Date.now());
    setActiveListingId(id);

    const barcode = existingListing?.barcode || `VD-${id.replace('list_', '').slice(-8)}`;

    const newListing: SavedListing = {
      id,
      release,
      condition,
      pricing,
      shopee: finalShopee,
      mercadolivre: finalMl || undefined,
      createdAt: existingListing ? existingListing.createdAt : new Date().toISOString(),
      drawer: drawer || undefined,
      customImages: customImages.length > 0 ? customImages : undefined,
      status: isPersonal ? 'personal' : 'available',
      barcode,
      salesChannels: activeSalesChannels.length > 0 ? activeSalesChannels : ['physical_store', 'online_store', 'shopee', 'mercadolivre'],
      isGarimpo: isGarimpo || undefined,
      garimpoDetails: isGarimpo && garimpoDetails.trim() ? garimpoDetails.trim() : undefined
    };

    // Optimistically update local state & storage first
    const updated = savedListings.some(l => l.id === id)
      ? savedListings.map(l => l.id === id ? newListing : l)
      : [newListing, ...savedListings];

    setSavedListings(updated);
    localStorage.setItem('valdir_shopee_listings', JSON.stringify(updated));

    try {
      // Strip undefined values to prevent "Unsupported field value: undefined" in setDoc
      const cleanedListing = JSON.parse(JSON.stringify(newListing));
      await setDoc(doc(db, 'listings', id), cleanedListing);
    } catch (err) {
      console.error('Erro ao salvar no Firestore:', err);
    } finally {
      setIsSavingListing(false);
      setIsSavedSuccess(true);
      const toastData = {
        message: existingListing ? 'Anúncio Atualizado!' : 'Anúncio Salvo!',
        title: `${release.artist} - ${release.title}`,
        id
      };
      setSaveToast(toastData);
      setSuccessMsg(`✓ ${toastData.message}`);

      setTimeout(() => {
        setIsSavedSuccess(false);
      }, 4000);
    }
  };

  // Delete listing from Firestore and LocalStorage
  const handleDeleteListing = async (id: string) => {
    const updated = savedListings.filter((l) => l.id !== id);
    setSavedListings(updated);
    localStorage.setItem('valdir_shopee_listings', JSON.stringify(updated));
    setSuccessMsg('Excluindo do histórico...');

    try {
      await deleteDoc(doc(db, 'listings', id));
      setSuccessMsg('Anúncio excluído com sucesso do histórico e da nuvem.');
    } catch (err) {
      console.error('Erro ao excluir no Firestore:', err);
      setError('Excluído localmente, mas erro ao sincronizar com a nuvem.');
    }
  };

  // Update a listing in local state & Firestore (used for store management)
  const handleUpdateListing = async (updatedListing: SavedListing) => {
    const updated = savedListings.map((l) => l.id === updatedListing.id ? updatedListing : l);
    setSavedListings(updated);
    localStorage.setItem('valdir_shopee_listings', JSON.stringify(updated));

    setSaveToast({
      message: 'Alterações Salvas!',
      title: `${updatedListing.release.artist} - ${updatedListing.release.title}`,
      id: updatedListing.id
    });

    try {
      const cleanedListing = JSON.parse(JSON.stringify(updatedListing));
      await setDoc(doc(db, 'listings', updatedListing.id), cleanedListing);
    } catch (err) {
      console.error('Erro ao atualizar no Firestore:', err);
      setError('Atualizado localmente, mas erro ao sincronizar com a nuvem.');
    }
  };

  // Reload saved listing into active workspace
  const handleSelectListing = (item: SavedListing) => {
    setActiveListingId(item.id);
    setRelease(item.release);
    setCondition(item.condition);
    setPricing(item.pricing);
    setShopeeListing(item.shopee);
    setMercadoLivreListing(item.mercadolivre || null);
    setDrawer(item.drawer || '');
    const imgs = item.customImages || [];
    setCustomImages(imgs);
    setIsPersonal(item.status === 'personal');
    setIsGarimpo(Boolean(item.isGarimpo));
    setGarimpoDetails(item.garimpoDetails || '');
    setActiveSalesChannels(item.salesChannels || ['physical_store', 'online_store', 'shopee', 'mercadolivre']);
    setActiveCover(imgs.length > 0 ? imgs[0] : (item.release.coverImage || ''));
    setCoverSource(imgs.length > 0 ? 'real' : 'discogs');
    setSuccessMsg(`Carregado: ${item.release.title}`);
  };

  // Helper to resolve icon based on format string
  const getFormatIcon = (formatName: string) => {
    const lower = (formatName || '').toLowerCase();
    if (lower.includes('vinyl') || lower.includes('vinil') || lower.includes('lp')) {
      return <Disc className="h-5 w-5 text-indigo-600" />;
    }
    if (lower.includes('cd')) {
      return <Music className="h-5 w-5 text-indigo-500" />;
    }
    if (lower.includes('dvd')) {
      return <Video className="h-5 w-5 text-rose-500" />;
    }
    return <FileAudio className="h-5 w-5 text-slate-400" />;
  };

  // Clear current active workspace
  const handleResetWorkspace = () => {
    setActiveListingId(null);
    setRelease(null);
    setShopeeListing(null);
    setMercadoLivreListing(null);
    setCustomImages([]);
    setIsPersonal(false);
    setIsGarimpo(false);
    setGarimpoDetails('');
    setActiveCover('');
    setDiscogsUrl('');
    setManualQuery('');
    setError(null);
  };

  // Helper to compress images client-side using HTML5 Canvas to 800px max and JPEG 70% quality
  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível inicializar o compressor de imagem.'));
          return;
        }

        // Draw image on white background (since we export to jpeg which doesn't support alpha)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        reject(new Error('Erro ao processar imagem para compressão.'));
      };
    });
  };

  // Upload custom/real product images and convert to Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setError(null);
    const maxFiles = 8;
    if (customImages.length + files.length > maxFiles) {
      setError(`Você pode enviar no máximo ${maxFiles} fotos reais por produto.`);
      return;
    }

    const loaders = (Array.from(files) as File[]).map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // Compress the image before resolving
            compressImage(reader.result)
              .then((compressed) => resolve(compressed))
              .catch((err) => reject(err));
          } else {
            reject(new Error('Erro ao ler arquivo de imagem.'));
          }
        };
        reader.onerror = () => reject(new Error('Erro na leitura do arquivo.'));
        reader.readAsDataURL(file);
      });
    });

    Promise.all(loaders)
      .then((newImages) => {
        const updated = [...customImages, ...newImages];
        setCustomImages(updated);
        // If there was no active cover or it was the default cover, auto-set to first real photo
        if (newImages.length > 0 && (!activeCover || !activeCover.startsWith('data:'))) {
          setActiveCover(newImages[0]);
        }
        setCoverSource('real');
        setSuccessMsg(`${newImages.length} foto(s) real(is) carregada(s) com sucesso!`);
      })
      .catch((err: any) => {
        setError(err.message || 'Erro ao carregar as fotos.');
      });
  };

  // Remove a custom image
  const handleRemoveImage = (indexToRemove: number) => {
    const removedImg = customImages[indexToRemove];
    const updated = customImages.filter((_, idx) => idx !== indexToRemove);
    setCustomImages(updated);
    
    // If we removed the active cover, fallback to the next available or the Discogs cover
    if (activeCover === removedImg) {
      if (updated.length > 0) {
        setActiveCover(updated[0]);
      } else {
        setActiveCover(release?.coverImage || '');
        setCoverSource('discogs');
      }
    } else if (updated.length === 0) {
      setCoverSource('discogs');
    }
    setSuccessMsg('Foto removida.');
  };

  const displayCover = (coverSource === 'real' && activeCover && activeCover !== release?.coverImage)
    ? (activeCover.startsWith('data:') ? activeCover : (activeCover.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(activeCover)}` : activeCover))
    : (release?.coverImage ? (release.coverImage.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(release.coverImage)}` : release.coverImage) : '');

  if (appMode === 'storefront' || !isStaff) {
    return (
      <>
        <PublicStorefront
          listings={savedListings}
          playlists={playlists}
          digitalAlbums={digitalAlbums}
          onOpenIntranet={() => {
            if (isStaff) {
              setAppMode('intranet');
            } else {
              setIsIntranetAuthModalOpen(true);
            }
          }}
          currentUserRole={userRole}
        />

        {/* Intranet Staff Login Gate Modal */}
        <IntranetAuthModal
          isOpen={isIntranetAuthModalOpen}
          onClose={() => setIsIntranetAuthModalOpen(false)}
          onSuccess={() => {
            setIsIntranetAuthModalOpen(false);
            setAppMode('intranet');
          }}
        />

        {/* Global Floating Save Confirmation Toast */}
        <AnimatePresence>
          {saveToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-start gap-3.5 max-w-sm backdrop-blur-md"
            >
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5 border border-emerald-500/30">
                <CheckCircle className="h-6 w-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-emerald-400">{saveToast.message}</h4>
                  <button 
                    onClick={() => setSaveToast(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-200 truncate font-semibold">{saveToast.title}</p>
                <p className="text-[11px] text-slate-400">Gravado no Histórico e na Nuvem (Firebase).</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals & Access Dialogs */}
        <LogoUploadModal
          isOpen={isLogoUploadModalOpen}
          onClose={() => setIsLogoUploadModalOpen(false)}
        />
        <DiscQRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          listing={qrModalListing}
          onSaveLabel={handleSaveLabel}
        />
        <ThermalPrintModal
          isOpen={!!thermalPrintListing}
          onClose={() => setThermalPrintListing(null)}
          listing={thermalPrintListing}
          onSaveLabel={handleSaveLabel}
        />
        <UserAccessManagerModal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
        />
        <AdminPinOverrideModal
          isOpen={pinOverrideModal.isOpen}
          onClose={() => setPinOverrideModal(prev => ({ ...prev, isOpen: false }))}
          onSuccess={pinOverrideModal.onSuccess}
          actionTitle={pinOverrideModal.title}
          requiredRole={pinOverrideModal.requiredRole}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased" id="main-app-container">
      {/* Decorative Record Lines in Background */}
      <div className="absolute top-0 left-0 right-0 h-[280px] bg-gradient-to-b from-indigo-50/50 via-transparent to-transparent pointer-events-none z-0" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10 space-y-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-sm gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-13 w-13 rounded-2xl bg-amber-500/10 p-1 border border-amber-500/20 flex items-center justify-center shadow-md shrink-0 overflow-hidden">
              <img 
                src={LOGO_COLOR} 
                alt="Valdir Discos" 
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = "/valdir-logo-color.jpg";
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-950 flex items-center gap-2">
                  Valdir Discos
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                  Intranet / PDV
                </span>
                <span className="hidden sm:inline-block text-[11px] text-amber-700 font-serif italic">
                  Disco é cultura.
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Gestão Integrada de Acervo, Frente de Caixa & Vendas Omnichannel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Online Store Button */}
            <button
              type="button"
              onClick={() => setAppMode('storefront')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-black text-amber-900 transition-all cursor-pointer shadow-xs"
              title="Visualizar a Loja Virtual Pública dos Clientes"
            >
              <Globe className="h-4 w-4 text-amber-700" />
              <span>Loja Online</span>
            </button>

            {/* Quick POS Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md ${
                cartItems.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-200 ring-2 ring-emerald-400/40 animate-pulse'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
              title="Abrir Carrinho de Vendas Físicas / Balcão"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Carrinho PDV</span>
              {cartItems.length > 0 && (
                <span className="bg-slate-950 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-black ml-0.5">
                  {cartItems.length}
                </span>
              )}
            </button>

            {/* Quick POS / Barcode Scanner Modal Button */}
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-200 cursor-pointer"
              title="Abrir Leitor de Código de Barras / QR Code e Frente de Caixa (PDV)"
            >
              <Scan className="h-4 w-4" />
              <span className="hidden sm:inline">Leitor & PDV</span>
              <span className="sm:hidden">PDV</span>
            </button>

            {release && (
              <button
                type="button"
                onClick={handleResetWorkspace}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpar
              </button>
            )}

            {/* Authorization & User Profile Header Badge */}
            <UserHeaderBadge 
              onOpenAccessModal={() => setIsAccessModalOpen(true)}
              onLogoutAndLock={() => setAppMode('storefront')}
              onOpenPinModal={() => setIsIntranetAuthModalOpen(true)}
              onOpenLogoUploadModal={() => setIsLogoUploadModalOpen(true)}
            />

            <a
              href="https://shopee.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs font-bold text-orange-600 transition-colors"
            >
              Shopee
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </header>

        {/* Main Tab Navigation */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto whitespace-nowrap gap-1" id="main-tabs-selector">
          <button
            type="button"
            onClick={() => setMainTab('store_pos')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
              mainTab === 'store_pos'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60'
            }`}
          >
            <Store className="h-4 w-4 text-emerald-300" />
            <span>Loja Física (PDV)</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMainTab('online_orders')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
              mainTab === 'online_orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Pedidos Site
            {customerOrders.length > 0 && (
              <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-md ml-1 ${
                mainTab === 'online_orders' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-900 border border-amber-200'
              }`}>
                {customerOrders.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMainTab('digital_storage')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
              mainTab === 'digital_storage'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
            }`}
          >
            <Cloud className="h-4 w-4 text-amber-400" />
            Música Digital & Nuvem
            {digitalAlbums.length > 0 && (
              <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-md ml-1 ${
                mainTab === 'digital_storage' ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {digitalAlbums.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMainTab('announce')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainTab === 'announce'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Anunciar / Extrair
          </button>
          <button
            type="button"
            onClick={() => setMainTab('catalog')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
              mainTab === 'catalog'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
            }`}
          >
            <Database className="h-4 w-4" />
            Coleção / Estoque
            {savedListings.length > 0 && (
              <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-md ml-1 ${
                mainTab === 'catalog' ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {savedListings.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMainTab('omnichannel')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainTab === 'omnichannel'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
            }`}
          >
            <Globe className="h-4 w-4" />
            Canais / Marketplaces
          </button>
          <button
            type="button"
            onClick={() => setMainTab('playlists')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
              mainTab === 'playlists'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
            }`}
          >
            <ListMusic className="h-4 w-4" />
            Playlists / Sets
            {playlists.length > 0 && (
              <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-md ml-1 ${
                mainTab === 'playlists' ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {playlists.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMainTab('clients')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
              mainTab === 'clients'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
            }`}
          >
            <User className="h-4 w-4" />
            Clientes
            {customers.length > 0 && (
              <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-md ml-1 ${
                mainTab === 'clients' ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {customers.length}
              </span>
            )}
          </button>
        </div>

        {/* Global Notifications */}
        <AnimatePresence mode="popLayout">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5 shadow-sm"
              id="error-alert"
            >
              <AlertTriangle className="h-4.5 w-4.5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-red-900">Ops, algo deu errado:</span>
                <p className="leading-relaxed">{error}</p>
              </div>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-sm"
              id="success-toast"
            >
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {mainTab === 'store_pos' ? (
          <PhysicalStorePos
            listings={savedListings}
            customers={customers}
            cartItems={cartItems}
            salesOrders={salesOrders}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateCartDiscount={handleUpdateCartDiscount}
            onClearCart={handleClearCart}
            onCompleteSale={handleCompleteSale}
            onRefundSale={handleRefundSale}
            onAddCustomer={handleAddCustomer}
            onOpenThermalPrint={(item) => setThermalPrintListing(item)}
            onSelectListing={(item) => {
              handleSelectListing(item);
              setMainTab('announce');
            }}
          />
        ) : mainTab === 'online_orders' ? (
          <OnlineOrdersIntranetTab />
        ) : mainTab === 'digital_storage' ? (
          <DigitalMusicManager
            albums={digitalAlbums}
            onSaveAlbum={handleSaveDigitalAlbum}
            onDeleteAlbum={handleDeleteDigitalAlbum}
            storageProviders={storageProviders}
            onSaveStorageProvider={handleSaveStorageProvider}
            onDeleteStorageProvider={handleDeleteStorageProvider}
          />
        ) : mainTab === 'omnichannel' ? (
          <StoreOmnichannelManager
            listings={savedListings}
            onUpdateListing={handleUpdateListing}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenThermalPrint={(item) => setThermalPrintListing(item)}
            onSelectListing={(item) => {
              handleSelectListing(item);
              setMainTab('announce');
            }}
          />
        ) : mainTab === 'announce' ? (
          <>
            {/* Input Extraction Panel */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4" id="input-extraction-section">
          {/* Mode Tabs */}
          <div className="flex border-b border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              onClick={() => { setActiveTab('url'); setError(null); }}
              className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all cursor-pointer ${
                activeTab === 'url'
                  ? 'border-indigo-600 text-indigo-600 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Buscar por Link do Discogs
            </button>
            <button
              onClick={() => { setActiveTab('manual'); setError(null); }}
              className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'border-indigo-600 text-indigo-600 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Pesquisa Inteligente por Nome (Sem Link)
            </button>
            <button
              onClick={() => { setActiveTab('custom_manual'); setError(null); }}
              className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'custom_manual'
                  ? 'border-indigo-600 text-indigo-600 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Disc className="h-3.5 w-3.5" />
              Cadastro Manual Direto
            </button>
            <button
              onClick={() => { setActiveTab('batch'); setError(null); }}
              className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'batch'
                  ? 'border-indigo-600 text-indigo-600 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              Importação em Lote (Fila)
            </button>
          </div>

          {activeTab === 'custom_manual' ? (
            <ManualRegistrationForm
              onComplete={({ release: newRel, condition: newCond, pricing: newPrice, drawer: newDraw, description: newDesc, coverImage: newCov, isGarimpo: newGarimpo, garimpoDetails: newGarimpoDetails }) => {
                setRelease(newRel);
                setCondition(newCond);
                setPricing(newPrice);
                setDrawer(newDraw);
                if (newCov) {
                  setCustomImages([newCov]);
                  setActiveCover(newCov);
                  setCoverSource('real');
                }
                const calcPrice = newPrice.directPrice || newPrice.basePriceBrl;
                const locStr = newDraw ? ` - [Loc: ${newDraw}]` : '';
                const initialDesc = [
                  newDraw ? `📍 **Loc:** ${newDraw}\n` : '',
                  `📷 **Observação importante:** fotos originais do produto\n`,
                  `🎵 **Álbum:** ${newRel.title}`,
                  `🎤 **Artista:** ${newRel.artist}`,
                  newRel.year ? `📅 **Ano:** ${newRel.year}` : '',
                  newRel.label ? `🏷️ **Selo:** ${newRel.label}` : '',
                  `\n🔍 **Estado de Conservação:**`,
                  `• Mídia: ${newCond.mediaCondition} - ${newCond.mediaDetails}`,
                  `• Capa: ${newCond.sleeveCondition} - ${newCond.sleeveDetails}`,
                  newGarimpo ? `\n🔥 **Sessão Garimpo & Oportunidades:** ${newGarimpoDetails || 'Preço promocional / Oportunidade para colecionadores'}` : '',
                  newDesc ? `\nℹ️ **Observações do Disco:**\n${newDesc}` : '',
                  `\n🧼 **Higienização:** Disco 100% higienizado profissionalmente com plásticos protetores novos inclusos.`
                ].filter(Boolean).join('\n');

                setShopeeListing({
                  title: `${newRel.artist} - ${newRel.title}${locStr}`.slice(0, 120),
                  description: initialDesc,
                  suggestedPrice: calcPrice,
                  hashtags: ['#vinil', '#discodevinil', '#lp', '#valdir_discos', ...(newGarimpo ? ['#garimpo', '#promocao'] : [])]
                });

                setMercadoLivreListing({
                  title: `Vinil LP ${newRel.artist} - ${newRel.title}${newDraw ? ` [Loc:${newDraw}]` : ''}`.slice(0, 60),
                  description: initialDesc,
                  suggestedPrice: calcPrice
                });

                setSuccessMsg(`Disco "${newRel.artist} - ${newRel.title}" cadastrado com sucesso!`);
              }}
            />
          ) : activeTab !== 'batch' ? (
            <form onSubmit={handleExtract} className="space-y-4">
              {activeTab === 'url' ? (
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cole o link da Release do Discogs</label>
                   <div className="flex flex-col sm:flex-row gap-2">
                     <input
                       type="url"
                       placeholder="Ex: https://www.discogs.com/release/249504-The-Beatles-Abbey-Road"
                       value={discogsUrl}
                       onChange={(e) => setDiscogsUrl(e.target.value)}
                       disabled={loading}
                       className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-sm text-slate-700 transition-all placeholder-slate-400 disabled:opacity-50"
                     />
                     <button
                       type="submit"
                       disabled={loading}
                       className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400/50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0 shadow-lg shadow-indigo-100"
                     >
                       {loading ? (
                         <>
                           <RefreshCw className="h-4 w-4 animate-spin" />
                           Extraindo...
                         </>
                       ) : (
                         <>
                           <Disc className="h-4 w-4" />
                           Extrair Detalhes
                         </>
                       )}
                     </button>
                   </div>
                   <p className="text-[10px] text-slate-400 leading-relaxed">
                     Dica: Você também pode colar apenas o número ID da Release (ex: <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">249504</code>). Links de Masters também são resolvidos para a edição principal.
                   </p>
                 </div>
              ) : (
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Artista, Nome do Álbum e Formato</label>
                   <div className="flex flex-col sm:flex-row gap-2">
                     <input
                       type="text"
                       placeholder="Ex: Legião Urbana - Dois (Vinil 1986 EMI) ou Queen - Greatest Hits (CD)"
                       value={manualQuery}
                       onChange={(e) => setManualQuery(e.target.value)}
                       disabled={loading}
                       className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-sm text-slate-700 transition-all placeholder-slate-400 disabled:opacity-50"
                     />
                     <button
                       type="submit"
                       disabled={loading}
                       className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0 shadow-lg shadow-indigo-100"
                     >
                       {loading ? (
                         <>
                           <RefreshCw className="h-4 w-4 animate-spin" />
                           Gerando Dados...
                         </>
                       ) : (
                         <>
                           <Sparkles className="h-4 w-4 text-indigo-200" />
                           Localizar com IA
                         </>
                       )}
                     </button>
                   </div>
                   <p className="text-[10px] text-slate-400 leading-relaxed">
                     Excelente para quando você não tem o link em mãos. Nossa inteligência artificial pesquisa nos registros históricos musicais para reconstituir a tracklist original, ano, gravadora e catalogação exatos.
                   </p>
                 </div>
              )}
  
              {/* Shared Loc Input Section */}
              <div className="pt-3 border-t border-slate-100" id="extraction-gaveta-section">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                    Loc
                  </span>
                  <label className="text-xs font-bold text-slate-700">Onde você vai guardar este produto?</label>
                </div>
                <input
                  type="text"
                  placeholder="Ex: 4, Prateleira B-3, Caixa 10... (Opcional)"
                  value={drawer}
                  onChange={(e) => setDrawer(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none rounded-xl text-sm text-slate-700 transition-all placeholder-slate-400 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  A localização indicada (Loc) será adicionada automaticamente no fim do título gerado e na primeira linha da descrição do anúncio na Shopee.
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleProcessBatch} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Fila de Links do Discogs ou Artistas/Álbuns (Um por linha)</label>
                <textarea
                  rows={5}
                  disabled={isProcessingBatch}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder="Ex:&#10;https://www.discogs.com/release/249504-The-Beatles-Abbey-Road&#10;249504&#10;Pink Floyd - Dark Side of the Moon&#10;Queen - Greatest Hits"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none rounded-xl text-sm text-slate-700 transition-all font-mono placeholder-slate-400 disabled:opacity-60"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Insira URLs do Discogs, IDs de lançamentos ou termos de pesquisa inteligentes. Cada linha representa um item que será extraído, terá anúncio gerado por IA e será salvo automaticamente no banco de dados!
                </p>
              </div>

              {/* Batch Presets Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Loc de Destino (Gaveta)</label>
                  <input
                    type="text"
                    disabled={isProcessingBatch}
                    placeholder="Ex: Gaveta C"
                    value={batchLoc}
                    onChange={(e) => setBatchLoc(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 text-slate-700 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Preset: Estado da Mídia</label>
                  <select
                    disabled={isProcessingBatch}
                    value={batchMediaPreset}
                    onChange={(e) => setBatchMediaPreset(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 text-slate-600 outline-none cursor-pointer"
                  >
                    <option value="NM">NM (Como Novo)</option>
                    <option value="VG+">VG+ (Excelente/Muito Bom +)</option>
                    <option value="VG">VG (Muito Bom)</option>
                    <option value="G+">G+ (Bom/Razoável +)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Preset: Estado da Capa</label>
                  <select
                    disabled={isProcessingBatch}
                    value={batchSleevePreset}
                    onChange={(e) => setBatchSleevePreset(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 text-slate-600 outline-none cursor-pointer"
                  >
                    <option value="NM">NM (Como Nova)</option>
                    <option value="VG+">VG+ (Excelente/Muito Boa +)</option>
                    <option value="VG">VG (Muito Boa)</option>
                    <option value="G+">G+ (Boa/Razoável +)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 justify-end">
                {isProcessingBatch ? (
                  <button
                    type="button"
                    onClick={handleCancelBatch}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-100"
                  >
                    <span className="h-2 w-2 bg-white rounded-full animate-ping" />
                    Parar Processamento
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-100"
                  >
                    <Database className="h-4 w-4" />
                    Iniciar Processamento em Lote
                  </button>
                )}
              </div>

              {/* Queue Progress Dashboard */}
              {batchItems.length > 0 && (
                <div className="mt-4 border border-slate-100 bg-slate-50/50 rounded-xl p-4 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Status da Fila ({batchItems.filter(i => i.status === 'completed').length} de {batchItems.length} concluídos)</span>
                    {isProcessingBatch && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full animate-pulse">Processando Fila...</span>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(batchItems.filter(i => i.status === 'completed' || i.status === 'error').length / batchItems.length) * 100}%` }}
                    />
                  </div>

                  {/* List of items */}
                  <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 border border-slate-100 bg-white rounded-lg p-2">
                    {batchItems.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-slate-100 text-xs transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-slate-400 font-bold font-mono text-[10px] w-4">{index + 1}.</span>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-slate-700 truncate block max-w-xs sm:max-w-md" title={item.input}>{item.input}</span>
                            {item.artistAlbum && (
                              <span className="text-[10px] text-indigo-600 font-bold block truncate">{item.artistAlbum}</span>
                            )}
                            {item.error && (
                              <span className="text-[10px] text-rose-500 font-medium block truncate">⚠️ {item.error}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.status === 'pending' && (
                            <span className="bg-slate-100 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase">Na Fila</span>
                          )}
                          {item.status === 'processing' && (
                            <span className="bg-indigo-100 text-indigo-700 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase animate-pulse flex items-center gap-1">
                              <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Extraindo
                            </span>
                          )}
                          {item.status === 'completed' && (
                            <div className="flex items-center gap-1.5">
                              <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[10px] px-2 py-0.5 rounded-md uppercase flex items-center gap-0.5">
                                <Check className="h-3 w-3 text-emerald-600" /> Salvo
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const saved = savedListings.find(l => l.id === item.savedListingId);
                                  if (saved) {
                                    setQrModalListing(saved);
                                    setQrModalOpen(true);
                                  }
                                }}
                                className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-bold px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                title="Gerar QR Code & Etiqueta de Cadastro"
                              >
                                <QrCode className="h-3 w-3 text-indigo-300" /> QR
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const saved = savedListings.find(l => l.id === item.savedListingId);
                                  if (saved) {
                                    setRelease(saved.release);
                                    setCondition(saved.condition);
                                    setPricing(saved.pricing);
                                    setDrawer(saved.drawer || '');
                                    setShopeeListing(saved.shopee);
                                    setMercadoLivreListing(saved.mercadolivre);
                                    setSuccessMsg(`Carregado no Workspace: ${saved.release.title}`);
                                  }
                                }}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer underline"
                              >
                                Visualizar
                              </button>
                            </div>
                          )}
                          {item.status === 'error' && (
                            <span className="bg-rose-100 text-rose-700 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase">Erro</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}
        </section>

        {/* Main Workspace Layout (Renders once release details are loaded) */}
        {release ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="workspace-grid">
            
            {/* LEFT COLUMN: Metadata Review and Grading (7 cols on lg) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Album Metadata Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="album-metadata-card">
                {/* Album Cover Area */}
                <div className="relative h-[180px] bg-slate-50 border-b border-slate-200/80 flex items-center justify-center overflow-hidden">
                  {displayCover && displayCover.trim() !== '' ? (
                    <>
                      {/* Blurred background cover */}
                      <img
                        src={displayCover}
                        alt="Background blur"
                        className="absolute inset-0 h-full w-full object-cover blur-md opacity-35 select-none scale-110"
                        referrerPolicy="no-referrer"
                      />
                      {/* Sharp front cover */}
                      <img
                        src={displayCover}
                        alt={release.title}
                        className="relative h-[150px] w-[150px] object-cover shadow-xl rounded-md border border-slate-200 z-10"
                        referrerPolicy="no-referrer"
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 z-10 p-4">
                      <Disc className="h-16 w-16 mb-2 animate-spin text-slate-300" style={{ animationDuration: '12s' }} />
                      <span className="text-xs text-slate-500 font-medium font-semibold">Foto não disponível</span>
                      <span className="text-[9px] text-slate-400 text-center mt-1">Carregue uma foto real do disco abaixo</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold bg-slate-900/90 text-slate-100 px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1.5 backdrop-blur-sm shadow-sm">
                      {getFormatIcon(release.formats?.[0]?.name || '')}
                      {release.formats?.[0]?.name || 'Format'}
                    </span>
                    {isImportedCountry(release.country) && (
                      <span className="text-[10px] font-extrabold bg-amber-500 text-white px-2.5 py-1 rounded border border-amber-600 flex items-center gap-1 backdrop-blur-sm shadow-sm uppercase tracking-wider">
                        <Globe className="h-3 w-3 shrink-0" />
                        Importado ({release.country})
                      </span>
                    )}
                    {release.isManual && (
                      <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 backdrop-blur-sm flex items-center gap-1 shadow-sm">
                        <Sparkles className="h-3 w-3" />
                        IA
                      </span>
                    )}
                  </div>

                  {/* Floating Price sticker on art */}
                  {showPriceOnArt && (
                    <div className="absolute bottom-4 right-4 z-30 animate-scaleUp">
                      <div className="bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-2xl border-4 border-white shadow-2xl flex flex-col items-center justify-center -rotate-8 transform hover:rotate-0 transition-all duration-300">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-950/90 leading-none mb-1">Preço</span>
                        <span className="text-2xl font-black leading-none font-mono text-slate-950">
                          R$ {Math.round(priceOnArtType === 'shopee' ? calculateShopeePrice(pricing) : (pricing.directPrice ?? pricing.basePriceBrl)).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Album Specs Details */}
                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identificação do Álbum</span>
                    </div>
                    <input
                      type="text"
                      value={release.title}
                      onChange={(e) => setRelease({ ...release, title: e.target.value })}
                      placeholder="Título do Álbum"
                      className="w-full text-lg font-bold text-slate-950 tracking-tight px-2 py-1 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-lg focus:outline-none transition-all"
                      title="Clique para editar o título do álbum"
                    />
                    <input
                      type="text"
                      value={release.artist}
                      onChange={(e) => setRelease({ ...release, artist: e.target.value })}
                      placeholder="Artista / Banda"
                      className="w-full text-sm font-semibold text-indigo-600 px-2 py-0.5 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-lg focus:outline-none transition-all"
                      title="Clique para editar o artista / banda"
                    />
                  </div>

                  {/* Technical Specs Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Gravadora</span>
                      <input
                        type="text"
                        value={release.label || ''}
                        onChange={(e) => setRelease({ ...release, label: e.target.value })}
                        className="text-xs font-bold text-slate-700 w-full bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Gravadora"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Catálogo</span>
                      <input
                        type="text"
                        value={release.catno || ''}
                        onChange={(e) => setRelease({ ...release, catno: e.target.value })}
                        className="text-xs font-bold text-slate-700 w-full bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Catálogo"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Ano de Lançamento</span>
                      <input
                        type="text"
                        value={release.year || ''}
                        onChange={(e) => setRelease({ ...release, year: e.target.value })}
                        className="text-xs font-bold font-mono text-slate-700 w-full bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Ano"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-slate-400 font-semibold text-[10px] uppercase">País de Origem</span>
                        {isImportedCountry(release.country) && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 font-black text-[9px] px-1.5 py-0.2 rounded uppercase tracking-wider">
                            Importado
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={release.country || 'Brasil'}
                        onChange={(e) => setRelease({ ...release, country: e.target.value })}
                        className={`text-xs font-bold rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 border transition-all ${
                          isImportedCountry(release.country)
                            ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-black'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                        placeholder="ex: US, Japão, UK, Brasil"
                        title="Edite o país de origem do disco"
                      />
                    </div>
                  </div>

                  {/* Observações / Descrição do Disco */}
                  <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="h-3 w-3 text-indigo-600" />
                        Observações e Detalhes do Disco
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={release.notes || ''}
                      onChange={(e) => {
                        const newNotes = e.target.value;
                        setRelease({ ...release, notes: newNotes });
                      }}
                      placeholder="Ex: Primeira prensagem nacional, encarte duplo incluso, selo azul..."
                      className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  {/* Gêneros / Estilos Tags */}
                  {(release.genres?.length || release.styles?.length) && (
                    <div className="flex flex-wrap gap-1">
                      {release.genres?.slice(0, 2).map((g, idx) => (
                        <span key={`genre-${g}-${idx}`} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                          {g}
                        </span>
                      ))}
                      {release.styles?.slice(0, 2).map((s, idx) => (
                        <span key={`style-${s}-${idx}`} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tracklist component */}
                  <TracklistViewer 
                    tracklist={release.tracklist} 
                    isCapturing={isCapturing}
                    onUpdateTracklist={(updated) => setRelease({ ...release, tracklist: updated })}
                  />

                  {/* Export Button - Hidden during screenshot capture */}
                  {!isCapturing && (
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      {/* Selection of photo to use on the art (only if there are custom photos) */}
                      {customImages.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <Image className="h-4 w-4 text-indigo-500" />
                            <span>Qual foto usar na arte do álbum?</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 p-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => {
                                setCoverSource('discogs');
                                setActiveCover(release?.coverImage || '');
                              }}
                              className={`py-1.5 rounded-md transition-all cursor-pointer ${
                                coverSource === 'discogs'
                                  ? 'bg-indigo-600 text-white shadow-sm font-black'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              Foto do Discogs
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCoverSource('real');
                                if (customImages.length > 0 && (!activeCover || !customImages.includes(activeCover))) {
                                  setActiveCover(customImages[0]);
                                }
                              }}
                              className={`py-1.5 rounded-md transition-all cursor-pointer ${
                                coverSource === 'real'
                                  ? 'bg-indigo-600 text-white shadow-sm font-black'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              Foto Real do Produto
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Toggle to include price on the art */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={showPriceOnArt}
                              onChange={(e) => setShowPriceOnArt(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/50"
                            />
                            <span className="text-xs font-bold text-slate-700">Inserir preço na arte do álbum</span>
                          </label>
                        </div>
                        
                        {showPriceOnArt && (
                          <div className="grid grid-cols-2 gap-1.5 p-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => setPriceOnArtType('shopee')}
                              className={`py-1.5 rounded-md transition-all cursor-pointer ${
                                priceOnArtType === 'shopee'
                                  ? 'bg-indigo-600 text-white shadow-sm font-black'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              Preço Shopee (R$ {Math.round(calculateShopeePrice(pricing))})
                            </button>
                            <button
                              type="button"
                              onClick={() => setPriceOnArtType('direct')}
                              className={`py-1.5 rounded-md transition-all cursor-pointer ${
                                priceOnArtType === 'direct'
                                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              Direto/WhatsApp (R$ {Math.round(pricing.directPrice ?? pricing.basePriceBrl)})
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleExportImage}
                        disabled={exportingImage}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-100 disabled:opacity-50"
                      >
                        {exportingImage ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Gerando Foto...
                          </>
                        ) : (
                          <>
                            <Camera className="h-3.5 w-3.5" />
                            Gerar Foto do Álbum (WhatsApp / Redes)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Fotos Reais do Produto Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4" id="workspace-photos-card">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Camera className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">Fotos Reais do Produto</h3>
                  {customImages.length > 0 && (
                    <span className="ml-auto text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                      {customImages.length} foto(s)
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Por padrão, o app exibe e exporta a arte oficial do Discogs. Se quiser, você pode carregar as fotos reais do seu disco abaixo para salvar no banco de dados e usar como capa.
                </p>

                {/* Upload Trigger Area */}
                <div className="relative group border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 transition-all bg-slate-50 hover:bg-indigo-50/20 text-center cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="real-photo-file-input"
                  />
                  <div className="space-y-1.5 pointer-events-none">
                    <div className="mx-auto h-8 w-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-105 transition-all shadow-sm">
                      <Upload className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Carregar Fotos Reais</span>
                      <span className="text-[9px] text-slate-400">Clique ou arraste imagens aqui (Max 5MB cada)</span>
                    </div>
                  </div>
                </div>

                {/* Image Selection Switcher / Caixa de Seleção */}
                {customImages.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Qual foto você está usando agora? (Identificação)
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors select-none">
                        <input
                          type="radio"
                          name="photoSourceMain"
                          checked={coverSource === 'discogs'}
                          onChange={() => {
                            setCoverSource('discogs');
                            setActiveCover(release?.coverImage || '');
                          }}
                          className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700">Foto do Discogs</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors select-none">
                        <input
                          type="radio"
                          name="photoSourceMain"
                          checked={coverSource === 'real'}
                          onChange={() => {
                            setCoverSource('real');
                            if (customImages.length > 0 && (!activeCover || !customImages.includes(activeCover))) {
                              setActiveCover(customImages[0]);
                            }
                          }}
                          className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700">Fotos Reais</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Previews and Cover Selector Grid */}
                {(release.coverImage || customImages.length > 0) && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Selecione a Foto Ativa (para exibir/exportar):
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {/* Default Discogs Cover option */}
                      {release.coverImage && release.coverImage.trim() !== '' && (
                        <div 
                          onClick={() => {
                            setActiveCover(release.coverImage || '');
                            setCoverSource('discogs');
                          }}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all shadow-sm ${
                            coverSource === 'discogs'
                              ? 'border-indigo-600 ring-2 ring-indigo-500/20 scale-95'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img 
                            src={release.coverImage.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(release.coverImage)}` : release.coverImage} 
                            alt="Capa Oficial" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-0 inset-x-0 text-[8px] font-extrabold text-white bg-slate-900/80 py-0.5 text-center leading-none">
                            Discogs
                          </span>
                        </div>
                      )}

                      {/* Custom uploaded images */}
                      {customImages.filter(img => img && img.trim() !== '').map((img, idx) => (
                        <div key={idx} className="relative group aspect-square">
                          <div 
                            onClick={() => {
                              setActiveCover(img);
                              setCoverSource('real');
                            }}
                            className={`w-full h-full rounded-lg overflow-hidden border-2 cursor-pointer transition-all shadow-sm ${
                              coverSource === 'real' && activeCover === img
                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 scale-95'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <img 
                              src={img} 
                              alt={`Foto Real ${idx + 1}`} 
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 inset-x-0 text-[8px] font-extrabold text-white bg-indigo-900/85 py-0.5 text-center leading-none">
                              Foto {idx + 1}
                            </span>
                          </div>

                          {/* Delete button (shows on hover) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(idx);
                            }}
                            className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 cursor-pointer shadow-md transition-transform hover:scale-110 z-20"
                            title="Remover foto"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Editable Loc (Storage Location) Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3" id="workspace-gaveta-card">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                    Loc
                  </span>
                  <h3 className="text-sm font-bold text-slate-800">Localização de Armazenamento</h3>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Defina a Localização (Loc) deste produto
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 4, Prateleira B-3, Caixa 10..."
                    value={drawer}
                    onChange={(e) => setDrawer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none rounded-xl text-sm text-slate-700 transition-all placeholder-slate-400 font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    Clique em <strong className="text-slate-600 font-bold">Atualizar Anúncio</strong> à direita para aplicar a nova localização ao título e descrição do anúncio!
                  </p>
                </div>
              </div>

              {/* Destinação do Disco (Venda vs Coleção Pessoal) Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4" id="workspace-destinacao-card">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Heart className={`h-5 w-5 ${isPersonal ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-slate-400'}`} />
                  <h3 className="text-sm font-bold text-slate-800">Destinação do Acervo</h3>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Defina se este disco está sendo cadastrado para venda na loja ou se faz parte do seu <strong className="text-slate-700">acervo pessoal privado</strong>.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {/* Option 1: Venda */}
                  <button
                    type="button"
                    onClick={() => setIsPersonal(false)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      !isPersonal
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600 text-indigo-950 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold'
                    }`}
                  >
                    <ShoppingBag className={`h-5 w-5 mb-1.5 ${!isPersonal ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs">Estoque de Vendas</span>
                    <span className="text-[9px] text-slate-400 font-normal mt-0.5">Disponível na loja</span>
                  </button>

                  {/* Option 2: Coleção Pessoal */}
                  <button
                    type="button"
                    onClick={() => setIsPersonal(true)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isPersonal
                        ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500 text-rose-950 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold'
                    }`}
                  >
                    <Heart className={`h-5 w-5 mb-1.5 ${isPersonal ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                    <span className="text-xs">Coleção Pessoal</span>
                    <span className="text-[9px] text-slate-400 font-normal mt-0.5">Meu acervo privado</span>
                  </button>
                </div>

                {isPersonal && (
                  <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-3 text-left">
                    <span className="text-[10px] font-bold text-rose-700 block mb-0.5">💝 Item de Coleção Pessoal</span>
                    <span className="text-[10px] text-rose-600 leading-normal block">
                      Este álbum será catalogado sob o status de coleção pessoal e os avisos de anúncios ou taxas da Shopee serão desativados.
                    </span>
                  </div>
                )}
              </div>

              {/* Sessão Garimpo & Oportunidades Card */}
              <div 
                className={`rounded-2xl border p-5 space-y-4 transition-all shadow-sm ${
                  isGarimpo
                    ? 'bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white border-amber-300 ring-1 ring-amber-400/30'
                    : 'bg-white border-slate-200 hover:border-amber-200'
                }`} 
                id="workspace-garimpo-card"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Flame className={`h-5 w-5 ${isGarimpo ? 'text-amber-600 fill-amber-500 animate-pulse' : 'text-slate-400'}`} />
                    <h3 className="text-sm font-bold text-slate-800">Sessão Garimpo & Oportunidades</h3>
                  </div>
                  {isGarimpo && (
                    <span className="px-2.5 py-0.5 bg-amber-600 text-white text-[10px] font-black rounded-md uppercase tracking-wider shadow-xs">
                      Ativo no Garimpo
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Marque esta opção para discos de <strong>menor valor de mercado</strong>, itens com <strong>avarias/detalhes físicos</strong> na mídia ou capa, ou pechinchas de oportunidade para colecionadores.
                </p>

                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 hover:bg-amber-50/60 p-3 rounded-xl border border-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={isGarimpo}
                    onChange={(e) => setIsGarimpo(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Colocar este disco na Sessão Garimpo
                  </span>
                </label>

                {isGarimpo && (
                  <div className="space-y-2 pt-2 border-t border-amber-200/70">
                    <label className="text-xs font-bold text-amber-950 block">
                      Descreva o problema do disco e o porquê dele ter menor valor de mercado:
                    </label>
                    <textarea
                      rows={3}
                      value={garimpoDetails}
                      onChange={(e) => setGarimpoDetails(e.target.value)}
                      placeholder="Ex: Mídia com risco superficial na faixa 2 que gera leve estalo / Capa com desgaste nas bordas e fita adesiva antiga / Edição popular de menor valor de mercado para desapego..."
                      className="w-full text-xs text-amber-950 bg-white border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 focus:outline-none transition-all placeholder-amber-400/70 font-medium"
                    />
                    <p className="text-[10px] text-amber-800/80 leading-relaxed font-medium">
                      💡 Esta justificativa é exibida com transparência no anúncio e no card do produto na loja para orientar o cliente.
                    </p>
                  </div>
                )}
              </div>

              {/* Grading Condition Box */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <SleeveMediaConditionSelector
                  condition={condition}
                  onChange={(updated) => setCondition(updated)}
                  formatName={release?.formats?.[0]?.name}
                />
              </div>

            </div>

            {/* RIGHT COLUMN: Pricing & Shopee Listing Output (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Pricing Calculator component */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <PricingCalculator
                  pricing={pricing}
                  onChange={(updated) => setPricing(updated)}
                  discogsLowestPriceUsd={release.lowestPriceUsd}
                />
                
                {/* Manual update action for description */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerateAd}
                    disabled={generatingAd}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-100"
                  >
                    {generatingAd ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Re-calculando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Atualizar Anúncio com Novas Configurações
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Combined Platform Output Ad Listing Display */}
              <AnimatePresence mode="popLayout">
                {(shopeeListing || mercadoLivreListing) ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5"
                    id="ad-output-panel"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Anúncio Pronto com IA</h3>
                          <p className="text-[10px] text-slate-400 font-medium">Textos formatados sob medida para o Valdir</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Tab switcher */}
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setActivePlatform('shopee')}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              activePlatform === 'shopee'
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Shopee
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePlatform('mercadolivre')}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              activePlatform === 'mercadolivre'
                                ? 'bg-yellow-500 text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Mercado Livre
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setQrModalListing({
                              id: activeListingId || undefined,
                              barcode: release.barcode || (release.barcodes && release.barcodes[0]),
                              release,
                              condition,
                              pricing,
                              drawer
                            });
                            setQrModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer bg-slate-900 hover:bg-slate-800 text-white shadow-sm border border-slate-800"
                          title="Gerar e imprimir etiqueta com QR Code deste álbum"
                        >
                          <QrCode className="h-3.5 w-3.5 text-indigo-300" />
                          <span>QR Code</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setThermalPrintListing({
                              id: activeListingId || undefined,
                              barcode: release.barcode || (release.barcodes && release.barcodes[0]),
                              release,
                              condition,
                              pricing,
                              drawer,
                              salesChannels: activeSalesChannels
                            });
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-xs"
                          title="Imprimir Cupom Térmico (58mm / 80mm)"
                        >
                          <Printer className="h-3.5 w-3.5 text-amber-700" />
                          <span>Térmica</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveListing}
                          disabled={isSavingListing}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                            isSavedSuccess
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300 shadow-emerald-200 scale-105'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                          }`}
                          title="Salvar Rascunho no Histórico Local e Nuvem"
                        >
                          {isSavingListing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                              <span>Salvando...</span>
                            </>
                          ) : isSavedSuccess ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-white animate-bounce" />
                              <span>Salvo com Sucesso! ✓</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              <span>{activeListingId ? 'Atualizar Anúncio' : 'Salvar Anúncio'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Sales Channels Multi-Select Selector */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-indigo-600 shrink-0" />
                        <div>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Canais de Venda Ativos:</span>
                          <span className="text-[10px] text-slate-500">Marque onde este produto está anunciado / disponível</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(['physical_store', 'online_store', 'shopee', 'mercadolivre'] as SalesChannel[]).map(ch => {
                          const meta = getSalesChannelMeta(ch);
                          const isSelected = activeSalesChannels.includes(ch);
                          const channelIcon = ch === 'physical_store' ? '🏬' : ch === 'online_store' ? '🌐' : ch === 'shopee' ? '🛍️' : '💛';
                          return (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setActiveSalesChannels(prev => prev.length > 1 ? prev.filter(c => c !== ch) : prev);
                                } else {
                                  setActiveSalesChannels(prev => [...prev, ch]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                                isSelected
                                  ? `${meta.badgeColor} shadow-xs ring-1 ring-indigo-300 font-black`
                                  : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-90'
                              }`}
                            >
                              <span>{channelIcon}</span>
                              <span>{meta.name}</span>
                              {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Professional Description & Listing Editor with Snippets & Templates */}
                    <DiscDescriptionEditor
                      release={release}
                      condition={condition}
                      pricing={pricing}
                      drawer={drawer}
                      shopeeListing={shopeeListing}
                      mercadoLivreListing={mercadoLivreListing}
                      onChangeShopeeTitle={(title) => {
                        if (shopeeListing) {
                          setShopeeListing({ ...shopeeListing, title });
                        }
                      }}
                      onChangeMlTitle={(title) => {
                        if (mercadoLivreListing) {
                          setMercadoLivreListing({ ...mercadoLivreListing, title });
                        }
                      }}
                      onChangeShopeeDescription={(desc) => {
                        if (shopeeListing) {
                          setShopeeListing({ ...shopeeListing, description: desc });
                        }
                      }}
                      onChangeMlDescription={(desc) => {
                        if (mercadoLivreListing) {
                          setMercadoLivreListing({ ...mercadoLivreListing, description: desc });
                        }
                      }}
                      onRegenerateAi={handleGenerateAd}
                      isGeneratingAi={generatingAd}
                    />

                    {/* Bottom Guide Info */}
                    <div className="flex gap-2.5 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 leading-relaxed">
                      <Info className="h-4.5 w-4.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Dica de Publicação Rápida:</p>
                        <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-600 font-medium">
                          <li>Use os botões de <strong>Tags Rápidas</strong> acima para inserir informações padronizadas no anúncio sem precisar digitar.</li>
                          <li>Clique em <strong>Salvar Anúncio</strong> no topo para arquivar este produto e gerar seu QR Code e etiqueta térmica.</li>
                          <li>Você pode alternar entre <strong>Shopee</strong> e <strong>Mercado Livre</strong> com 1 clique.</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center">
                    <Sparkles className="h-10 w-10 text-slate-300 animate-pulse mb-3" />
                    <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed">
                      Calcule as condições do vinil e os preços acima, em seguida clique em atualizar para carregar a IA e construir os anúncios sob medida.
                    </p>
                  </div>
                )}
              </AnimatePresence>

            </div>

          </div>
        ) : (
          /* Empty Workspace Welcome Screen */
          <div className="py-12 bg-white border border-slate-200 shadow-sm rounded-3xl text-center max-w-2xl mx-auto space-y-5" id="empty-workspace-state">
            <div className="h-14 w-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
              <Disc className="h-8 w-8 text-indigo-600 animate-spin" style={{ animationDuration: '24s' }} />
            </div>
            <div className="space-y-1.5 px-4">
              <h2 className="text-lg font-bold text-slate-800">Painel do Valdir Discos</h2>
              <p className="text-xs text-slate-500 max-w-[420px] mx-auto leading-relaxed">
                Insira um link do Discogs ou faça uma busca direta no topo para começar. Nós faremos a varredura completa do álbum e montaremos a calculadora de preços e o anúncio.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md mx-auto pt-4 px-4 text-left">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/50 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase">1. Extrair</span>
                <p className="text-[10px] text-slate-500 leading-normal">Coleta automática de faixas, gravadora e ano diretamente da fonte.</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/50 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">2. Calcular</span>
                <p className="text-[10px] text-slate-500 leading-normal">Reverse-engineering de taxas e comissões da Shopee.</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/50 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-amber-600 uppercase">3. Vender</span>
                <p className="text-[10px] text-slate-500 leading-normal">Textos otimizados com hashtags copiáveis em um único clique.</p>
              </div>
            </div>
          </div>
        )}
          </>
        ) : mainTab === 'catalog' ? (
          <OrganizedCatalog
            listings={savedListings}
            onSelect={handleSelectListing}
            onDelete={(id) => requestGuardedAction(permissions.canDeleteListings, () => handleDeleteListing(id), 'Excluir disco permanentemente do acervo')}
            onUpdate={handleUpdateListing}
            onSwitchToEditor={() => setMainTab('announce')}
            customers={customers}
            onAddCustomer={handleAddCustomer}
          />
        ) : mainTab === 'playlists' ? (
          <DjPlaylists
            playlists={playlists}
            listings={savedListings}
            onSavePlaylists={handleSavePlaylists}
          />
        ) : (
          <CustomersManager
            customers={customers}
            listings={savedListings}
            onAddCustomer={handleAddCustomer}
            onDeleteCustomer={async (id) => {
              requestGuardedAction(
                permissions.canManageCustomers && permissions.canDeleteListings,
                () => { void handleDeleteCustomer(id); },
                'Excluir cliente da base'
              );
            }}
            onUpdateListing={handleUpdateListing}
          />
        )}

        {/* Global Floating Save Confirmation Toast */}
        <AnimatePresence>
          {saveToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-start gap-3.5 max-w-sm backdrop-blur-md"
            >
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5 border border-emerald-500/30">
                <CheckCircle className="h-6 w-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-emerald-400">{saveToast.message}</h4>
                  <button 
                    onClick={() => setSaveToast(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-200 truncate font-semibold">{saveToast.title}</p>
                <p className="text-[11px] text-slate-400">Gravado no Histórico e na Nuvem (Firebase).</p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      const target = savedListings.find(l => l.id === saveToast.id) || {
                        id: saveToast.id,
                        release,
                        condition,
                        pricing,
                        drawer
                      };
                      setQrModalListing(target);
                      setQrModalOpen(true);
                      setSaveToast(null);
                    }}
                    className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  >
                    <QrCode className="h-3.5 w-3.5 text-indigo-400" />
                    Ver QR Code
                  </button>
                  <button
                    onClick={() => {
                      setMainTab('catalog');
                      setSaveToast(null);
                    }}
                    className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  >
                    Ver no Catálogo <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dedicated QR Code Modal */}
        <DiscQRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          listing={qrModalListing}
          onSaveLabel={handleSaveLabel}
        />

        {/* Dedicated Thermal Ticket Print Modal */}
        <ThermalPrintModal
          isOpen={!!thermalPrintListing}
          onClose={() => setThermalPrintListing(null)}
          listing={thermalPrintListing}
          onSaveLabel={handleSaveLabel}
        />

        {/* Dedicated Barcode/QR Code Scanner & Quick POS Modal */}
        <BarcodeQrScannerModal
          isOpen={isScannerOpen}
          onClose={() => {
            setIsScannerOpen(false);
            setInitialScannerCode(undefined);
          }}
          listings={savedListings}
          initialCode={initialScannerCode}
          onSelectListing={(item) => {
            handleSelectListing(item);
            setMainTab('announce');
          }}
          onUpdateListing={handleUpdateListing}
          customers={customers}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onOpenCart={() => setIsCartOpen(true)}
        />

        {/* POS Cart Drawer for Physical Counter Sales */}
        <PosCartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onRemoveItem={handleRemoveFromCart}
          onUpdateDiscount={handleUpdateCartDiscount}
          onClearCart={handleClearCart}
          onCompleteSale={handleCompleteSale}
          customers={customers}
          onOpenScanner={() => {
            setIsCartOpen(false);
            setIsScannerOpen(true);
          }}
        />

        {/* Logo Upload Modal for Mobile */}
        <LogoUploadModal
          isOpen={isLogoUploadModalOpen}
          onClose={() => setIsLogoUploadModalOpen(false)}
        />

        {/* Security & Access Management Modal */}
        <UserAccessManagerModal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
        />

        {/* Admin PIN Override Modal for Restricted Operations */}
        <AdminPinOverrideModal
          isOpen={pinOverrideModal.isOpen}
          onClose={() => setPinOverrideModal(prev => ({ ...prev, isOpen: false }))}
          onSuccess={pinOverrideModal.onSuccess}
          actionTitle={pinOverrideModal.title}
          requiredRole={pinOverrideModal.requiredRole}
        />

        {/* Intranet Staff Login Modal */}
        <IntranetAuthModal
          isOpen={isIntranetAuthModalOpen}
          onClose={() => setIsIntranetAuthModalOpen(false)}
          onSuccess={() => {
            setIsIntranetAuthModalOpen(false);
            setAppMode('intranet');
          }}
        />

      </div>
    </div>
  );
}

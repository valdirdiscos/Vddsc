import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Disc, 
  Search, 
  ShoppingBag, 
  Filter, 
  Music, 
  Sparkles, 
  Lock, 
  MessageCircle, 
  ChevronRight, 
  Check, 
  SlidersHorizontal, 
  Layers, 
  Heart, 
  Share2, 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink,
  Tag,
  Radio,
  Clock,
  Flame,
  Star,
  CheckCircle2,
  X,
  Info,
  HelpCircle,
  TrendingUp,
  User,
  UserCheck,
  Shirt,
  Eye,
  Store,
  Headphones,
  Volume2,
  Music2
} from 'lucide-react';
import { SavedListing, DJPlaylist, TShirtProduct, TShirtSize, TShirtModel, TShirtColor, AudioFormat, DigitalAlbumProduct } from '../types';
import { OFFICIAL_MARKETPLACE_LINKS } from '../constants';
import { PublicProductModal } from './PublicProductModal';
import { PublicCartDrawer, PublicCartItem } from './PublicCartDrawer';
import { AboutAndContactSection } from './AboutAndContactSection';
import { TShirtsSection } from './TShirtsSection';
import { DigitalMusicSection } from './DigitalMusicSection';
import { CuratedPlaylistsSection } from './CuratedPlaylistsSection';
import { CustomerAuthModal } from './CustomerAuthModal';
import { CustomerDashboardModal } from './CustomerDashboardModal';
import { LogoUploadModal } from './LogoUploadModal';
import { ValdirVirtualChat } from './ValdirVirtualChat';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useLogos } from '../hooks/useLogos';
import { LOGO_BADGE, LOGO_COLOR, LOGO_BW } from '../assets/logos';
import { getListingFormatInfo, getItemConditionInfo, isGarimpoItem, getGarimpoReason, isOnlineExclusiveItem, getOnlineExclusiveReason, getAlbumParticularities } from '../utils/formatHelper';

interface PublicStorefrontProps {
  listings: SavedListing[];
  playlists: DJPlaylist[];
  digitalAlbums?: DigitalAlbumProduct[];
  onOpenIntranet: () => void;
  currentUserRole?: string;
  whatsappNumber?: string;
  pixKey?: string;
}

export function PublicStorefront({
  listings,
  playlists,
  digitalAlbums,
  onOpenIntranet,
  currentUserRole,
  whatsappNumber = '5555981164666',
  pixKey = 'valdirdiscos@gmail.com'
}: PublicStorefrontProps) {
  // Customer Auth
  const { currentCustomer, isCustomerLoggedIn, isInWishlist, toggleWishlist } = useCustomerAuth();
  const { logoBadge, logoColor, logoBw } = useLogos();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [isLogoUploadModalOpen, setIsLogoUploadModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // Main Category & Navigation: 'discos' | 'cds' | 'dvds' | 'garimpo' | 'exclusivos' | 'tshirts' | 'musica_online' | 'highlights' | 'playlists' | 'about'
  const [activeMainTab, setActiveMainTab] = useState<'discos' | 'cds' | 'dvds' | 'garimpo' | 'exclusivos' | 'tshirts' | 'musica_online' | 'highlights' | 'playlists' | 'about'>('discos');
  const [onlineMusicSubTab, setOnlineMusicSubTab] = useState<'digital' | 'streaming' | 'dj_sets'>('digital');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('vinyl');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [conditionCategory, setConditionCategory] = useState<'all' | 'new' | 'used'>('all');
  const [particularityFilter, setParticularityFilter] = useState<'all' | 'double' | 'box' | 'gatefold' | 'special'>('all');
  const [garimpoSubFilter, setGarimpoSubFilter] = useState<'all' | 'under25' | 'under40' | 'under60' | 'damaged'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'artist_asc'>('newest');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'sold'>('all');

  // Selected Product for Modal
  const [selectedProduct, setSelectedProduct] = useState<SavedListing | null>(null);

  // Cart State (Persisted in localStorage for convenience)
  const [cart, setCart] = useState<PublicCartItem[]>(() => {
    try {
      const saved = localStorage.getItem('valdir_public_cart_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Save cart to local storage
  const updateCartState = (newCart: PublicCartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem('valdir_public_cart_v1', JSON.stringify(newCart));
    } catch {}
  };

  const handleAddToCart = (listing: SavedListing) => {
    const existingIndex = cart.findIndex(item => item.listing && item.listing.id === listing.id);
    let newCart: PublicCartItem[];
    if (existingIndex >= 0) {
      newCart = cart.map((item, idx) => 
        idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [...cart, { id: listing.id, itemType: 'listing', listing, quantity: 1 }];
    }
    updateCartState(newCart);
    setIsCartOpen(true);
  };

  const handleAddTShirtToCart = (
    tshirt: TShirtProduct, 
    size: TShirtSize, 
    color: TShirtColor, 
    model: TShirtModel, 
    quantity: number = 1
  ) => {
    const itemUniqueId = `tshirt_${tshirt.id}_${size}_${color.id}_${model.replace(/\s+/g, '_')}`;
    const existingIndex = cart.findIndex(item => item.id === itemUniqueId);
    let newCart: PublicCartItem[];
    if (existingIndex >= 0) {
      newCart = cart.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      newCart = [
        ...cart,
        {
          id: itemUniqueId,
          itemType: 'tshirt',
          tshirt: {
            id: tshirt.id,
            name: tshirt.name,
            size,
            color,
            model,
            price: tshirt.price,
            image: tshirt.image
          },
          quantity
        }
      ];
    }
    updateCartState(newCart);
    setIsCartOpen(true);
  };

  const handleAddDigitalToCart = (digitalItem: {
    id: string;
    title: string;
    artist: string;
    price: number;
    coverImage: string;
    format: AudioFormat;
    isFullAlbum: boolean;
    albumId: string;
    trackId?: string;
  }) => {
    const existingIndex = cart.findIndex(item => item.id === digitalItem.id);
    let newCart: PublicCartItem[];
    if (existingIndex >= 0) {
      newCart = cart.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [
        ...cart,
        {
          id: digitalItem.id,
          itemType: 'digital',
          digital: digitalItem,
          quantity: 1
        }
      ];
    }
    updateCartState(newCart);
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (itemId: string) => {
    const newCart = cart.filter(item => item.id !== itemId && item.listing?.id !== itemId);
    updateCartState(newCart);
  };

  const handleUpdateQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    const newCart = cart.map(item => 
      (item.id === itemId || item.listing?.id === itemId) ? { ...item, quantity: qty } : item
    );
    updateCartState(newCart);
  };

  const handleClearCart = () => {
    updateCartState([]);
  };

  const totalCartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  // Filter listings based on public store criteria
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      // 1. Exclui itens do acervo pessoal
      if (item.status === 'personal') {
        return false;
      }

      // 2. Disponibilidade (Disponível vs Vendido)
      if (availabilityFilter === 'available' && item.status === 'sold') {
        return false;
      }
      if (availabilityFilter === 'sold' && item.status !== 'sold') {
        return false;
      }

      // 3. Regra Estrita de Canais da Loja Online:
      // O item SÓ DEVE APARECER na loja online se o canal 'online_store' estiver marcado.
      // Se a caixa da loja online estiver desmarcada, ele não deve aparecer na loja online,
      // devendo permanecer apenas no banco de dados e no sistema da intranet!
      const channels = item.salesChannels || ['physical_store', 'online_store', 'shopee', 'mercadolivre'];
      if (!channels.includes('online_store')) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const artist = item.release.artist?.toLowerCase() || '';
        const title = item.release.title?.toLowerCase() || '';
        const label = item.release.label?.toLowerCase() || '';
        const catno = item.release.catno?.toLowerCase() || '';
        const barcode = item.barcode?.toLowerCase() || '';
        const genres = (item.release.genres || []).map(g => g.toLowerCase()).join(' ');
        const styles = (item.release.styles || []).map(s => s.toLowerCase()).join(' ');
        const tracks = (item.release.tracklist || []).map(t => t.title.toLowerCase()).join(' ');

        const match = artist.includes(q) || 
                      title.includes(q) || 
                      label.includes(q) || 
                      catno.includes(q) || 
                      barcode.includes(q) || 
                      genres.includes(q) || 
                      styles.includes(q) || 
                      tracks.includes(q);

        if (!match) return false;
      }

      // Genre Filter
      if (selectedGenre !== 'all') {
        const allStyles = [...(item.release.genres || []), ...(item.release.styles || [])].map(s => s.toLowerCase());
        if (selectedGenre === 'mpb' && !allStyles.some(s => s.includes('mpb') || s.includes('bossa') || s.includes('samba') || s.includes('latin') || s.includes('brazilian') || s.includes('tropicalia'))) return false;
        if (selectedGenre === 'rock' && !allStyles.some(s => s.includes('rock') || s.includes('prog') || s.includes('hard') || s.includes('psychedelic') || s.includes('metal'))) return false;
        if (selectedGenre === 'soul_jazz' && !allStyles.some(s => s.includes('soul') || s.includes('funk') || s.includes('jazz') || s.includes('r&b') || s.includes('boogie') || s.includes('disco'))) return false;
        if (selectedGenre === 'eletronica' && !allStyles.some(s => s.includes('electronic') || s.includes('synth') || s.includes('house') || s.includes('techno') || s.includes('dance'))) return false;
        if (selectedGenre === 'reggae' && !allStyles.some(s => s.includes('reggae') || s.includes('dub') || s.includes('ska'))) return false;
      }

      // Format Filter
      if (selectedFormat !== 'all') {
        const formatInfo = getListingFormatInfo(item);

        if (selectedFormat === 'vinyl') {
          if (!formatInfo.type.startsWith('vinyl')) return false;
        } else if (selectedFormat === 'lp') {
          if (formatInfo.type !== 'vinyl_lp') return false;
        } else if (selectedFormat === 'single') {
          if (formatInfo.type !== 'vinyl_single') return false;
        } else if (selectedFormat === 'vinyl_10') {
          if (formatInfo.type !== 'vinyl_10') return false;
        } else if (selectedFormat === 'cd') {
          if (formatInfo.type !== 'cd') return false;
        } else if (selectedFormat === 'dvd') {
          if (formatInfo.type !== 'dvd') return false;
        } else if (selectedFormat === 'cassette') {
          if (formatInfo.type !== 'cassette') return false;
        }
      }

      // Condition Category Filter (Divisão Novo vs Usado)
      if (conditionCategory !== 'all') {
        const condInfo = getItemConditionInfo(item);
        if (conditionCategory === 'new' && !condInfo.isNew) return false;
        if (conditionCategory === 'used' && condInfo.isNew) return false;
      }

      // Specific Goldmine Condition Filter
      if (selectedCondition !== 'all') {
        const cond = item.condition?.mediaCondition || '';
        if (selectedCondition === 'nm_plus' && cond !== 'M' && cond !== 'NM') return false;
        if (selectedCondition === 'vg_plus' && cond !== 'M' && cond !== 'NM' && cond !== 'EX' && cond !== 'VG+') return false;
      }

      // Particularity Filter (Álbum Duplo, Box Set, Capa Dupla Gatefold, Edição Especial)
      if (particularityFilter !== 'all') {
        const parts = getAlbumParticularities(item);
        if (particularityFilter === 'double' && !parts.some(p => p.id === 'double_album' || p.id === 'triple_album' || p.id === 'quadruple_album' || p.type === 'disc_count')) return false;
        if (particularityFilter === 'box' && !parts.some(p => p.id === 'box_set' || p.type === 'box')) return false;
        if (particularityFilter === 'gatefold' && !parts.some(p => p.id === 'gatefold')) return false;
        if (particularityFilter === 'special' && !parts.some(p => p.id === 'special_edition' || p.id === 'deluxe_edition' || p.id === 'limited_edition' || p.type === 'edition' || p.type === 'custom')) return false;
      }

      // Tab Highlights
      if (activeMainTab === 'highlights') {
        const price = item.pricing?.directPrice || item.pricing?.basePriceBrl || 0;
        const isImported = item.release.country && !['brasil', 'brazil', 'br'].includes(item.release.country.toLowerCase());
        if (price < 120 && !isImported) return false;
      }

      // Tab Garimpo
      if (activeMainTab === 'garimpo') {
        if (!isGarimpoItem(item)) return false;
        
        const price = item.pricing?.directPrice || item.pricing?.basePriceBrl || 0;
        const mediaCond = (item.condition?.mediaCondition || '').trim().toUpperCase();
        const sleeveCond = (item.condition?.sleeveCondition || '').trim().toUpperCase();
        const combinedNotes = `${item.condition?.mediaDetails || ''} ${item.condition?.sleeveDetails || ''} ${item.garimpoDetails || ''} ${item.release?.notes || ''}`.toLowerCase();

        if (garimpoSubFilter === 'under25' && price > 25) return false;
        if (garimpoSubFilter === 'under40' && price > 40) return false;
        if (garimpoSubFilter === 'under60' && price > 60) return false;
        if (garimpoSubFilter === 'damaged') {
          const isDamaged = ['G', 'G+', 'F', 'P', 'POOR', 'FAIR'].includes(mediaCond) || 
                            ['G', 'G+', 'F', 'P', 'POOR', 'FAIR'].includes(sleeveCond) ||
                            combinedNotes.includes('danificado') ||
                            combinedNotes.includes('com detalhes') ||
                            combinedNotes.includes('marcas') ||
                            combinedNotes.includes('risco');
          if (!isDamaged) return false;
        }
      }

      // Tab Exclusivos do Site / Discos Raros
      if (activeMainTab === 'exclusivos') {
        if (!isOnlineExclusiveItem(item)) return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.pricing?.directPrice || a.pricing?.basePriceBrl || 0;
      const priceB = b.pricing?.directPrice || b.pricing?.basePriceBrl || 0;

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'artist_asc') return (a.release.artist || '').localeCompare(b.release.artist || '');
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [listings, searchQuery, selectedGenre, selectedFormat, selectedCondition, conditionCategory, particularityFilter, garimpoSubFilter, sortBy, availabilityFilter, activeMainTab]);

  const genresPills = [
    { id: 'all', label: '🔥 Todo o Acervo' },
    { id: 'mpb', label: '🇧🇷 MPB, Samba & Bossa' },
    { id: 'rock', label: '🎸 Rock Clássico & Prog' },
    { id: 'soul_jazz', label: '🎷 Jazz, Soul & Funk' },
    { id: 'eletronica', label: '🎛️ Eletrônica & Synth' },
    { id: 'reggae', label: '🟢 Reggae & Dub' }
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 font-sans flex flex-col selection:bg-amber-200 selection:text-amber-950">
      
      {/* Top Banner & Fast Perks */}
      <div className="bg-slate-950 text-slate-300 text-[11px] py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Acervo Especializado em Vinis & Raridades
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-slate-400">
              📦 Embalagem reforçada anti-impacto para todo o Brasil
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-slate-400">
              📍 Retirada no balcão da loja física
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Marketplaces quick links in top banner */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-400 font-semibold hidden lg:inline">Lojas Oficiais:</span>
              <a
                href={OFFICIAL_MARKETPLACE_LINKS.shopee.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-md bg-[#ee4d2d]/25 hover:bg-[#ee4d2d] text-orange-300 hover:text-white border border-[#ee4d2d]/40 transition-all font-black flex items-center gap-1"
                title="Compre na nossa loja oficial da Shopee com frete grátis e cupons"
              >
                <ShoppingBag className="h-3 w-3" />
                <span>Shopee</span>
              </a>
              <a
                href={OFFICIAL_MARKETPLACE_LINKS.mercadolivre.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-md bg-[#ffe600]/25 hover:bg-[#ffe600] text-yellow-300 hover:text-slate-950 border border-[#ffe600]/40 transition-all font-black flex items-center gap-1"
                title="Compre pelo Mercado Livre com Mercado Envios e garantia"
              >
                <Store className="h-3 w-3" />
                <span>Mercado Livre</span>
              </a>
              <a
                href={OFFICIAL_MARKETPLACE_LINKS.discogs.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all font-black flex items-center gap-1"
                title="Consulte nosso acervo internacional no Discogs"
              >
                <Disc className="h-3 w-3 text-amber-400" />
                <span>Discogs</span>
              </a>
            </div>

            <span className="text-slate-700 hidden sm:inline">|</span>

            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 font-bold transition-colors flex items-center gap-1"
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>WhatsApp da Loja</span>
            </a>

            <span className="text-slate-700">|</span>

            {/* Intranet Access Link */}
            <button
              type="button"
              onClick={onOpenIntranet}
              className="text-slate-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Acessar Sistema Interno / Balcão da Loja"
            >
              <Lock className="h-3 w-3 text-amber-400" />
              <span>Intranet / Balcão</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-900/10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-4">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 p-1 border border-amber-500/30 flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                <img 
                  src={logoColor} 
                  alt="Valdir Discos" 
                  className="w-full h-full object-contain rounded-xl hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "/valdir-logo-color.jpg";
                  }}
                />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                    VALDIR DISCOS
                  </h1>
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                    Online
                  </span>
                  <span className="hidden md:inline-block text-xs font-serif italic text-amber-700 font-bold">
                    Disco é cultura.
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                  Vinis de Colecionador, Raridades & Músicas Selecionadas
                </p>
              </div>
            </div>

            {/* Live Search Bar */}
            <div className="flex-1 max-w-lg hidden md:block">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por artista, álbum, música, gênero..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs font-medium text-slate-900 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Actions: Customer Account, Cart & Intranet Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Customer Account Button */}
              {isCustomerLoggedIn && currentCustomer ? (
                <button
                  type="button"
                  onClick={() => setIsDashboardModalOpen(true)}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Acessar Minha Conta e Pedidos"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-[10px]">
                    {currentCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-black max-w-[90px] truncate">
                    {currentCustomer.name.split(' ')[0]}
                  </span>
                  {currentCustomer.wishlist && currentCustomer.wishlist.length > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-rose-600 font-black">
                      <Heart className="h-3 w-3 fill-rose-600" />
                      {currentCustomer.wishlist.length}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-2xl font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer active:scale-95"
                >
                  <User className="h-3.5 w-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Entrar / Minha Conta</span>
                  <span className="sm:hidden">Entrar</span>
                </button>
              )}

              {/* Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer active:scale-95"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Carrinho</span>
                {totalCartCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white text-amber-950 font-black text-[10px] flex items-center justify-center shadow-xs">
                    {totalCartCount}
                  </span>
                )}
              </button>
            </div>

          </div>

          {/* Mobile Search Bar */}
          <div className="mt-3 block md:hidden">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar artista, álbum, música..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-slate-100 text-xs text-slate-900 rounded-xl border border-slate-200 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 🌟 PRIMEIRO MENU: DIVISÃO ENTRE MÚSICA VENDIDA ONLINE E ARQUIVOS FÍSICOS DA LOJA */}
        <div className="border-t border-b border-amber-900/20 bg-gradient-to-r from-amber-100/70 via-slate-100 to-indigo-100/70 py-2.5 px-3 sm:px-6 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 shrink-0 self-start md:self-center">
              <span className="text-[10.5px] uppercase tracking-widest text-slate-600 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-300 shadow-xs font-black flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-amber-800" />
                Menu Principal • Departamentos
              </span>
            </div>

            {/* As 2 Divisões Principais da Loja */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full md:max-w-2xl">
              {/* Divisão 1: Arquivos Físicos da Loja */}
              <button
                type="button"
                onClick={() => {
                  if (activeMainTab === 'musica_online' || activeMainTab === 'playlists') {
                    setActiveMainTab('discos');
                    setSelectedFormat('vinyl');
                  }
                }}
                className={`relative p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 text-left ${
                  activeMainTab !== 'musica_online' && activeMainTab !== 'playlists'
                    ? 'bg-gradient-to-r from-amber-950 to-stone-900 text-white border-amber-800 shadow-md ring-2 ring-amber-500/50'
                    : 'bg-white text-slate-800 border-slate-300 hover:border-amber-400 hover:bg-amber-50/60 shadow-xs'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${
                  activeMainTab !== 'musica_online' && activeMainTab !== 'playlists'
                    ? 'bg-amber-800 text-amber-300 border border-amber-600/40 shadow-sm'
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}>
                  <Disc className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-xs sm:text-sm uppercase tracking-tight">
                      📦 Arquivos Físicos
                    </span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      activeMainTab !== 'musica_online' && activeMainTab !== 'playlists'
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-amber-200/80 text-amber-900'
                    }`}>
                      Mídia Física
                    </span>
                  </div>
                  <p className={`text-[11px] truncate font-medium mt-0.5 ${
                    activeMainTab !== 'musica_online' && activeMainTab !== 'playlists' ? 'text-amber-200/90' : 'text-slate-500'
                  }`}>
                    Discos de Vinil, CDs, DVDs, Garimpo & Camisetas
                  </p>
                </div>
              </button>

              {/* Divisão 2: Música Vendida Online */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('musica_online');
                }}
                className={`relative p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 text-left ${
                  activeMainTab === 'musica_online' || activeMainTab === 'playlists'
                    ? 'bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/50'
                    : 'bg-white text-slate-800 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/60 shadow-xs'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${
                  activeMainTab === 'musica_online' || activeMainTab === 'playlists'
                    ? 'bg-indigo-800 text-amber-300 border border-indigo-600/40 shadow-sm'
                    : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                }`}>
                  <Headphones className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-xs sm:text-sm uppercase tracking-tight">
                      🎧 Música Vendida Online
                    </span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      activeMainTab === 'musica_online' || activeMainTab === 'playlists'
                        ? 'bg-emerald-400 text-slate-950 font-black'
                        : 'bg-indigo-200/80 text-indigo-950'
                    }`}>
                      Download Imediato
                    </span>
                  </div>
                  <p className={`text-[11px] truncate font-medium mt-0.5 ${
                    activeMainTab === 'musica_online' || activeMainTab === 'playlists' ? 'text-indigo-200/90' : 'text-slate-500'
                  }`}>
                    Hi-Res Lossless (FLAC/WAV/MP3) & Streaming
                  </p>
                </div>
              </button>
            </div>

          </div>
        </div>

        {/* Sub-menu Contextual Adaptativo de Acordo com o Departamento Selecionado */}
        <div className="border-t border-slate-100 bg-[#fdfcfb]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            
            {/* SE ESTIVER EM ARQUIVOS FÍSICOS */}
            {activeMainTab !== 'musica_online' && activeMainTab !== 'playlists' ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900/60 mr-1 hidden sm:inline">
                  Formatos Físicos:
                </span>
                
                {/* Discos */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('discos');
                    setSelectedFormat('vinyl');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activeMainTab === 'discos'
                      ? 'bg-amber-900 text-white border-amber-900 shadow-xs ring-1 ring-amber-700/50'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  <Disc className="h-3.5 w-3.5 text-amber-400" />
                  <span>Discos (Vinil)</span>
                </button>

                {/* CDs */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('cds');
                    setSelectedFormat('cd');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activeMainTab === 'cds'
                      ? 'bg-amber-900 text-white border-amber-900 shadow-xs ring-1 ring-amber-700/50'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[11px]">💿</span>
                  <span>CDs</span>
                </button>

                {/* DVDs */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('dvds');
                    setSelectedFormat('dvd');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activeMainTab === 'dvds'
                      ? 'bg-amber-900 text-white border-amber-900 shadow-xs ring-1 ring-amber-700/50'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[11px]">🎬</span>
                  <span>DVDs</span>
                </button>

                {/* Sessão Garimpo */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('garimpo');
                    setSelectedFormat('all');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activeMainTab === 'garimpo'
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-600 shadow-xs ring-1 ring-orange-400/50'
                      : 'bg-orange-50/90 text-orange-950 border-orange-200/90 hover:bg-orange-100/80'
                  }`}
                >
                  <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                  <span>Sessão Garimpo</span>
                </button>

                {/* ⭐ Exclusivos do Site / Discos Raros */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('exclusivos');
                    setSelectedFormat('all');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activeMainTab === 'exclusivos'
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border-amber-400 shadow-xs ring-1 ring-yellow-400'
                      : 'bg-amber-50/80 text-amber-950 border-amber-200/90 hover:bg-amber-100/90'
                  }`}
                >
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>⭐ Exclusivos do Site</span>
                </button>

                {/* Camisetas */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('tshirts');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activeMainTab === 'tshirts'
                      ? 'bg-amber-950 text-amber-200 border-amber-950 shadow-xs ring-1 ring-amber-500/50'
                      : 'bg-amber-50 text-amber-950 border-amber-300/80 hover:bg-amber-100'
                  }`}
                >
                  <Shirt className="h-3.5 w-3.5 text-amber-600" />
                  <span>Camisetas (DTF)</span>
                </button>
              </div>
            ) : (
              /* SE ESTIVER EM MÚSICA VENDIDA ONLINE */
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900/60 mr-1 hidden sm:inline">
                  Formatos Digitais:
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('musica_online');
                    setOnlineMusicSubTab('digital');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activeMainTab === 'musica_online' && onlineMusicSubTab === 'digital'
                      ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs ring-1 ring-indigo-400/50'
                      : 'bg-white text-indigo-950 border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <Disc className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Downloads Hi-Res & Player (FLAC / WAV / MP3)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('musica_online');
                    setOnlineMusicSubTab('streaming');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activeMainTab === 'musica_online' && onlineMusicSubTab === 'streaming'
                      ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs ring-1 ring-indigo-400/50'
                      : 'bg-white text-indigo-950 border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <Radio className="h-3.5 w-3.5 text-red-500" />
                  <span>Playlists YouTube & Spotify</span>
                </button>

                {playlists.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMainTab('musica_online');
                      setOnlineMusicSubTab('dj_sets');
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                      activeMainTab === 'musica_online' && onlineMusicSubTab === 'dj_sets'
                        ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs ring-1 ring-indigo-400/50'
                        : 'bg-white text-indigo-950 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    <Music className="h-3.5 w-3.5 text-amber-600" />
                    <span>Sets dos DJs ({playlists.length})</span>
                  </button>
                )}
              </div>
            )}

            {/* Secondary / Utility Tabs */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {activeMainTab !== 'musica_online' && activeMainTab !== 'playlists' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('highlights');
                    setSelectedFormat('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 ${
                    activeMainTab === 'highlights'
                      ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                      : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span>Raridades</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('about');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 ${
                  activeMainTab === 'about'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Info className="h-3 w-3 text-slate-400" />
                <span>Sobre a Loja</span>
              </button>
            </div>

          </div>
        </div>

        {/* Music Genre Filter Strip (Only shown when browsing music items, never on tshirts) */}
        {(activeMainTab === 'discos' || activeMainTab === 'cds' || activeMainTab === 'dvds' || activeMainTab === 'garimpo' || activeMainTab === 'exclusivos' || activeMainTab === 'highlights') && (
          <div className="border-t border-slate-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                Gênero:
              </span>
              {genresPills.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGenre(g.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedGenre === g.id
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Curated Hero Spotlight (if not searching and on Discos tab) */}
        {!searchQuery && activeMainTab === 'discos' && selectedGenre === 'all' && (
          <div className="bg-gradient-to-br from-[#0c232a] via-[#163840] to-[#b3431f] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-teal-900/40 relative overflow-hidden">
            {/* Background Vinyl Graphic Rings */}
            <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 opacity-15 pointer-events-none flex items-center justify-end pr-4 sm:pr-12">
              <div className="w-96 h-96 rounded-full border-[18px] border-amber-400/40 border-dashed animate-spin" style={{ animationDuration: '45s' }} />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Text & Pitch */}
              <div className="lg:col-span-8 space-y-3.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Curadoria Especializada & Envio para Todo o Brasil</span>
                </div>
                
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight font-sans">
                  O melhor do vinil, do clássico ao obscuro.
                </h2>
                
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium max-w-xl">
                  Compre direto com quem ama e entende de música. Todos os discos são criteriosamente avaliados no padrão internacional Goldmine, higienizados e testados em toca-discos.
                </p>

                {/* Slogan pill from official badge */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-3 py-1 bg-black/40 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-serif italic font-black">
                    ★ Disco é cultura.
                  </span>
                  <span className="px-2.5 py-1 bg-white/10 text-slate-200 rounded-xl text-xs font-semibold">
                    Acervo Físico & Online
                  </span>
                  <span className="px-2.5 py-1 bg-white/10 text-slate-200 rounded-xl text-xs font-semibold">
                    100% Higienizados
                  </span>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Olá Valdir! Gostaria de consultar um disco no catálogo online.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Falar com o Valdir no WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setActiveMainTab('tshirts')}
                    className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shirt className="h-4 w-4 text-amber-400" />
                    <span>Conheça as Camisetas Oficiais (DTF)</span>
                  </button>

                  <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                    Monte seu carrinho e faça seu pedido direto
                  </span>
                </div>
              </div>

              {/* Logo Emblem Badge Visual Artwork */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full blur-lg opacity-40 group-hover:opacity-75 transition duration-500" />
                  <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full p-1.5 bg-[#fdfcf9] shadow-2xl border-4 border-amber-400/80 flex items-center justify-center overflow-hidden">
                    <img 
                      src={logoBadge} 
                      alt="Valdir Discos - Disco é cultura" 
                      className="w-full h-full object-contain rounded-full hover:rotate-6 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = "/valdir-logo-badge.jpg";
                      }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-200 mt-2 font-serif italic text-center">
                  Selo Oficial Valdir Discos
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Garimpo Spotlight Banner (when on Garimpo tab and not searching) */}
        {!searchQuery && activeMainTab === 'garimpo' && (
          <div className="bg-gradient-to-br from-[#2a1306] via-[#4d1f0d] to-[#9c3614] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-orange-900/50 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 opacity-15 pointer-events-none flex items-center justify-end pr-6">
              <div className="w-80 h-80 rounded-full border-[14px] border-orange-400/40 border-dashed animate-spin" style={{ animationDuration: '60s' }} />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/25 text-orange-200 border border-orange-400/30 text-xs font-black shadow-xs uppercase tracking-wide">
                  <Flame className="h-4 w-4 text-orange-400 fill-orange-400" />
                  <span>Sessão Garimpo & Oportunidades</span>
                </div>
                
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight font-sans">
                  Achados, pechinchas e oportunidades para garimpar.
                </h2>
                
                <p className="text-xs sm:text-sm text-orange-100/90 leading-relaxed font-medium max-w-xl">
                  Aqui você encontra discos e mídias de menor valor de mercado, títulos com preços populares e edições especiais com marcas de época ou detalhes físicos descritos. A oportunidade perfeita para expandir seu acervo pagando pouco!
                </p>

                {/* Sub-filters for Garimpo */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-orange-200/80 mr-1 block sm:inline">Filtrar Achados:</span>
                  {[
                    { id: 'all', label: '🔥 Todos do Garimpo' },
                    { id: 'under25', label: '🏷️ Até R$ 25' },
                    { id: 'under40', label: '💰 Até R$ 40' },
                    { id: 'under60', label: '📦 Até R$ 60' },
                    { id: 'damaged', label: '🔍 Com Detalhes / Marcas' },
                  ].map(chip => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setGarimpoSubFilter(chip.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1 ${
                        garimpoSubFilter === chip.id
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-105'
                          : 'bg-black/30 text-orange-100 border-orange-500/30 hover:bg-black/45'
                      }`}
                    >
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center">
                <div className="p-5 bg-black/40 border border-orange-500/30 rounded-3xl text-center space-y-2 backdrop-blur-sm">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg">
                    <Flame className="h-8 w-8 fill-white" />
                  </div>
                  <h3 className="text-base font-black text-white">Garimpo Transparente</h3>
                  <p className="text-[11px] text-orange-200/80 leading-snug">
                    Todas as condições e detalhes visuais são informados com clareza. Você sabe exatamente o estado de cada exemplar!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exclusivos do Site Spotlight Banner (when on Exclusivos tab and not searching) */}
        {!searchQuery && activeMainTab === 'exclusivos' && (
          <div className="bg-gradient-to-br from-[#1c160c] via-[#2f220f] to-[#453213] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-500/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 opacity-15 pointer-events-none flex items-center justify-end pr-6">
              <div className="w-80 h-80 rounded-full border-[14px] border-amber-300/40 border-dashed animate-spin" style={{ animationDuration: '80s' }} />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black shadow-xs uppercase tracking-wide">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span>Discos Raros • Exclusividade da Loja Online</span>
                </div>
                
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight font-sans">
                  ⭐ Acervo de Raridades Vendidas Exclusivamente pelo Site.
                </h2>
                
                <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium max-w-xl">
                  Discos de vinil raros, primeiras prensagens originais, edições históricas para colecionadores e tiragens especiais selecionadas pelo Valdir para venda exclusiva através do nosso site oficial.
                </p>

                <div className="pt-2 flex items-center gap-3 text-xs text-amber-200">
                  <span className="flex items-center gap-1 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    Higienizados & Plásticos Novos
                  </span>
                  <span className="flex items-center gap-1 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    Envio Seguro com Embalagem Reforçada
                  </span>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center">
                <div className="p-5 bg-black/40 border border-amber-500/30 rounded-3xl text-center space-y-2 backdrop-blur-sm">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center shadow-lg">
                    <Star className="h-8 w-8 fill-slate-950" />
                  </div>
                  <h3 className="text-base font-black text-white">Exemplares Selecionados</h3>
                  <p className="text-[11px] text-amber-200/80 leading-snug">
                    Títulos de alto valor histórico e colecionável que não estão à venda em balcão ou marketplaces externos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content View Routing */}
        {activeMainTab === 'about' ? (
          <AboutAndContactSection
            whatsappNumber={whatsappNumber}
            pixKey={pixKey}
            onOpenLogoUpload={() => setIsLogoUploadModalOpen(true)}
          />
        ) : activeMainTab === 'tshirts' ? (
          <TShirtsSection
            onAddToCart={handleAddTShirtToCart}
            whatsappNumber={whatsappNumber}
          />
        ) : activeMainTab === 'musica_online' ? (
          <div className="space-y-6">
            {/* Sub navigation for Musica Online */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 text-amber-300 flex items-center justify-center font-black shadow-sm shrink-0">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-950">Sessão de Música Online • Valdir Discos</h3>
                  <p className="text-[11px] text-slate-500">Ouça prévias, baixe álbuns em formato Lossless (FLAC/WAV/MP3) ou sintonize playlists</p>
                </div>
              </div>

              {/* Sub tabs */}
              <div className="flex items-center gap-1.5 w-full md:w-auto bg-slate-100 p-1 rounded-xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setOnlineMusicSubTab('digital')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    onlineMusicSubTab === 'digital'
                      ? 'bg-white text-indigo-950 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Disc className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Downloads & Player Hi-Res</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlineMusicSubTab('streaming')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    onlineMusicSubTab === 'streaming'
                      ? 'bg-white text-indigo-950 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Radio className="h-3.5 w-3.5 text-red-500" />
                  <span>Playlists YouTube & Spotify</span>
                </button>

                {playlists.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOnlineMusicSubTab('dj_sets')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      onlineMusicSubTab === 'dj_sets'
                        ? 'bg-white text-indigo-950 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Music className="h-3.5 w-3.5 text-amber-600" />
                    <span>Sets dos DJs ({playlists.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sub-tab views */}
            {onlineMusicSubTab === 'digital' ? (
              <DigitalMusicSection
                albums={digitalAlbums}
                onAddToCart={handleAddDigitalToCart}
                whatsappNumber={whatsappNumber}
              />
            ) : onlineMusicSubTab === 'streaming' ? (
              <CuratedPlaylistsSection
                onSelectGenreFilter={(genre) => {
                  setSelectedGenre(genre);
                  setActiveMainTab('discos');
                }}
              />
            ) : (
              /* DJ Playlists */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {playlists.map(pl => (
                    <div key={pl.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-200 uppercase">
                            Playlist Curada do Balcão
                          </span>
                          <h4 className="text-lg font-black text-slate-900 mt-1">{pl.title}</h4>
                          {pl.description && <p className="text-xs text-slate-500 mt-0.5">{pl.description}</p>}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Music className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="space-y-1.5 divide-y divide-slate-100 bg-slate-50 p-3 rounded-xl border border-slate-200/70 max-h-48 overflow-y-auto">
                        {pl.items.map((item, idx) => (
                          <div key={item.id || idx} className="pt-1.5 flex items-center justify-between text-xs">
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-slate-800 truncate">{item.trackTitle}</p>
                              <p className="text-[11px] text-slate-500 truncate">{item.albumArtist} - {item.albumTitle}</p>
                            </div>
                            {item.drawer && (
                              <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                                {item.drawer}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeMainTab === 'playlists' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Seleções & Playlists dos DJs</h3>
                <p className="text-xs text-slate-500">Sets com faixas disponíveis em vinil na nossa loja física</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('discos');
                  setSelectedFormat('vinyl');
                }}
                className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
              >
                Voltar para os discos
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playlists.map(pl => (
                <div key={pl.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-200 uppercase">
                        Playlist Curada
                      </span>
                      <h4 className="text-lg font-black text-slate-900 mt-1">{pl.title}</h4>
                      {pl.description && <p className="text-xs text-slate-500 mt-0.5">{pl.description}</p>}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Music className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Tracks list */}
                  <div className="space-y-1.5 divide-y divide-slate-100 bg-slate-50 p-3 rounded-xl border border-slate-200/70 max-h-48 overflow-y-auto">
                    {pl.items.map((item, idx) => (
                      <div key={item.id || idx} className="pt-1.5 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-800 truncate">{item.trackTitle}</p>
                          <p className="text-[11px] text-slate-500 truncate">{item.albumArtist} - {item.albumTitle}</p>
                        </div>
                        {item.drawer && (
                          <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                            {item.drawer}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Official Marketplaces Quick Bar */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs w-full md:w-auto">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-800 border border-amber-500/30 flex items-center justify-center font-bold shrink-0">
                  <Store className="h-4 w-4 text-amber-800" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-xs sm:text-sm">Lojas Oficiais nos Marketplaces</h4>
                  <p className="text-[11px] text-slate-500">Compre com frete reduzido ou cupons exclusivos do seu app favorito</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
                <a
                  href={OFFICIAL_MARKETPLACE_LINKS.shopee.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-orange-50 text-[#ee4d2d] hover:bg-[#ee4d2d] hover:text-white border border-orange-200 hover:border-[#ee4d2d] transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Shopee Oficial</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>

                <a
                  href={OFFICIAL_MARKETPLACE_LINKS.mercadolivre.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-yellow-50 text-slate-900 hover:bg-[#ffe600] border border-yellow-200 hover:border-yellow-400 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Store className="h-3.5 w-3.5 text-amber-600" />
                  <span>Mercado Livre</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>

                <a
                  href={OFFICIAL_MARKETPLACE_LINKS.discogs.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-slate-800 border border-slate-700 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Disc className="h-3.5 w-3.5 text-amber-400" />
                  <span>Discogs Global</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </div>
            </div>

            {/* Filter and Sorting Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-800">
                  {filteredListings.length} {
                    activeMainTab === 'garimpo'
                      ? (filteredListings.length === 1 ? 'item no garimpo' : 'itens no garimpo')
                      : activeMainTab === 'exclusivos'
                      ? (filteredListings.length === 1 ? 'raridade exclusiva' : 'raridades exclusivas do site')
                      : activeMainTab === 'cds'
                      ? (filteredListings.length === 1 ? 'CD encontrado' : 'CDs no acervo')
                      : activeMainTab === 'dvds'
                      ? (filteredListings.length === 1 ? 'DVD encontrado' : 'DVDs no acervo')
                      : (filteredListings.length === 1 ? 'disco encontrado' : 'discos no acervo')
                  }
                </span>

                {/* Format Filter */}
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
                >
                  {activeMainTab === 'discos' ? (
                    <>
                      <option value="vinyl">Todos os Discos de Vinil</option>
                      <option value="lp">Apenas LPs 12"</option>
                      <option value="single">Apenas Compactos 7"</option>
                      <option value="vinyl_10">Apenas Vinil 10"</option>
                    </>
                  ) : activeMainTab === 'cds' ? (
                    <>
                      <option value="cd">Todos os CDs (Compact Disc)</option>
                    </>
                  ) : activeMainTab === 'dvds' ? (
                    <>
                      <option value="dvd">Todos os DVDs de Shows/Música</option>
                    </>
                  ) : (
                    <>
                      <option value="all">Todos os Formatos</option>
                      <option value="vinyl">Discos de Vinil (LP / Compacto)</option>
                      <option value="cd">CDs</option>
                      <option value="dvd">DVDs</option>
                    </>
                  )}
                </select>

                {/* Availability Filter */}
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-hidden"
                >
                  <option value="all">📦 Todos (Disponíveis e Vendidos)</option>
                  <option value="available">🟢 Apenas Disponíveis</option>
                  <option value="sold">🔴 Apenas Vendidos (Histórico)</option>
                </select>

                {/* Condition Filter */}
                <select
                  value={conditionCategory !== 'all' ? conditionCategory : selectedCondition}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'new') {
                      setConditionCategory('new');
                      setSelectedCondition('all');
                    } else if (val === 'used') {
                      setConditionCategory('used');
                      setSelectedCondition('all');
                    } else if (val === 'all') {
                      setConditionCategory('all');
                      setSelectedCondition('all');
                    } else {
                      setConditionCategory('all');
                      setSelectedCondition(val);
                    }
                  }}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
                >
                  <option value="all">Todas as Condições</option>
                  <option value="new">✨ Apenas Novos & Lacrados</option>
                  <option value="nm_plus">Near Mint / Mint</option>
                  <option value="vg_plus">VG+ ou superior</option>
                </select>

                {/* Particularity / Edition Filter */}
                <select
                  value={particularityFilter}
                  onChange={(e) => setParticularityFilter(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
                >
                  <option value="all">📦 Todas as Edições</option>
                  <option value="double">💿 Álbuns Duplos (2xLP/2xCD)</option>
                  <option value="box">📦 Box Sets & Caixas</option>
                  <option value="gatefold">📖 Capa Dupla (Gatefold)</option>
                  <option value="special">✨ Edições Especiais & Deluxe</option>
                </select>
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-hidden"
                >
                  <option value="newest">🔥 Mais Recentes</option>
                  <option value="price_asc">💰 Menor Preço</option>
                  <option value="price_desc">💎 Maior Preço</option>
                  <option value="artist_asc">🔤 Artista (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Product Cards Grid */}
            {filteredListings.length === 0 ? (
              <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-700">
                  <Disc className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 text-base">
                    {activeMainTab === 'cds'
                      ? 'Nenhum CD encontrado com estes filtros'
                      : activeMainTab === 'dvds'
                      ? 'Nenhum DVD encontrado com estes filtros'
                      : 'Nenhum disco encontrado com estes filtros'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Tente buscar por outro termo ou limpar os filtros de gênero e estado de conservação.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('all');
                    setConditionCategory('all');
                    setParticularityFilter('all');
                    if (activeMainTab === 'cds') {
                      setSelectedFormat('cd');
                    } else if (activeMainTab === 'dvds') {
                      setSelectedFormat('dvd');
                    } else {
                      setSelectedFormat('vinyl');
                    }
                    setSelectedCondition('all');
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow"
                >
                  Limpar Todos os Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                {filteredListings.map((item) => {
                  const { release, condition, pricing } = item;
                  const price = pricing?.directPrice || pricing?.basePriceBrl || 0;
                  const cover = (item.customImages && item.customImages.length > 0 && item.customImages[0]) || release.coverImage;
                  const formatInfo = getListingFormatInfo(item);
                  const conditionInfo = getItemConditionInfo(item);
                  const particularities = getAlbumParticularities(item);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group hover:border-amber-400/60"
                    >
                      {/* Card Image */}
                      <div 
                        onClick={() => setSelectedProduct(item)}
                        className="aspect-square bg-slate-900 relative overflow-hidden cursor-pointer"
                      >
                        {cover ? (
                          <img
                            src={cover}
                            alt={`${release.artist} - ${release.title}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 p-2 text-center">
                            <Disc className="h-10 w-10 mb-1 text-slate-700" />
                            <span className="text-[10px] font-bold">Sem Foto</span>
                          </div>
                        )}

                        {/* Badges on image */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start max-w-[85%]">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shadow-xs ${formatInfo.badgeBg}`}>
                            {formatInfo.badgeLabel}
                          </span>

                          {isGarimpoItem(item) && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs flex items-center gap-1 border border-orange-400/40 uppercase tracking-wider">
                              <Flame className="h-2.5 w-2.5 fill-white" />
                              Garimpo
                            </span>
                          )}

                          {/* Estrela / Exclusivo Loja Online Badge */}
                          {isOnlineExclusiveItem(item) && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-md flex items-center gap-1 border border-yellow-300 uppercase tracking-wider">
                              <Star className="h-2.5 w-2.5 fill-slate-950 text-slate-950" />
                              ⭐ Exclusivo do Site
                            </span>
                          )}

                          {conditionInfo.isNew ? (
                            <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md flex items-center gap-1 border border-emerald-400/50 uppercase tracking-wide">
                              <Sparkles className="h-2.5 w-2.5 text-emerald-200 fill-emerald-200" />
                              Novo / Lacrado
                            </span>
                          ) : condition?.mediaCondition ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-950/75 text-slate-200 backdrop-blur-xs shadow-xs">
                              Mídia: {condition.mediaCondition}
                            </span>
                          ) : null}
                        </div>

                        {/* Particularidades na Fotinho/Capa (Álbum Duplo, Box Set, Edição Especial, Gatefold, etc.) */}
                        {particularities.length > 0 && (
                          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none z-10">
                            {particularities.slice(0, 2).map((part) => (
                              <span
                                key={part.id}
                                title={part.label}
                                className={`px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md border backdrop-blur-xs ${part.badgeClass}`}
                              >
                                <span className="shrink-0">{part.icon}</span>
                                <span className="truncate max-w-[120px]">{part.shortLabel}</span>
                              </span>
                            ))}
                            {particularities.length > 2 && (
                              <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-black/85 text-amber-300 border border-amber-400/40 shadow-xs">
                                +{particularities.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Heart Wishlist Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isCustomerLoggedIn) {
                              setAuthModalTab('login');
                              setIsAuthModalOpen(true);
                              return;
                            }
                            toggleWishlist(item.id);
                          }}
                          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-sm ${
                            isInWishlist(item.id)
                              ? 'bg-rose-500 text-white hover:bg-rose-600 scale-110'
                              : 'bg-black/50 text-white/80 hover:text-white hover:bg-black/70'
                          }`}
                          title={isInWishlist(item.id) ? 'Remover dos Favoritos' : 'Adicionar à Lista de Desejos'}
                        >
                          <Heart className={`h-3.5 w-3.5 ${isInWishlist(item.id) ? 'fill-white' : ''}`} />
                        </button>

                        {/* Sold overlay if applicable */}
                        {item.status === 'sold' && (
                          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1.5px] flex flex-col items-center justify-center p-2 text-center">
                            <span className="px-2.5 py-1 bg-rose-600/95 text-white font-black text-[11px] uppercase tracking-wider rounded-lg shadow-lg border border-rose-400/40 mb-1">
                              Vendido / Esgotado
                            </span>
                            <span className="text-[9.5px] text-slate-300 font-medium">Acervo Histórico</span>
                          </div>
                        )}
                      </div>

                      {/* Card Details */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                        <div 
                          onClick={() => setSelectedProduct(item)}
                          className="cursor-pointer space-y-1"
                        >
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors">
                            {release.title}
                          </h4>
                          <p className="text-[11px] font-bold text-amber-800 truncate">
                            {release.artist}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {release.label || 'Nacional'} {release.year ? `• ${release.year}` : ''}
                          </p>

                          {/* Particularidades chips in card info */}
                          {particularities.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {particularities.slice(0, 2).map((part) => (
                                <span
                                  key={part.id}
                                  className="text-[9px] font-bold text-amber-950 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded flex items-center gap-1"
                                >
                                  <span>{part.icon}</span>
                                  <span className="truncate max-w-[120px]">{part.shortLabel}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pricing & Action */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[9px] text-slate-400 font-semibold block uppercase">Preço</span>
                            <span className={`text-sm font-black ${item.status === 'sold' ? 'text-slate-500 line-through' : 'text-slate-950'}`}>
                              R$ {price.toFixed(2)}
                            </span>
                          </div>

                          {item.status === 'sold' ? (
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(item)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] rounded-xl transition-all cursor-pointer border border-slate-300 flex items-center gap-1 shrink-0"
                              title="Ver detalhes do item vendido"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-500" />
                              <span>Detalhes</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item)}
                              className="p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all cursor-pointer shadow-xs active:scale-90 shrink-0"
                              title="Adicionar ao Carrinho"
                            >
                              <ShoppingBag className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>

      {/* Public Footer */}
      <footer className="mt-16 bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Col 1: Store Intro */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 p-1 border border-amber-400/30 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                  <img 
                    src={logoBadge} 
                    alt="Valdir Discos" 
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "/valdir-logo-badge.jpg";
                    }}
                  />
                </div>
                <div>
                  <span className="font-black text-white text-base tracking-tight block">VALDIR DISCOS</span>
                  <span className="text-[10px] text-amber-300 font-serif italic font-bold">Disco é cultura.</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Loja especializada em discos de vinil, compactos e raridades para DJs, colecionadores e amantes da boa música.
              </p>
            </div>

            {/* Col 2: Services & Guarantees & Navigation */}
            <div className="space-y-2">
              <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Navegação & Diferenciais</h5>
              <div className="flex flex-wrap gap-1.5 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('discos');
                    setSelectedFormat('vinyl');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-800"
                >
                  Discos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('musica_online');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 text-[11px] font-bold border border-indigo-800"
                >
                  🎧 Música Online
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('garimpo');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-2 py-0.5 rounded bg-orange-950/80 hover:bg-orange-900 text-orange-300 text-[11px] font-bold border border-orange-800"
                >
                  🔥 Garimpo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('tshirts');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-[11px] font-bold border border-amber-800"
                >
                  👕 Camisetas
                </button>
              </div>
              <ul className="space-y-1.5 text-slate-400">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Avaliação detalhada padrão Goldmine</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Embalagens reforçadas para envio</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Discos testados e higienizados</span>
                </li>
              </ul>
            </div>

            {/* Col 3: Lojas nos Marketplaces */}
            <div className="space-y-2">
              <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Lojas Oficiais</h5>
              <div className="flex flex-col gap-1.5 text-xs">
                <a
                  href={OFFICIAL_MARKETPLACE_LINKS.shopee.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-[#ee4d2d] text-slate-300 hover:text-white transition-all flex items-center justify-between border border-slate-700/60 group"
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <ShoppingBag className="h-3.5 w-3.5 text-orange-400 group-hover:text-white" />
                    Shopee Oficial
                  </span>
                  <span className="text-[10px] text-orange-300 group-hover:text-white/90">Cupons Frete</span>
                </a>

                <a
                  href={OFFICIAL_MARKETPLACE_LINKS.mercadolivre.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-[#ffe600] text-slate-300 hover:text-slate-950 transition-all flex items-center justify-between border border-slate-700/60 group"
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <Store className="h-3.5 w-3.5 text-yellow-400 group-hover:text-slate-950" />
                    Mercado Livre
                  </span>
                  <span className="text-[10px] text-yellow-300 group-hover:text-slate-900">Mercado Envios</span>
                </a>

                <a
                  href={OFFICIAL_MARKETPLACE_LINKS.discogs.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-between border border-slate-700/60 group"
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <Disc className="h-3.5 w-3.5 text-amber-400 group-hover:text-white" />
                    Discogs Seller
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-200">Goldmine</span>
                </a>
              </div>
            </div>

            {/* Col 4: Contact & Store */}
            <div className="space-y-2">
              <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Atendimento Direto</h5>
              <div className="space-y-1.5">
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-emerald-400 font-bold hover:underline"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp: (55) 98116-4666</span>
                </a>
                <p className="text-[11px] text-slate-500">
                  PIX: <span className="font-mono text-slate-400">{pixKey}</span>
                </p>
              </div>
            </div>

            {/* Col 4: Horários & Formas de Envio */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">Atendimento & Envio</span>
              <ul className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                <li>• Seg a Sex: 09h às 18h | Sáb: 09h às 14h</li>
                <li>• Envio seguro com plástico bolha e cantoneiras</li>
                <li>• Retirada em mãos disponível na loja</li>
              </ul>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
            <p>© {new Date().getFullYear()} Valdir Discos. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              <p>Plataforma Integrada de E-commerce & Acervo</p>
              <button
                type="button"
                onClick={onOpenIntranet}
                className="text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1 cursor-pointer text-[10px]"
                title="Área Interna"
              >
                <Lock className="h-3 w-3" />
                <span>Restrito</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Product Details Modal */}
      <PublicProductModal
        listing={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        isInCart={selectedProduct ? cart.some(i => i.listing.id === selectedProduct.id) : false}
        whatsappNumber={whatsappNumber}
        onOpenAuthModal={() => {
          setAuthModalTab('login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Cart Drawer */}
      <PublicCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQty={handleUpdateQty}
        onClearCart={handleClearCart}
        whatsappNumber={whatsappNumber}
        pixKey={pixKey}
        onOpenAuthModal={() => {
          setAuthModalTab('login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Customer Login & Registration Modal */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      {/* Customer Dashboard / Profile / Wishlist Modal */}
      <CustomerDashboardModal
        isOpen={isDashboardModalOpen}
        onClose={() => setIsDashboardModalOpen(false)}
        listings={listings}
        onAddToCart={handleAddToCart}
        onSelectProduct={(listing) => {
          setIsDashboardModalOpen(false);
          setSelectedProduct(listing);
        }}
      />

      {/* Logo Upload Modal for Mobile */}
      <LogoUploadModal
        isOpen={isLogoUploadModalOpen}
        onClose={() => setIsLogoUploadModalOpen(false)}
      />

      {/* Valdir Virtual - Atendente Virtual */}
      <ValdirVirtualChat
        listings={listings}
        whatsappNumber={whatsappNumber}
        onSelectProduct={(listing) => setSelectedProduct(listing)}
      />

    </div>
  );
}

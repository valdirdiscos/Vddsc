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
  Music2,
  Package,
  Percent,
  Gift,
  LayoutGrid,
  Grid3X3,
  List,
  Table
} from 'lucide-react';
import { SavedListing, DJPlaylist, TShirtProduct, TShirtSize, TShirtModel, TShirtColor, AudioFormat, DigitalAlbumProduct } from '../types';
import { OFFICIAL_MARKETPLACE_LINKS } from '../constants';
import { MAJOR_GENRE_GROUPS, matchMajorGenre } from '../constants/musicGenres';
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
import { getListingFormatInfo, getItemConditionInfo, isNativistaGauchoItem, getNativistaInfo, isOnlineExclusiveItem, getOnlineExclusiveReason, getAlbumParticularities } from '../utils/formatHelper';
import { StoreViewMode, getSavedStoreViewMode, saveStoreViewMode } from '../utils/cookieStorage';

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

  // Main Category & Navigation: 'discos' | 'cds' | 'dvds' | 'nativista' | 'exclusivos' | 'tshirts' | 'musica_online' | 'highlights' | 'playlists' | 'about' | 'lotes' | 'promocoes'
  const [activeMainTab, setActiveMainTab] = useState<'discos' | 'cds' | 'dvds' | 'nativista' | 'exclusivos' | 'tshirts' | 'musica_online' | 'highlights' | 'playlists' | 'about' | 'lotes' | 'promocoes'>('discos');
  const [onlineMusicSubTab, setOnlineMusicSubTab] = useState<'digital' | 'streaming' | 'dj_sets'>('digital');
  
  // View Mode: 'grid' | 'compact' | 'list' | 'table_no_photos' (persisted via cookies + localStorage)
  const [storeViewMode, setStoreViewMode] = useState<StoreViewMode>(() => getSavedStoreViewMode());

  const handleStoreViewModeChange = (mode: StoreViewMode) => {
    setStoreViewMode(mode);
    saveStoreViewMode(mode);
  };

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('vinyl');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [conditionCategory, setConditionCategory] = useState<'all' | 'new' | 'used'>('all');
  const [particularityFilter, setParticularityFilter] = useState<'all' | 'double' | 'box' | 'gatefold' | 'special'>('all');
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
        if (selectedGenre === 'promocoes') {
          const isPromo = item.promoActive || item.pricing?.promoActive || (item.discountPercent && item.discountPercent > 0);
          if (!isPromo) return false;
        } else if (selectedGenre === 'lotes') {
          if (!item.isLote) return false;
        } else if (selectedGenre === 'nativista') {
          if (!isNativistaGauchoItem(item)) return false;
        } else {
          // Check matching against MAJOR_GENRE_GROUPS or legacy/custom IDs
          const matched = matchMajorGenre(item.release.genres, item.release.styles, selectedGenre);
          if (!matched) {
            const allStyles = [...(item.release.genres || []), ...(item.release.styles || [])].map(s => (s || '').toLowerCase());
            if (selectedGenre === 'mpb' && !allStyles.some(s => s.includes('mpb') || s.includes('bossa') || s.includes('samba') || s.includes('latin') || s.includes('brazilian') || s.includes('tropicalia'))) return false;
            if (selectedGenre === 'rock' && !allStyles.some(s => s.includes('rock') || s.includes('prog') || s.includes('hard') || s.includes('psychedelic') || s.includes('metal'))) return false;
            if (selectedGenre === 'soul_jazz' && !allStyles.some(s => s.includes('soul') || s.includes('funk') || s.includes('jazz') || s.includes('r&b') || s.includes('boogie') || s.includes('disco'))) return false;
            if (selectedGenre === 'eletronica' && !allStyles.some(s => s.includes('electronic') || s.includes('synth') || s.includes('house') || s.includes('techno') || s.includes('dance'))) return false;
            if (selectedGenre === 'reggae' && !allStyles.some(s => s.includes('reggae') || s.includes('dub') || s.includes('ska'))) return false;
            if (selectedGenre === 'rap' && !allStyles.some(s => s.includes('rap') || s.includes('hip hop') || s.includes('hip-hop') || s.includes('trap') || s.includes('boom bap'))) return false;
            if (selectedGenre === 'metal' && !allStyles.some(s => s.includes('metal') || s.includes('thrash') || s.includes('heavy') || s.includes('death') || s.includes('black metal') || s.includes('doom'))) return false;
            if (selectedGenre === 'samba' && !allStyles.some(s => s.includes('samba') || s.includes('pagode') || s.includes('choro') || s.includes('partido alto'))) return false;
            if (!allStyles.some(s => s.includes(selectedGenre.toLowerCase()))) return false;
          }
        }
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

      // Tab Nativista / Música Gaúcha (RS)
      if (activeMainTab === 'nativista') {
        if (!isNativistaGauchoItem(item)) return false;
      }

      // Tab Exclusivos do Site / Discos Raros
      if (activeMainTab === 'exclusivos') {
        if (!isOnlineExclusiveItem(item)) return false;
      }

      // Tab Lotes & Combos (4 Discos)
      if (activeMainTab === 'lotes') {
        if (!item.isLote) return false;
      }

      // Tab Promoções & Bônus (% OFF)
      if (activeMainTab === 'promocoes') {
        const isPromo = item.promoActive || item.pricing?.promoActive || (item.discountPercent && item.discountPercent > 0);
        if (!isPromo) return false;
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
  }, [listings, searchQuery, selectedGenre, selectedFormat, selectedCondition, conditionCategory, particularityFilter, sortBy, availabilityFilter, activeMainTab]);

  const genresPills = [
    { id: 'all', label: '🔥 Todo o Acervo' },
    { id: 'nativista', label: '🧉 Música Gaúcha (RS)' },
    { id: 'promocoes', label: '🏷️ Promoções (% OFF)' },
    { id: 'lotes', label: '📦 Lotes (4 Discos)' },
    { id: 'rap_hiphop', label: '🎤 Rap & Hip-Hop' },
    { id: 'rock', label: '🎸 Rock Clássico' },
    { id: 'heavy_metal', label: '⚡ Metal & Hard' },
    { id: 'mpb', label: '🇧🇷 MPB & Tropicália' },
    { id: 'samba_pagode', label: '🪘 Samba & Pagode' },
    { id: 'soul_funk', label: '🎷 Soul, Funk & Disco' },
    { id: 'jazz_blues', label: '🎺 Jazz & Blues' },
    { id: 'eletronica', label: '🎛️ Eletrônica & Synth' },
    { id: 'reggae_ska', label: '🟢 Reggae & Dub' },
    { id: 'sertanejo_regional', label: '🤠 Sertanejo & Forró' },
    { id: 'pop', label: '✨ Pop' },
    { id: 'latin_world', label: '🌎 Música Latina' },
    { id: 'gospel_religioso', label: '🕊️ Gospel' },
    { id: 'instrumental_soundtracks', label: '🎻 Instrumental & Trilhas' }
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

        {/* Categorias Principais - Menu Limpo, Direto e Focado em Vendas */}
        <nav className="border-t border-b border-slate-200/80 bg-white/95 backdrop-blur-sm sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Discos de Vinil */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('discos');
                  setSelectedFormat('vinyl');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeMainTab === 'discos'
                    ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeMainTab === 'cds'
                    ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeMainTab === 'dvds'
                    ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-[11px]">🎬</span>
                <span>DVDs</span>
              </button>

              {/* Música Gaúcha (Nativista) */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('nativista');
                  setSelectedFormat('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeMainTab === 'nativista'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-emerald-50/80 text-emerald-950 border-emerald-200 hover:bg-emerald-100/70'
                }`}
              >
                <span className="text-[12px]">🧉</span>
                <span>Música Gaúcha</span>
              </button>

              {/* Lotes de Discos */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('lotes');
                  setSelectedFormat('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeMainTab === 'lotes'
                    ? 'bg-slate-900 text-amber-300 border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Package className="h-3.5 w-3.5 text-amber-500" />
                <span>Lotes (4 Discos)</span>
              </button>

              {/* Promoções */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('promocoes');
                  setSelectedFormat('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeMainTab === 'promocoes'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-rose-50/80 text-rose-950 border-rose-200 hover:bg-rose-100/70'
                }`}
              >
                <Percent className="h-3.5 w-3.5 text-rose-600" />
                <span>Promoções</span>
              </button>

              {/* Exclusivos do Site */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('exclusivos');
                  setSelectedFormat('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeMainTab === 'exclusivos'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                    : 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100/80'
                }`}
              >
                <Star className="h-3.5 w-3.5 text-amber-600 fill-amber-600" />
                <span>Exclusivos</span>
              </button>

              {/* Camisetas */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('tshirts');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeMainTab === 'tshirts'
                    ? 'bg-amber-950 text-amber-200 border-amber-950 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Shirt className="h-3.5 w-3.5 text-amber-600" />
                <span>Camisetas</span>
              </button>

              {/* Música Digital */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('musica_online');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeMainTab === 'musica_online' || activeMainTab === 'playlists'
                    ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                    : 'bg-indigo-50/80 text-indigo-950 border-indigo-200 hover:bg-indigo-100/70'
                }`}
              >
                <Headphones className="h-3.5 w-3.5 text-indigo-500" />
                <span>Música Digital</span>
              </button>
            </div>

            {/* Link Sobre a Loja */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-2">
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('about');
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 ${
                  activeMainTab === 'about'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Info className="h-3 w-3 text-slate-400" />
                <span>Sobre</span>
              </button>
            </div>
          </div>

          {/* Sub-menu minimalista quando estiver em Música Digital */}
          {(activeMainTab === 'musica_online' || activeMainTab === 'playlists') && (
            <div className="border-t border-indigo-100 bg-indigo-50/50 px-3 sm:px-6 py-1.5">
              <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold text-indigo-900/70 shrink-0">Opções Digitais:</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('musica_online');
                    setOnlineMusicSubTab('digital');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeMainTab === 'musica_online' && onlineMusicSubTab === 'digital'
                      ? 'bg-indigo-900 text-white shadow-xs'
                      : 'bg-white text-indigo-950 border border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  Downloads (FLAC / MP3)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab('musica_online');
                    setOnlineMusicSubTab('streaming');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeMainTab === 'musica_online' && onlineMusicSubTab === 'streaming'
                      ? 'bg-indigo-900 text-white shadow-xs'
                      : 'bg-white text-indigo-950 border border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  Playlists Spotify & YouTube
                </button>
                {playlists.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMainTab('musica_online');
                      setOnlineMusicSubTab('dj_sets');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeMainTab === 'musica_online' && onlineMusicSubTab === 'dj_sets'
                        ? 'bg-indigo-900 text-white shadow-xs'
                        : 'bg-white text-indigo-950 border border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    Sets de DJs ({playlists.length})
                  </button>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Music Genre Filter Strip */}
        {(activeMainTab === 'discos' || activeMainTab === 'cds' || activeMainTab === 'dvds' || activeMainTab === 'nativista' || activeMainTab === 'exclusivos' || activeMainTab === 'highlights' || activeMainTab === 'lotes' || activeMainTab === 'promocoes') && (
          <div className="border-t border-slate-100 bg-slate-50/70 py-1.5 px-3 sm:px-6">
            <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline shrink-0">
                Gênero:
              </span>
              {genresPills.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGenre(g.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedGenre === g.id
                      ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
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
          <div className="bg-gradient-to-r from-[#0c232a] via-[#163840] to-[#8c3518] text-white rounded-2xl p-4 sm:p-5 shadow-md border border-teal-900/40 relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold shadow-xs">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>Curadoria Valdir Discos</span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight font-sans">
                  Discos de Vinil Originais & Higienizados
                </h2>
                
                <p className="text-xs text-slate-200/90 leading-relaxed font-medium max-w-xl">
                  Avaliados no padrão internacional Goldmine, testados e com envio seguro para todo o Brasil.
                </p>

                <div className="pt-1 flex items-center justify-center sm:justify-start gap-3">
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Olá Valdir! Gostaria de consultar um disco no catálogo online.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp do Valdir</span>
                  </a>
                  <span className="text-xs text-amber-300/80 font-serif italic font-bold">
                    ★ Disco é cultura
                  </span>
                </div>
              </div>

              {/* Logo Emblem Badge Compact */}
              <div className="hidden sm:flex items-center justify-center shrink-0">
                <div className="w-20 h-20 rounded-full p-1 bg-white/95 shadow-md border-2 border-amber-400 overflow-hidden">
                  <img 
                    src={logoBadge} 
                    alt="Valdir Discos" 
                    className="w-full h-full object-contain rounded-full"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "/valdir-logo-badge.jpg";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nativista & Música Gaúcha Spotlight Banner (when on Nativista tab and not searching) */}
        {!searchQuery && activeMainTab === 'nativista' && (
          <div className="bg-gradient-to-r from-[#062419] via-[#0d3b2a] to-[#14532d] text-white rounded-2xl p-4 sm:p-5 shadow-md border border-emerald-600/40 relative overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 text-xs font-bold uppercase tracking-wide">
                  <span>🧉</span>
                  <span>Música Gaúcha & Festivais</span>
                </div>
                
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Cancioneiro Gaúcho, Milongas e Tradição Nativista
                </h2>
                
                <p className="text-xs text-emerald-100/90 font-medium max-w-xl">
                  Discos de música regional do Rio Grande do Sul, festivais nativistas, milongas e chamamés em prensagens originais.
                </p>
              </div>

              <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 items-center justify-center text-2xl shrink-0">
                🧉
              </div>
            </div>
          </div>
        )}

        {/* Exclusivos do Site Spotlight Banner (when on Exclusivos tab and not searching) */}
        {!searchQuery && activeMainTab === 'exclusivos' && (
          <div className="bg-gradient-to-r from-[#1c160c] via-[#2f220f] to-[#453213] text-white rounded-2xl p-4 sm:p-5 shadow-md border border-amber-500/40 relative overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold uppercase tracking-wide">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  <span>Raridades & Edições Especiais</span>
                </div>
                
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Acervo Selecionado Exclusivo do Site
                </h2>
                
                <p className="text-xs text-amber-100/90 font-medium max-w-xl">
                  Discos de vinil raros, primeiras prensagens e tiragens históricas selecionadas pelo Valdir.
                </p>
              </div>

              <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/30 items-center justify-center text-amber-300 shrink-0">
                <Star className="h-6 w-6 fill-amber-400" />
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
            {/* Filter and Sorting Toolbar - Limpo, Direto e Focado no Produto */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'itens'}
                </span>

                {/* Format Filter */}
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  {activeMainTab === 'discos' ? (
                    <>
                      <option value="vinyl">Vinis: Todos</option>
                      <option value="lp">LPs 12"</option>
                      <option value="single">Compactos 7"</option>
                      <option value="vinyl_10">Vinil 10"</option>
                    </>
                  ) : activeMainTab === 'cds' ? (
                    <>
                      <option value="cd">CDs: Todos</option>
                    </>
                  ) : activeMainTab === 'dvds' ? (
                    <>
                      <option value="dvd">DVDs: Todos</option>
                    </>
                  ) : (
                    <>
                      <option value="all">Formato: Todos</option>
                      <option value="vinyl">Discos de Vinil</option>
                      <option value="cd">CDs</option>
                      <option value="dvd">DVDs</option>
                    </>
                  )}
                </select>

                {/* Availability Filter */}
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Todos</option>
                  <option value="available">🟢 Disponíveis</option>
                  <option value="sold">🔴 Vendidos</option>
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
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Condição: Todas</option>
                  <option value="new">Novos / Lacrados</option>
                  <option value="nm_plus">Near Mint (NM)</option>
                  <option value="vg_plus">VG+ ou superior</option>
                </select>

                {/* Particularity / Edition Filter */}
                <select
                  value={particularityFilter}
                  onChange={(e) => setParticularityFilter(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Edição: Todas</option>
                  <option value="double">Álbuns Duplos</option>
                  <option value="box">Box Sets</option>
                  <option value="gatefold">Capa Dupla</option>
                  <option value="special">Edição Especial</option>
                </select>
              </div>

              {/* Sorting & View Mode Controls */}
              <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                <div className="flex items-center gap-1.5">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value="newest">🔥 Mais Recentes</option>
                    <option value="price_asc">💰 Menor Preço</option>
                    <option value="price_desc">💎 Maior Preço</option>
                    <option value="artist_asc">🔤 Artista (A-Z)</option>
                  </select>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleStoreViewModeChange('grid')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      storeViewMode === 'grid'
                        ? 'bg-white text-slate-950 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Modo Grade Vitrine"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span className="text-[10px] hidden md:inline">Grade</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStoreViewModeChange('compact')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      storeViewMode === 'compact'
                        ? 'bg-white text-slate-950 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Modo Grade Compacta"
                  >
                    <Grid3X3 className="h-3.5 w-3.5" />
                    <span className="text-[10px] hidden md:inline">Compacto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStoreViewModeChange('list')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      storeViewMode === 'list'
                        ? 'bg-white text-slate-950 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Modo Lista Detalhada"
                  >
                    <List className="h-3.5 w-3.5" />
                    <span className="text-[10px] hidden md:inline">Lista</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStoreViewModeChange('table_no_photos')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      storeViewMode === 'table_no_photos'
                        ? 'bg-white text-slate-950 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Modo Tabela Rápida"
                  >
                    <Table className="h-3.5 w-3.5" />
                    <span className="text-[10px] hidden md:inline">Tabela</span>
                  </button>
                </div>
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
                      : activeMainTab === 'lotes'
                      ? 'Nenhum lote de 4 discos encontrado com estes filtros'
                      : activeMainTab === 'promocoes'
                      ? 'Nenhuma promoção ou item com bônus encontrado no momento'
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
            ) : storeViewMode === 'table_no_photos' ? (
              /* Modo Tabela de Consulta Rápida */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wider font-black">
                        <th className="py-3 px-3 w-12 text-center">Capa</th>
                        <th className="py-3 px-3">Título & Artista</th>
                        <th className="py-3 px-3 w-28">Formato</th>
                        <th className="py-3 px-3 w-24">Condição</th>
                        <th className="py-3 px-3 w-28">Gênero</th>
                        <th className="py-3 px-3 w-28 text-right">Preço</th>
                        <th className="py-3 px-3 w-24 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredListings.map((item) => {
                        const { release, condition, pricing } = item;
                        const price = pricing?.directPrice || pricing?.basePriceBrl || 0;
                        const cover = (item.customImages && item.customImages.length > 0 && item.customImages[0]) || release.coverImage;
                        const formatInfo = getListingFormatInfo(item);
                        const conditionInfo = getItemConditionInfo(item);
                        const isPromo = !!(item.promoActive || pricing?.promoActive || (item.discountPercent && item.discountPercent > 0));
                        const discountPercent = item.discountPercent || pricing?.discountPercent || 15;
                        const origPrice = item.originalPrice || pricing?.originalPrice || (isPromo && discountPercent > 0 ? Math.round(price / (1 - discountPercent / 100)) : price);
                        const isOutOfStock = !item.salesChannels || item.salesChannels.length === 0 || (item.salesChannels.length === 1 && item.salesChannels[0] === 'none');
                        const isSoldOrUnavailable = item.status === 'sold' || isOutOfStock;
                        const isNativista = isNativistaGauchoItem(item);

                        return (
                          <tr 
                            key={item.id}
                            className={`hover:bg-amber-50/40 transition-colors cursor-pointer ${
                              isSoldOrUnavailable ? 'opacity-60 bg-slate-50/60' : ''
                            }`}
                            onClick={() => setSelectedProduct(item)}
                          >
                            <td className="py-2 px-3 text-center">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 mx-auto relative shrink-0 border border-slate-200">
                                {cover ? (
                                  <img 
                                    src={cover} 
                                    alt={release.title} 
                                    className="w-full h-full object-cover" 
                                    loading="lazy" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <Disc className="w-5 h-5 text-slate-400 m-auto mt-2.5" />
                                )}
                                {isSoldOrUnavailable && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-[7px] text-white font-black uppercase">Esgotado</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 line-clamp-1">{release.title}</div>
                              <div className="text-[11px] text-amber-800 font-semibold line-clamp-1 flex items-center gap-1.5">
                                <span>{release.artist}</span>
                                {release.year && <span className="text-slate-400 font-normal font-mono text-[10px]">({release.year})</span>}
                                {isNativista && (
                                  <span className="px-1 py-0.2 rounded text-[8px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    🧉 Nativista
                                  </span>
                                )}
                                {item.isLote && (
                                  <span className="px-1 py-0.2 rounded text-[8px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
                                    Lote {item.loteItemCount || 4}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase inline-block ${formatInfo.badgeBg}`}>
                                {formatInfo.badgeLabel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {conditionInfo.isNew ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white uppercase">
                                  Novo
                                </span>
                              ) : condition?.mediaCondition ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-800 text-slate-100 uppercase">
                                  {condition.mediaCondition}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-[11px] truncate max-w-[120px]">
                              {release.genres?.[0] || release.styles?.[0] || 'Geral'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isPromo && origPrice > price && (
                                <div className="text-[9px] line-through text-slate-400 font-mono font-bold">
                                  R$ {origPrice.toFixed(2)}
                                </div>
                              )}
                              <span className={`font-mono font-black ${
                                isSoldOrUnavailable 
                                  ? 'text-slate-500 line-through' 
                                  : isPromo 
                                  ? 'text-rose-600' 
                                  : 'text-slate-900'
                              }`}>
                                R$ {price.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              {isSoldOrUnavailable ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedProduct(item)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-300 cursor-pointer"
                                >
                                  Esgotado
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(item)}
                                  className="p-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all cursor-pointer shadow-xs active:scale-95 inline-flex items-center justify-center"
                                  title="Adicionar ao Carrinho"
                                >
                                  <ShoppingBag className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : storeViewMode === 'list' ? (
              /* Modo Lista Detalhada */
              <div className="flex flex-col gap-3">
                {filteredListings.map((item) => {
                  const { release, condition, pricing } = item;
                  const price = pricing?.directPrice || pricing?.basePriceBrl || 0;
                  const cover = (item.customImages && item.customImages.length > 0 && item.customImages[0]) || release.coverImage;
                  const formatInfo = getListingFormatInfo(item);
                  const conditionInfo = getItemConditionInfo(item);
                  const particularities = getAlbumParticularities(item);
                  const isPromo = !!(item.promoActive || pricing?.promoActive || (item.discountPercent && item.discountPercent > 0));
                  const discountPercent = item.discountPercent || pricing?.discountPercent || 15;
                  const origPrice = item.originalPrice || pricing?.originalPrice || (isPromo && discountPercent > 0 ? Math.round(price / (1 - discountPercent / 100)) : price);
                  const promoBadge = item.promoBadge || pricing?.promoBadge || `${discountPercent}% OFF`;
                  const bonusText = item.bonusDescription || pricing?.bonusDescription;
                  const isOutOfStock = !item.salesChannels || item.salesChannels.length === 0 || (item.salesChannels.length === 1 && item.salesChannels[0] === 'none');
                  const isSoldOrUnavailable = item.status === 'sold' || isOutOfStock;
                  const isNativista = isNativistaGauchoItem(item);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-stretch overflow-hidden group hover:border-amber-400/60 p-3 sm:p-4 gap-3.5"
                    >
                      {/* Left: Cover Thumbnail with Minimal Badges */}
                      <div 
                        onClick={() => setSelectedProduct(item)}
                        className="w-full sm:w-28 sm:h-28 aspect-square rounded-xl bg-slate-900 relative overflow-hidden cursor-pointer shrink-0"
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
                            <Disc className="h-8 w-8 mb-1 text-slate-700" />
                            <span className="text-[9px] font-bold">Sem Foto</span>
                          </div>
                        )}

                        {/* Minimal Badges on image */}
                        <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5 items-start">
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase shadow-xs ${formatInfo.badgeBg}`}>
                            {formatInfo.badgeLabel}
                          </span>
                          {conditionInfo.isNew ? (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-600 text-white shadow-xs uppercase">
                              Novo
                            </span>
                          ) : condition?.mediaCondition ? (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-slate-950/80 text-slate-100 backdrop-blur-xs shadow-xs">
                              {condition.mediaCondition}
                            </span>
                          ) : null}
                          {isNativista && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-800 text-white shadow-xs">
                              🧉 Nativista
                            </span>
                          )}
                        </div>

                        {/* Sold overlay */}
                        {isSoldOrUnavailable && (
                          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] flex items-center justify-center p-1 text-center">
                            <span className="px-2 py-0.5 bg-rose-600/90 text-white font-black text-[9px] uppercase tracking-wider rounded">
                              Esgotado
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Middle: Info */}
                      <div 
                        onClick={() => setSelectedProduct(item)}
                        className="flex-1 min-w-0 flex flex-col justify-between cursor-pointer space-y-1"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                              {release.title}
                            </h4>
                            {release.year && (
                              <span className="text-xs text-slate-400 font-mono">({release.year})</span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-amber-800 truncate">
                            {release.artist}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {release.label || 'Nacional'} {release.country ? `• ${release.country}` : ''}
                          </p>
                        </div>

                        {/* Tags & Particularities */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {isNativista && (
                            <span className="text-[9px] font-black text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span>🧉</span>
                              <span>Música Gaúcha (RS)</span>
                            </span>
                          )}
                          {item.isLote && (
                            <span className="text-[9px] font-black text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Package className="h-2.5 w-2.5 text-indigo-600" />
                              <span>Lote {item.loteItemCount || 4} Discos</span>
                            </span>
                          )}
                          {isOnlineExclusiveItem(item) && (
                            <span className="text-[9px] font-black text-amber-950 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                              ⭐ Exclusivo do Site
                            </span>
                          )}
                          {particularities.slice(0, 3).map((part) => (
                            <span
                              key={part.id}
                              className="text-[9px] font-bold text-amber-950 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1"
                            >
                              <span>{part.icon}</span>
                              <span>{part.shortLabel}</span>
                            </span>
                          ))}
                          {bonusText && (
                            <span className="text-[9px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Gift className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                              <span className="truncate max-w-[200px]">{bonusText}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Pricing & Cart Action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-4 shrink-0">
                        <div className="text-left sm:text-right">
                          <span className="text-[9px] text-slate-400 font-semibold block uppercase">
                            {isPromo ? 'Preço Promocional' : 'Preço'}
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            {isPromo && origPrice > price && (
                              <span className="text-[11px] line-through text-slate-400 font-bold font-mono">
                                R$ {origPrice.toFixed(2)}
                              </span>
                            )}
                            <span className={`text-base font-black ${
                              isSoldOrUnavailable 
                                ? 'text-slate-500 line-through' 
                                : isPromo 
                                ? 'text-rose-600 font-mono' 
                                : 'text-slate-950'
                            }`}>
                              R$ {price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
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
                            className={`p-2 rounded-xl transition-all cursor-pointer border ${
                              isInWishlist(item.id)
                                ? 'bg-rose-50 border-rose-200 text-rose-600'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                            }`}
                            title="Favoritos"
                          >
                            <Heart className={`h-4 w-4 ${isInWishlist(item.id) ? 'fill-rose-600' : ''}`} />
                          </button>

                          {isSoldOrUnavailable ? (
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(item)}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer border border-slate-300 flex items-center gap-1.5"
                              title="Ver detalhes do item"
                            >
                              <Eye className="h-4 w-4 text-slate-500" />
                              <span>Esgotado</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item)}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                              title="Adicionar ao Carrinho"
                            >
                              <ShoppingBag className="h-4 w-4" />
                              <span>Comprar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Modo Grade (grid padrão ou compact densa) */
              <div className={
                storeViewMode === 'compact'
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5"
                  : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5"
              }>
                {filteredListings.map((item) => {
                  const { release, condition, pricing } = item;
                  const price = pricing?.directPrice || pricing?.basePriceBrl || 0;
                  const cover = (item.customImages && item.customImages.length > 0 && item.customImages[0]) || release.coverImage;
                  const formatInfo = getListingFormatInfo(item);
                  const conditionInfo = getItemConditionInfo(item);
                  const particularities = getAlbumParticularities(item);
                  const isPromo = !!(item.promoActive || pricing?.promoActive || (item.discountPercent && item.discountPercent > 0));
                  const discountPercent = item.discountPercent || pricing?.discountPercent || 15;
                  const origPrice = item.originalPrice || pricing?.originalPrice || (isPromo && discountPercent > 0 ? Math.round(price / (1 - discountPercent / 100)) : price);
                  const promoBadge = item.promoBadge || pricing?.promoBadge || `${discountPercent}% OFF`;
                  const bonusText = item.bonusDescription || pricing?.bonusDescription;
                  const isOutOfStock = !item.salesChannels || item.salesChannels.length === 0 || (item.salesChannels.length === 1 && item.salesChannels[0] === 'none');
                  const isSoldOrUnavailable = item.status === 'sold' || isOutOfStock;
                  const isNativista = isNativistaGauchoItem(item);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group hover:border-amber-400/60 ${
                        storeViewMode === 'compact' ? 'rounded-xl' : 'rounded-2xl'
                      }`}
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

                        {/* Minimal, Uncluttered Badges on Image */}
                        <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5 items-start max-w-[85%]">
                          {/* Lote */}
                          {item.isLote && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-slate-900 text-amber-300 shadow-xs uppercase tracking-wider border border-amber-500/40">
                              Lote {item.loteItemCount || 4}
                            </span>
                          )}

                          {/* Promo */}
                          {isPromo && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-rose-600 text-white shadow-xs uppercase tracking-wider border border-rose-400/40">
                              {promoBadge}
                            </span>
                          )}

                          {/* Formato */}
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase shadow-xs ${formatInfo.badgeBg}`}>
                            {formatInfo.badgeLabel}
                          </span>

                          {/* Nativista / Música Gaúcha */}
                          {isNativista && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-800 text-white shadow-xs flex items-center gap-0.5 border border-emerald-600/40 uppercase tracking-wider">
                              <span>🧉</span>
                              <span>Nativista</span>
                            </span>
                          )}

                          {/* Exclusivo Site */}
                          {isOnlineExclusiveItem(item) && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-amber-400 text-slate-950 shadow-xs uppercase tracking-wider">
                              ⭐ Exclusivo
                            </span>
                          )}

                          {/* Condição simplificada: "VG+", "EX", "Novo", etc. SEM A PALAVRA 'Mídia:' */}
                          {conditionInfo.isNew ? (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-600 text-white shadow-xs uppercase tracking-wide">
                              Novo
                            </span>
                          ) : condition?.mediaCondition ? (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-slate-950/80 text-slate-100 backdrop-blur-xs shadow-xs">
                              {condition.mediaCondition}
                            </span>
                          ) : null}
                        </div>

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
                          className={`absolute top-1.5 right-1.5 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-sm ${
                            isInWishlist(item.id)
                              ? 'bg-rose-500 text-white hover:bg-rose-600 scale-110'
                              : 'bg-black/50 text-white/80 hover:text-white hover:bg-black/70'
                          }`}
                          title={isInWishlist(item.id) ? 'Remover dos Favoritos' : 'Adicionar à Lista de Desejos'}
                        >
                          <Heart className={`h-3 w-3 ${isInWishlist(item.id) ? 'fill-white' : ''}`} />
                        </button>

                        {/* Sold / Out of stock overlay */}
                        {isSoldOrUnavailable && (
                          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center">
                            <span className="px-2 py-0.5 bg-rose-600/90 text-white font-black text-[10px] uppercase tracking-wider rounded shadow-md border border-rose-400/40">
                              Esgotado
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Details */}
                      <div className={`flex-1 flex flex-col justify-between ${
                        storeViewMode === 'compact' ? 'p-2.5 space-y-1.5' : 'p-3.5 space-y-2'
                      }`}>
                        <div 
                          onClick={() => setSelectedProduct(item)}
                          className="cursor-pointer space-y-0.5"
                        >
                          <h4 className={`font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors ${
                            storeViewMode === 'compact' ? 'text-[11px]' : 'text-xs'
                          }`}>
                            {release.title}
                          </h4>
                          <p className={`font-bold text-amber-800 truncate ${
                            storeViewMode === 'compact' ? 'text-[10px]' : 'text-[11px]'
                          }`}>
                            {release.artist}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {release.label || 'Nacional'} {release.year ? `• ${release.year}` : ''}
                          </p>

                          {/* Bonus text chip if exists */}
                          {bonusText && (
                            <div className="pt-0.5">
                              <span className="text-[8px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-1.5 py-0.2 rounded flex items-center gap-1">
                                <Gift className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                                <span className="truncate max-w-[120px]">{bonusText}</span>
                              </span>
                            </div>
                          )}

                          {/* Particularidades chips in card info below photo */}
                          {particularities.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {particularities.slice(0, 2).map((part) => (
                                <span
                                  key={part.id}
                                  className="text-[8.5px] font-bold text-amber-950 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded flex items-center gap-1"
                                >
                                  <span>{part.icon}</span>
                                  <span className="truncate max-w-[100px]">{part.shortLabel}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pricing & Action */}
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          <div>
                            <span className="text-[8px] text-slate-400 font-semibold block uppercase leading-none">
                              {isPromo ? 'Promo' : 'Preço'}
                            </span>
                            <div className="flex items-baseline gap-1 flex-wrap">
                              {isPromo && origPrice > price && (
                                <span className="text-[9px] line-through text-slate-400 font-bold font-mono">
                                  R$ {origPrice.toFixed(2)}
                                </span>
                              )}
                              <span className={`font-black ${
                                storeViewMode === 'compact' ? 'text-xs' : 'text-sm'
                              } ${
                                isSoldOrUnavailable 
                                  ? 'text-slate-500 line-through' 
                                  : isPromo 
                                  ? 'text-rose-600 font-mono' 
                                  : 'text-slate-950'
                              }`}>
                                R$ {price.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {isSoldOrUnavailable ? (
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(item)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer border border-slate-300 flex items-center gap-1 shrink-0"
                              title="Ver detalhes do item esgotado"
                            >
                              <Eye className="h-3 w-3 text-slate-500" />
                              <span>Esgotado</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item)}
                              className={`bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all cursor-pointer shadow-xs active:scale-90 shrink-0 ${
                                storeViewMode === 'compact' ? 'p-1.5 rounded-lg' : 'p-2 rounded-xl'
                              }`}
                              title="Adicionar ao Carrinho"
                            >
                              <ShoppingBag className={storeViewMode === 'compact' ? "h-3.5 w-3.5" : "h-4 w-4"} />
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
                    setActiveMainTab('nativista');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-[11px] font-bold border border-emerald-800 cursor-pointer"
                >
                  🧉 Música Gaúcha
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

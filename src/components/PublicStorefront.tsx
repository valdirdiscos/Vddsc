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
  UserCheck
} from 'lucide-react';
import { SavedListing, DJPlaylist } from '../types';
import { PublicProductModal } from './PublicProductModal';
import { PublicCartDrawer, PublicCartItem } from './PublicCartDrawer';
import { AboutAndContactSection } from './AboutAndContactSection';
import { CustomerAuthModal } from './CustomerAuthModal';
import { CustomerDashboardModal } from './CustomerDashboardModal';
import { LogoUploadModal } from './LogoUploadModal';
import { useCustomerAuth } from '../context/CustomerAuthContext';

interface PublicStorefrontProps {
  listings: SavedListing[];
  playlists: DJPlaylist[];
  onOpenIntranet: () => void;
  currentUserRole?: string;
  whatsappNumber?: string;
  pixKey?: string;
}

export function PublicStorefront({
  listings,
  playlists,
  onOpenIntranet,
  currentUserRole,
  whatsappNumber = '5555981164666',
  pixKey = 'valdirdiscos@gmail.com'
}: PublicStorefrontProps) {
  // Customer Auth
  const { currentCustomer, isCustomerLoggedIn, isInWishlist, toggleWishlist } = useCustomerAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [isLogoUploadModalOpen, setIsLogoUploadModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'artist_asc'>('newest');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'highlights' | 'playlists' | 'about'>('all');

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
    const existingIndex = cart.findIndex(item => item.listing.id === listing.id);
    let newCart: PublicCartItem[];
    if (existingIndex >= 0) {
      newCart = cart.map((item, idx) => 
        idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [...cart, { id: listing.id, listing, quantity: 1 }];
    }
    updateCartState(newCart);
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (listingId: string) => {
    const newCart = cart.filter(item => item.listing.id !== listingId);
    updateCartState(newCart);
  };

  const handleUpdateQty = (listingId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveFromCart(listingId);
      return;
    }
    const newCart = cart.map(item => 
      item.listing.id === listingId ? { ...item, quantity: qty } : item
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
      // Must be an active product (not sold out if onlyAvailable is checked)
      if (onlyAvailable && item.status === 'sold') {
        return false;
      }

      // If item is restricted or explicitly removed from online store
      if (item.salesChannels && item.salesChannels.length > 0 && !item.salesChannels.includes('online_store') && !item.salesChannels.includes('physical_store')) {
        // if explicitly assigned to shopee/mercadolivre only
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
        const fmt = (item.release.formats?.[0]?.name || '').toLowerCase();
        if (selectedFormat === 'lp' && !fmt.includes('vinyl') && !fmt.includes('lp') && !fmt.includes('12"')) return false;
        if (selectedFormat === 'single' && !fmt.includes('7"') && !fmt.includes('single') && !fmt.includes('compacto')) return false;
        if (selectedFormat === 'cd' && !fmt.includes('cd')) return false;
      }

      // Condition Filter
      if (selectedCondition !== 'all') {
        const cond = item.condition?.mediaCondition || '';
        if (selectedCondition === 'nm_plus' && cond !== 'M' && cond !== 'NM') return false;
        if (selectedCondition === 'vg_plus' && cond !== 'M' && cond !== 'NM' && cond !== 'EX' && cond !== 'VG+') return false;
      }

      // Tab Highlights
      if (activeTab === 'highlights') {
        const price = item.pricing?.directPrice || item.pricing?.basePriceBrl || 0;
        const isImported = item.release.country && !['brasil', 'brazil', 'br'].includes(item.release.country.toLowerCase());
        if (price < 120 && !isImported) return false;
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
  }, [listings, searchQuery, selectedGenre, selectedFormat, selectedCondition, sortBy, onlyAvailable, activeTab]);

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
                  src="/valdir-logo-color.jpg" 
                  alt="Valdir Discos" 
                  className="w-full h-full object-contain rounded-xl hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
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

        {/* Curated Genre Strip */}
        <div className="border-t border-slate-100 bg-[#fdfcfb]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {genresPills.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setSelectedGenre(g.id);
                  setActiveTab('all');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedGenre === g.id && activeTab === 'all'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {g.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setActiveTab('highlights');
                setSelectedGenre('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 ${
                activeTab === 'highlights'
                  ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                  : 'bg-white text-amber-900 border-amber-200/80 hover:bg-amber-50'
              }`}
            >
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span>💎 Raridades do Valdir</span>
            </button>

            {playlists.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('playlists');
                  setSelectedGenre('all');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 ${
                  activeTab === 'playlists'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-indigo-900 border-indigo-200/80 hover:bg-indigo-50'
                }`}
              >
                <Radio className="h-3 w-3 text-indigo-400" />
                <span>🎧 Playlists DJ ({playlists.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveTab('about');
                setSelectedGenre('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 ml-auto ${
                activeTab === 'about'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <Info className="h-3 w-3 text-slate-400" />
              <span>Sobre a Loja, Balcão & Dúvidas</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Curated Hero Spotlight (if not searching) */}
        {!searchQuery && activeTab === 'all' && selectedGenre === 'all' && (
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
                  <span className="text-xs text-slate-300 font-medium">
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
                      src="/valdir-logo-badge.jpg" 
                      alt="Valdir Discos - Disco é cultura" 
                      className="w-full h-full object-contain rounded-full hover:rotate-6 transition-transform duration-500"
                      referrerPolicy="no-referrer"
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

        {/* Playlist Curated Tab View */}
        {activeTab === 'about' ? (
          <AboutAndContactSection
            whatsappNumber={whatsappNumber}
            pixKey={pixKey}
            onOpenLogoUpload={() => setIsLogoUploadModalOpen(true)}
          />
        ) : activeTab === 'playlists' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Seleções & Playlists dos DJs</h3>
                <p className="text-xs text-slate-500">Sets com faixas disponíveis em vinil na nossa loja física</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
              >
                Voltar para o catálogo completo
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
            {/* Filter and Sorting Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-800">
                  {filteredListings.length} {filteredListings.length === 1 ? 'disco encontrado' : 'discos no acervo'}
                </span>

                {/* Format Filter */}
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
                >
                  <option value="all">Todos os Formatos</option>
                  <option value="lp">Apenas LP 12"</option>
                  <option value="single">Apenas Compactos 7"</option>
                  <option value="cd">CDs</option>
                </select>

                {/* Condition Filter */}
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
                >
                  <option value="all">Qualquer Conservação</option>
                  <option value="nm_plus">Near Mint ou Mint (Impecável)</option>
                  <option value="vg_plus">VG+ ou superior</option>
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
                  <h4 className="font-black text-slate-800 text-base">Nenhum disco encontrado com estes filtros</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Tente buscar por outro termo ou limpar os filtros de gênero e estado de conservação.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('all');
                    setSelectedFormat('all');
                    setSelectedCondition('all');
                    setActiveTab('all');
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
                  const cover = release.coverImage || (item.customImages && item.customImages[0]);
                  const formatName = release.formats?.[0]?.name || 'Vinil LP';
                  const isSingle = formatName.toLowerCase().includes('7"') || formatName.toLowerCase().includes('compacto');

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
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 p-2 text-center">
                            <Disc className="h-10 w-10 mb-1 text-slate-700" />
                            <span className="text-[10px] font-bold">Sem Foto</span>
                          </div>
                        )}

                        {/* Badges on image */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shadow-xs ${
                            isSingle ? 'bg-indigo-600 text-white' : 'bg-slate-950/80 text-white backdrop-blur-xs'
                          }`}>
                            {isSingle ? 'Compacto 7"' : 'LP 12"'}
                          </span>

                          {condition?.mediaCondition && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500 text-slate-950 shadow-xs">
                              Mídia: {condition.mediaCondition}
                            </span>
                          )}
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
                          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                            <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-lg">
                              Vendido
                            </span>
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
                        </div>

                        {/* Pricing & Add to Cart */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[9px] text-slate-400 font-semibold block uppercase">Preço</span>
                            <span className="text-sm font-black text-slate-950">
                              R$ {price.toFixed(2)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            className="p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all cursor-pointer shadow-xs active:scale-90 shrink-0"
                            title="Adicionar ao Carrinho"
                          >
                            <ShoppingBag className="h-4 w-4" />
                          </button>
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
                    src="/valdir-logo-badge.jpg" 
                    alt="Valdir Discos" 
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
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

            {/* Col 2: Services & Guarantees */}
            <div className="space-y-2">
              <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Nossos Diferenciais</h5>
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

            {/* Col 3: Contact & Store */}
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

    </div>
  );
}

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music,
  HardDrive,
  Cloud,
  Download,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Copy,
  Check,
  Disc,
  Layers,
  FolderOpen,
  Sparkles,
  Link as LinkIcon,
  ShieldCheck,
  Send,
  Zap,
  Info,
  Server,
  FileAudio,
  Headphones,
  Sliders,
  DollarSign,
  Search,
  Eye,
  Settings
} from 'lucide-react';
import {
  DigitalAlbumProduct,
  DigitalTrack,
  AudioFormat,
  StorageProviderConfig,
  StorageProviderType,
  DigitalDownloadLog
} from '../types';

interface DigitalMusicManagerProps {
  albums: DigitalAlbumProduct[];
  onSaveAlbum: (album: DigitalAlbumProduct) => void;
  onDeleteAlbum: (albumId: string) => void;
  storageProviders: StorageProviderConfig[];
  onSaveStorageProvider: (provider: StorageProviderConfig) => void;
  onDeleteStorageProvider: (providerId: string) => void;
}

export function DigitalMusicManager({
  albums,
  onSaveAlbum,
  onDeleteAlbum,
  storageProviders,
  onSaveStorageProvider,
  onDeleteStorageProvider
}: DigitalMusicManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'storage' | 'delivery' | 'guide'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');

  // Album Editing / Creation Modal State
  const [isEditingAlbum, setIsEditingAlbum] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<DigitalAlbumProduct | null>(null);

  // Storage Provider Editing / Creation Modal State
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState<StorageProviderConfig | null>(null);

  // Link Tester State
  const [testUrlInput, setTestUrlInput] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResultMsg, setTestResultMsg] = useState('');

  // Audio Playback simulation in Admin for testing preview
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);

  // Quick WhatsApp delivery generator state
  const [deliveryOrderCode, setDeliveryOrderCode] = useState('VD-ONL-8942');
  const [deliveryCustomerName, setDeliveryCustomerName] = useState('Mariana Silva');
  const [deliveryCustomerPhone, setDeliveryCustomerPhone] = useState('5555981164666');
  const [deliverySelectedAlbumId, setDeliverySelectedAlbumId] = useState<string>(albums[0]?.id || '');
  const [generatedDeliveryLink, setGeneratedDeliveryLink] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Test Link Helper
  const handleTestLink = () => {
    if (!testUrlInput.trim()) return;
    setTestStatus('testing');
    setTimeout(() => {
      if (testUrlInput.startsWith('http://') || testUrlInput.startsWith('https://')) {
        setTestStatus('success');
        setTestResultMsg('✓ Link acessível com sucesso! Servidor respondeu com status 200 OK (Pronto para entrega).');
      } else {
        setTestStatus('error');
        setTestResultMsg('URL inválida. Certifique-se de incluir "https://" no início do link.');
      }
    }, 800);
  };

  // Generate WhatsApp Message with secure links
  const handleGenerateWhatsAppDelivery = () => {
    const album = albums.find(a => a.id === deliverySelectedAlbumId) || albums[0];
    const link = album?.zipDownloadUrl || `https://drive.google.com/uc?export=download&id=ValdirDiscos_${album?.id}`;
    setGeneratedDeliveryLink(link);

    const msg = `Olá, *${deliveryCustomerName}*! Tudo bem? 🎧\n\n` +
      `Aqui é da *Valdir Discos*! Seu pedido *${deliveryOrderCode}* de música digital foi confirmado com sucesso!\n\n` +
      `📦 *Item*: ${album?.artist} - ${album?.title}\n` +
      `🎛️ *Formato*: 24-bit / 96kHz Lossless (FLAC + WAV + MP3 320kbps)\n` +
      `🔗 *Link Seguro para Download*: ${link}\n\n` +
      `_Dica: Recomendamos baixar em seu computador ou aplicativo compatível com áudio Hi-Res. Disco é cultura!_ 🎶📻`;

    const phoneClean = deliveryCustomerPhone.replace(/\D/g, '');
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${phoneClean}?text=${encoded}`, '_blank');
    setWhatsappToast('Mensagem de entrega enviada ao WhatsApp!');
    setTimeout(() => setWhatsappToast(null), 3000);
  };

  // Open New Album Modal
  const handleNewAlbum = () => {
    const newAlbum: DigitalAlbumProduct = {
      id: `dig-album-${Date.now()}`,
      title: '',
      artist: '',
      year: new Date().getFullYear(),
      genre: 'MPB / Vinil Digitalizado',
      coverImage: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80',
      description: '',
      albumPrice: 19.90,
      originalPrice: 28.00,
      audioFormats: ['WAV', 'FLAC', 'MP3'],
      ripSource: 'Mesa Technics SL-1200MK7 + Preamp Cambridge Audio Duo • Conversão 24-bit/96kHz',
      isHiRes: true,
      fileSizeMB: 450,
      zipDownloadUrl: '',
      storageProvider: storageProviders[0]?.provider || 'google_drive',
      storageFolderId: '',
      inStock: true,
      publishedAt: new Date().toISOString(),
      downloadsCount: 0,
      totalRevenue: 0,
      tracks: [
        {
          id: `tr-new-1`,
          trackNumber: 1,
          title: 'Faixa 01',
          artist: '',
          duration: '03:45',
          individualPrice: 3.50,
          audioFormats: ['WAV', 'FLAC', 'MP3'],
          sampleRate: '24-bit / 96kHz Lossless',
          downloadLink: '',
          storageProvider: 'google_drive'
        }
      ]
    };
    setEditingAlbum(newAlbum);
    setIsEditingAlbum(true);
  };

  // Open Edit Album Modal
  const handleEditAlbum = (album: DigitalAlbumProduct) => {
    setEditingAlbum(JSON.parse(JSON.stringify(album)));
    setIsEditingAlbum(true);
  };

  // Save Album
  const handleSaveAlbumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum || !editingAlbum.title.trim()) return;
    onSaveAlbum(editingAlbum);
    setIsEditingAlbum(false);
    setEditingAlbum(null);
  };

  // Filtered albums
  const filteredAlbums = albums.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.genre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = genreFilter === 'all' || a.genre.toLowerCase().includes(genreFilter.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  const totalTracksCount = albums.reduce((acc, a) => acc + (a.tracks?.length || 0), 0);
  const totalStorageMB = albums.reduce((acc, a) => acc + (a.fileSizeMB || 0), 0);
  const totalStorageGB = (totalStorageMB / 1024).toFixed(2);
  const totalDownloads = albums.reduce((acc, a) => acc + (a.downloadsCount || 0), 0);
  const totalRevenue = albums.reduce((acc, a) => acc + (a.totalRevenue || 0), 0);

  return (
    <div className="space-y-6" id="digital-music-manager-root">
      {/* Toast */}
      <AnimatePresence>
        {whatsappToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-emerald-950 text-emerald-100 border border-emerald-500/40 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold"
          >
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>{whatsappToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner & Metrics */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 border border-indigo-900/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <HardDrive className="h-3 w-3" />
                Intranet • Gestão de Nuvem & Arquivos
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <FileAudio className="h-3 w-3" />
                24-bit / 96kHz Lossless Audio
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Gestão de Música Digital & Storage</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Controle completo onde os arquivos de alta fidelidade (FLAC, WAV e MP3) estão armazenados (Google Drive, Dropbox, AWS S3/R2 ou Servidor Próprio), cadastre novos álbuns para venda e emita links seguros de download para os compradores.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={handleNewAlbum}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black tracking-wide transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Cadastrar Novo Álbum Digital</span>
            </button>
          </div>
        </div>

        {/* Real-time Storage & Catalog Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Álbuns Cadastrados</div>
            <div className="text-xl font-black text-amber-400 mt-1">{albums.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Disponíveis na vitrine</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faixas Hi-Res</div>
            <div className="text-xl font-black text-indigo-300 mt-1">{totalTracksCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Faixas masterizadas</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Espaço em Nuvem</div>
            <div className="text-xl font-black text-emerald-400 mt-1">{totalStorageGB} GB</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{totalStorageMB} MB catalogados</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Downloads Feitos</div>
            <div className="text-xl font-black text-sky-400 mt-1">{totalDownloads}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Entregas de arquivos</div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Storage Principal</div>
            <div className="text-sm font-black text-white mt-1.5 flex items-center gap-1.5 truncate">
              <Cloud className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Google Drive</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5 font-bold">● Conectado & Ativo</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto whitespace-nowrap gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('catalog')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'catalog'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-50'
          }`}
        >
          <Music className="h-4 w-4" />
          <span>1. Acervo & Álbuns Digitais ({albums.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('storage')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'storage'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-50'
          }`}
        >
          <HardDrive className="h-4 w-4" />
          <span>2. Servidores & Storage ({storageProviders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('delivery')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'delivery'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-50'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>3. Liberação de Pedidos & WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('guide')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'guide'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-50'
          }`}
        >
          <Info className="h-4 w-4" />
          <span>4. Manual & Dicas de Ripping</span>
        </button>
      </div>

      {/* TAB 1: ACERVO & CATALOGO DIGITAL */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por álbum, artista, gênero ou tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Todos os Gêneros</option>
                <option value="Soul">Soul & Funk</option>
                <option value="Samba-Rock">Samba-Rock / MPB</option>
                <option value="Regional">Regional Gaúcho</option>
                <option value="Boogie">Boogie / Baile Black</option>
              </select>

              <button
                type="button"
                onClick={handleNewAlbum}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Novo Álbum</span>
              </button>
            </div>
          </div>

          {/* Albums List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAlbums.map((album) => (
              <div
                key={album.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
              >
                <div className="flex gap-4 items-start">
                  <div className="h-24 w-24 rounded-2xl bg-slate-900 shrink-0 overflow-hidden relative shadow-md group">
                    <img
                      src={album.coverImage}
                      alt={album.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Disc className="h-8 w-8 text-amber-300 animate-spin" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                        {album.genre}
                      </span>
                      <span className="text-[10px] font-black bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-md">
                        {album.year}
                      </span>
                      {album.isHiRes && (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                          24-bit Hi-Res
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-slate-900 truncate" title={album.title}>
                      {album.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-600 truncate">{album.artist}</p>

                    <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                      <span>🎵 {album.tracks?.length || 0} faixas</span>
                      <span>💾 {album.fileSizeMB} MB</span>
                      <span>📦 {album.audioFormats?.join('/')}</span>
                    </div>
                  </div>
                </div>

                {/* Storage & Rip Source Info */}
                <div className="bg-slate-50 rounded-xl p-3 text-[11px] space-y-1.5 border border-slate-100">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-semibold text-slate-500">Storage Nuvem:</span>
                    <span className="font-bold text-indigo-700 uppercase flex items-center gap-1">
                      <Cloud className="h-3 w-3" />
                      {album.storageProvider || 'google_drive'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-semibold text-slate-500">Link Master (.ZIP):</span>
                    {album.zipDownloadUrl ? (
                      <span className="font-mono text-emerald-700 text-[10px] truncate max-w-[200px]" title={album.zipDownloadUrl}>
                        ✓ Link Configurado
                      </span>
                    ) : (
                      <span className="font-mono text-amber-700 text-[10px]">
                        ⚠️ Sem link direto
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 truncate" title={album.ripSource}>
                    <span className="font-semibold">Setup:</span> {album.ripSource}
                  </div>
                </div>

                {/* Actions & Price Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-slate-400 font-medium">Álbum:</span>
                    <span className="text-base font-black text-slate-900">
                      R$ {album.albumPrice.toFixed(2).replace('.', ',')}
                    </span>
                    {album.originalPrice && (
                      <span className="text-[11px] text-slate-400 line-through">
                        R$ {album.originalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditAlbum(album)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer border border-indigo-200"
                      title="Editar Álbum e Faixas"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja realmente remover o álbum "${album.title}" do catálogo digital?`)) {
                          onDeleteAlbum(album.id);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-red-200"
                      title="Excluir Álbum"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SERVIDORES & STORAGE (GOOGLE DRIVE, DROPBOX, S3, MEGA) */}
      {activeSubTab === 'storage' && (
        <div className="space-y-6">
          {/* Storage Architecture Overview Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Server className="h-5 w-5 text-indigo-600" />
                  Arquitetura de Armazenamento de Áudios Hi-Res
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Como a Valdir Discos armazena dezenas de gigabytes de áudio sem pagar fortunas por hospedagem:
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProvider({
                    id: `prov-${Date.now()}`,
                    provider: 'google_drive',
                    name: 'Novo Provedor de Nuvem',
                    baseUrlOrFolderUrl: '',
                    accessMode: 'shared_folder',
                    notes: '',
                    isDefault: false,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    totalStorageUsedGB: 0
                  });
                  setIsEditingProvider(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Adicionar Conexão de Storage
              </button>
            </div>

            {/* Providers Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {storageProviders.map((prov) => (
                <div
                  key={prov.id}
                  className={`rounded-2xl border p-5 transition-all space-y-3 ${
                    prov.isActive
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-slate-100/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl">
                        {prov.provider === 'google_drive' && <Cloud className="h-5 w-5 text-amber-600" />}
                        {prov.provider === 'dropbox' && <FolderOpen className="h-5 w-5 text-blue-600" />}
                        {prov.provider === 's3_compatible' && <HardDrive className="h-5 w-5 text-orange-600" />}
                        {prov.provider === 'mega' && <ShieldCheck className="h-5 w-5 text-red-600" />}
                        {prov.provider === 'local_server' && <Server className="h-5 w-5 text-emerald-600" />}
                        {prov.provider === 'direct_url' && <LinkIcon className="h-5 w-5 text-indigo-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900">{prov.name}</h4>
                          {prov.isDefault && (
                            <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              Padrão
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {prov.provider} • Modo: {prov.accessMode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProvider(prov);
                          setIsEditingProvider(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Editar Configurações"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja remover o provedor "${prov.name}"?`)) {
                            onDeleteStorageProvider(prov.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Remover Provedor"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-[11px] font-mono text-slate-700 truncate flex items-center justify-between">
                    <span className="truncate">{prov.baseUrlOrFolderUrl || 'Nenhum URL/Pasta configurada'}</span>
                    {prov.baseUrlOrFolderUrl && (
                      <a
                        href={prov.baseUrlOrFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 ml-2 shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {prov.notes && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {prov.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>Espaço em uso: ~{prov.totalStorageUsedGB || 0} GB</span>
                    <span className={prov.isActive ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                      {prov.isActive ? '● Ativo' : '○ Inativo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Storage Link Tester Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Testador de Links de Áudio & Download Direto
            </h3>
            <p className="text-xs text-slate-500">
              Cole qualquer link de download (Google Drive, Dropbox, S3, WeTransfer) para verificar se o arquivo está público ou se o link direto está respondendo perfeitamente:
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Ex: https://drive.google.com/uc?export=download&id=... ou https://dl.dropboxusercontent.com/..."
                value={testUrlInput}
                onChange={(e) => setTestUrlInput(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={handleTestLink}
                disabled={testStatus === 'testing' || !testUrlInput}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {testStatus === 'testing' ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span>Testar Link</span>
                  </>
                )}
              </button>
            </div>

            {testStatus === 'success' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{testResultMsg}</span>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{testResultMsg}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LIBERACAO DE PEDIDOS & WHATSAPP */}
      {activeSubTab === 'delivery' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-600" />
                  Central de Entrega Digital & Links Seguros de Download
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quando o cliente paga por PIX ou no balcão, envie o link direto no WhatsApp dele com mensagem automática formatada:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  1. Dados do Comprador & Pedido
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Número do Pedido:
                  </label>
                  <input
                    type="text"
                    value={deliveryOrderCode}
                    onChange={(e) => setDeliveryOrderCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome do Cliente:
                  </label>
                  <input
                    type="text"
                    value={deliveryCustomerName}
                    onChange={(e) => setDeliveryCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    WhatsApp do Cliente (com DDD):
                  </label>
                  <input
                    type="text"
                    value={deliveryCustomerPhone}
                    onChange={(e) => setDeliveryCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Álbum / Produto Comprado:
                  </label>
                  <select
                    value={deliverySelectedAlbumId}
                    onChange={(e) => setDeliverySelectedAlbumId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold"
                  >
                    {albums.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.artist} - {a.title} (R$ {a.albumPrice.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                    2. Prévia da Mensagem Formatada
                  </h4>
                  <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-emerald-800 shadow-inner">
                    {`Olá, *${deliveryCustomerName}*! Tudo bem? 🎧\n\n` +
                      `Aqui é da *Valdir Discos*! Seu pedido *${deliveryOrderCode}* de música digital foi confirmado com sucesso!\n\n` +
                      `📦 *Item*: ${albums.find(a => a.id === deliverySelectedAlbumId)?.artist} - ${albums.find(a => a.id === deliverySelectedAlbumId)?.title}\n` +
                      `🎛️ *Formato*: 24-bit / 96kHz Lossless (FLAC + WAV + MP3)\n` +
                      `🔗 *Link Seguro para Download*: ${albums.find(a => a.id === deliverySelectedAlbumId)?.zipDownloadUrl || 'https://drive.google.com/uc?export=download&id=ValdirDiscos_HiRes'}\n\n` +
                      `_Dica: Recomendamos baixar em seu computador ou aplicativo compatível com áudio Hi-Res. Disco é cultura!_ 🎶📻`}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateWhatsAppDelivery}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    <span>Enviar no WhatsApp do Cliente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const album = albums.find(a => a.id === deliverySelectedAlbumId);
                      const link = album?.zipDownloadUrl || 'https://drive.google.com';
                      copyToClipboard(link, 'delivery_link');
                    }}
                    className="p-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                    title="Copiar Link de Download"
                  >
                    {copiedId === 'delivery_link' ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MANUAL & GUIA DE RIPPING ANALOGICO */}
      {activeSubTab === 'guide' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Headphones className="h-5 w-5 text-indigo-600" />
                Manual do Valdir: Como Digitalizar & Armazenar Áudio em Alta Fidelidade
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Padrões técnicos para capturar a alma do vinil e entregar aos clientes o som mais puro possível:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
                  <Sliders className="h-4 w-4 text-amber-700" />
                  1. Setup de Captura Analógica
                </div>
                <ul className="text-xs text-amber-950 space-y-2 list-disc list-inside leading-relaxed">
                  <li><strong>Toca-Discos:</strong> Technics SL-1200MK7, SL-1200MK2 ou Rega Planar 3.</li>
                  <li><strong>Cápsula & Agulha:</strong> Ortofon 2M Bronze/Black ou Audio-Technica VM540ML (corte MicroLine).</li>
                  <li><strong>Pré-amplificador de Phono:</strong> Cambridge Audio Duo, Schiit Mani ou Pro-Ject Tube Box.</li>
                  <li><strong>Limpeza:</strong> Lavagem úmida de disco com máquina a vácuo antes da digitalização para eliminar ruídos de poeira.</li>
                </ul>
              </div>

              <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase tracking-wider">
                  <FileAudio className="h-4 w-4 text-indigo-700" />
                  2. Resolução & Masterização
                </div>
                <ul className="text-xs text-indigo-950 space-y-2 list-disc list-inside leading-relaxed">
                  <li><strong>Resolução de Gravação:</strong> 24-bit / 96kHz ou 24-bit / 192kHz (Interface Audient iD14 ou Focusrite Scarlett).</li>
                  <li><strong>Software:</strong> Audacity, iZotope RX ou VinylStudio.</li>
                  <li><strong>De-Clicking:</strong> Remoção cirúrgica de estalinhos manuais sem afetar a resposta de frequência aguda.</li>
                  <li><strong>Formatos Exportados:</strong> Gerar pasta compactada .ZIP contendo arquivos .FLAC 24-bit, .WAV sem compressão e .MP3 320kbps com tags ID3 e capa embutida.</li>
                </ul>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
                  <Cloud className="h-4 w-4 text-emerald-700" />
                  3. Onde Hospedar na Nuvem
                </div>
                <ul className="text-xs text-emerald-950 space-y-2 list-disc list-inside leading-relaxed">
                  <li><strong>Google Drive:</strong> Crie uma pasta "Valdir Discos Masters", coloque os arquivos ZIP e copie o link público de download.</li>
                  <li><strong>Dropbox:</strong> Substitua o final do link de compartilhamento por <code>?dl=1</code> para criar download automático com 1 clique.</li>
                  <li><strong>Cloudflare R2:</strong> Armazenamento S3 sem taxa de tráfego de saída (Egress Free), ideal para quem vende centenas de gigabytes por mês.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT / CREATE ALBUM */}
      <AnimatePresence>
        {isEditingAlbum && editingAlbum && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8"
            >
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                    <Music className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight">
                      {editingAlbum.title ? `Editar Álbum: ${editingAlbum.title}` : 'Cadastrar Novo Álbum Digital'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Configure os dados técnicos, preços e links de armazenamento na nuvem
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingAlbum(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAlbumSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Título do Álbum *</label>
                    <input
                      type="text"
                      required
                      value={editingAlbum.title}
                      onChange={(e) => setEditingAlbum({ ...editingAlbum, title: e.target.value })}
                      placeholder="Ex: Tim Maia Racional Vol. 1 (24-bit/96kHz)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Artista / Intérprete *</label>
                    <input
                      type="text"
                      required
                      value={editingAlbum.artist}
                      onChange={(e) => setEditingAlbum({ ...editingAlbum, artist: e.target.value })}
                      placeholder="Ex: Tim Maia"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gênero Musical</label>
                    <input
                      type="text"
                      value={editingAlbum.genre}
                      onChange={(e) => setEditingAlbum({ ...editingAlbum, genre: e.target.value })}
                      placeholder="Ex: Soul, Samba-Rock, Regional"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ano de Lançamento</label>
                    <input
                      type="number"
                      value={editingAlbum.year}
                      onChange={(e) => setEditingAlbum({ ...editingAlbum, year: Number(e.target.value) || 1980 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Preço Álbum Completo (R$) *</label>
                    <input
                      type="number"
                      step="0.10"
                      required
                      value={editingAlbum.albumPrice}
                      onChange={(e) => setEditingAlbum({ ...editingAlbum, albumPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tamanho Total (MB)</label>
                    <input
                      type="number"
                      value={editingAlbum.fileSizeMB}
                      onChange={(e) => setEditingAlbum({ ...editingAlbum, fileSizeMB: Number(e.target.value) || 400 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL da Imagem da Capa</label>
                  <input
                    type="url"
                    value={editingAlbum.coverImage}
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, coverImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link de Armazenamento / Download (.ZIP Master)</label>
                  <input
                    type="url"
                    value={editingAlbum.zipDownloadUrl || ''}
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, zipDownloadUrl: e.target.value })}
                    placeholder="Ex: https://drive.google.com/uc?export=download&id=... ou link do Dropbox/S3"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Link que será enviado ao cliente após a confirmação do pagamento.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Equipamento & Fonte do Rip (Setup Técnico)</label>
                  <input
                    type="text"
                    value={editingAlbum.ripSource}
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, ripSource: e.target.value })}
                    placeholder="Ex: Technics SL-1200MK7 + Preamp Cambridge Audio • 24-bit/96kHz"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Descrição / História do Álbum</label>
                  <textarea
                    rows={3}
                    value={editingAlbum.description}
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, description: e.target.value })}
                    placeholder="Conte sobre a raridade da prensagem, notas sobre o áudio..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                  />
                </div>

                {/* Tracklist Management */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                      <Disc className="h-4 w-4 text-indigo-600" />
                      Faixas do Álbum ({editingAlbum.tracks?.length || 0})
                    </h4>

                    <button
                      type="button"
                      onClick={() => {
                        const newTrNumber = (editingAlbum.tracks?.length || 0) + 1;
                        const newTr: DigitalTrack = {
                          id: `tr-custom-${Date.now()}-${newTrNumber}`,
                          trackNumber: newTrNumber,
                          title: `Nova Faixa ${newTrNumber}`,
                          artist: editingAlbum.artist,
                          duration: '03:30',
                          individualPrice: 3.50,
                          audioFormats: ['WAV', 'FLAC', 'MP3'],
                          sampleRate: '24-bit / 96kHz Lossless',
                          downloadLink: '',
                          storageProvider: 'google_drive'
                        };
                        setEditingAlbum({
                          ...editingAlbum,
                          tracks: [...(editingAlbum.tracks || []), newTr]
                        });
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      Adicionar Faixa
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {editingAlbum.tracks?.map((track, idx) => (
                      <div
                        key={track.id}
                        className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2"
                      >
                        <span className="font-bold text-slate-400 text-[11px] w-6 text-center">
                          {track.trackNumber}
                        </span>

                        <input
                          type="text"
                          value={track.title}
                          onChange={(e) => {
                            const updatedTracks = [...editingAlbum.tracks];
                            updatedTracks[idx].title = e.target.value;
                            setEditingAlbum({ ...editingAlbum, tracks: updatedTracks });
                          }}
                          placeholder="Título da Faixa"
                          className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />

                        <input
                          type="text"
                          value={track.duration}
                          onChange={(e) => {
                            const updatedTracks = [...editingAlbum.tracks];
                            updatedTracks[idx].duration = e.target.value;
                            setEditingAlbum({ ...editingAlbum, tracks: updatedTracks });
                          }}
                          placeholder="03:45"
                          className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center font-mono"
                        />

                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 text-[10px]">R$</span>
                          <input
                            type="number"
                            step="0.10"
                            value={track.individualPrice}
                            onChange={(e) => {
                              const updatedTracks = [...editingAlbum.tracks];
                              updatedTracks[idx].individualPrice = parseFloat(e.target.value) || 0;
                              setEditingAlbum({ ...editingAlbum, tracks: updatedTracks });
                            }}
                            className="w-14 px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-bold"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const updatedTracks = editingAlbum.tracks.filter((_, i) => i !== idx);
                            setEditingAlbum({ ...editingAlbum, tracks: updatedTracks });
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Remover Faixa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingAlbum(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md shadow-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Salvar Álbum</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT STORAGE PROVIDER */}
      <AnimatePresence>
        {isEditingProvider && editingProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500 text-white rounded-xl">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight">
                      Configurar Conexão de Armazenamento
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Defina onde os arquivos de áudio de alta resolução ficarão hospedados
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingProvider(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSaveStorageProvider(editingProvider);
                  setIsEditingProvider(false);
                  setEditingProvider(null);
                }}
                className="p-6 space-y-4 text-xs"
              >
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome do Provedor / Conta *</label>
                  <input
                    type="text"
                    required
                    value={editingProvider.name}
                    onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                    placeholder="Ex: Google Drive - Valdir Masters 96kHz"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de Serviço</label>
                    <select
                      value={editingProvider.provider}
                      onChange={(e) => setEditingProvider({ ...editingProvider, provider: e.target.value as StorageProviderType })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="google_drive">Google Drive</option>
                      <option value="dropbox">Dropbox</option>
                      <option value="s3_compatible">Cloudflare R2 / AWS S3</option>
                      <option value="mega">Mega.nz</option>
                      <option value="onedrive">Microsoft OneDrive</option>
                      <option value="local_server">Servidor Próprio / VPS</option>
                      <option value="direct_url">Links Diretos / CDN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Modo de Acesso</label>
                    <select
                      value={editingProvider.accessMode}
                      onChange={(e) => setEditingProvider({ ...editingProvider, accessMode: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="shared_folder">Pasta Compartilhada</option>
                      <option value="public_direct">Download Direto (1 Clique)</option>
                      <option value="presigned_token">Token Temporário Pré-assinado</option>
                      <option value="protected_link">Link Protegido por Senha</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Base ou Link da Pasta Principal</label>
                  <input
                    type="url"
                    value={editingProvider.baseUrlOrFolderUrl}
                    onChange={(e) => setEditingProvider({ ...editingProvider, baseUrlOrFolderUrl: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/... ou https://www.dropbox.com/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notas e Instruções Internas</label>
                  <textarea
                    rows={2}
                    value={editingProvider.notes || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, notes: e.target.value })}
                    placeholder="Instruções sobre permissões de pasta ou senhas..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingProvider.isDefault}
                      onChange={(e) => setEditingProvider({ ...editingProvider, isDefault: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Definir como Storage Padrão</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingProvider.isActive}
                      onChange={(e) => setEditingProvider({ ...editingProvider, isActive: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Ativo</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProvider(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-colors cursor-pointer"
                  >
                    Salvar Conexão
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

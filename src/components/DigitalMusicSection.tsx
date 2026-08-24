import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Check, 
  ShoppingBag, 
  ExternalLink, 
  ShieldCheck, 
  Disc, 
  HardDrive, 
  Layers, 
  Headphones, 
  Radio,
  FileAudio,
  Zap,
  Info,
  X,
  Clock,
  ListMusic
} from 'lucide-react';
import { DigitalAlbumProduct, DigitalTrack, AudioFormat } from '../types';
import { DIGITAL_ALBUM_PRODUCTS } from '../data/digitalMusicData';

interface DigitalMusicSectionProps {
  onAddToCart: (
    item: {
      id: string;
      title: string;
      artist: string;
      price: number;
      coverImage: string;
      format: AudioFormat;
      isFullAlbum: boolean;
      albumId: string;
      trackId?: string;
    }
  ) => void;
  whatsappNumber?: string;
  albums?: DigitalAlbumProduct[];
}

export function DigitalMusicSection({
  onAddToCart,
  whatsappNumber = '5555981164666',
  albums = DIGITAL_ALBUM_PRODUCTS
}: DigitalMusicSectionProps) {
  const albumList = albums && albums.length > 0 ? albums : DIGITAL_ALBUM_PRODUCTS;
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<AudioFormat>('FLAC');
  
  // Modal State for inspecting album & tracklist
  const [modalAlbum, setModalAlbum] = useState<DigitalAlbumProduct | null>(null);

  // Audio Player State (Web Audio simulation / sound preview)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeAlbum, setActiveAlbum] = useState<DigitalAlbumProduct>(albumList[0]);
  const [activeTrack, setActiveTrack] = useState<DigitalTrack | null>(albumList[0]?.tracks?.[0] || null);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);

  // Playback timer simulation
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1.5;
        });
      }, 300);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const togglePlayTrack = (album: DigitalAlbumProduct, track: DigitalTrack, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeTrack?.id === track.id && isPlaying) {
      setIsPlaying(false);
    } else {
      setActiveAlbum(album);
      setActiveTrack(track);
      setPlaybackProgress(0);
      setIsPlaying(true);
    }
  };

  const handleBuyFullAlbum = (album: DigitalAlbumProduct, format: AudioFormat = selectedFormat, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onAddToCart({
      id: `digital_album_${album.id}_${format}`,
      title: `Álbum Digital: ${album.title}`,
      artist: album.artist,
      price: album.albumPrice,
      coverImage: album.coverImage,
      format,
      isFullAlbum: true,
      albumId: album.id
    });
    setAddedToast(`Álbum "${album.title}" adicionado ao carrinho em ${format}!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const handleBuyTrack = (album: DigitalAlbumProduct, track: DigitalTrack, format: AudioFormat = selectedFormat, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onAddToCart({
      id: `digital_track_${track.id}_${format}`,
      title: `Faixa: ${track.trackNumber}. ${track.title}`,
      artist: track.artist,
      price: track.individualPrice,
      coverImage: album.coverImage,
      format,
      isFullAlbum: false,
      albumId: album.id,
      trackId: track.id
    });
    setAddedToast(`Faixa "${track.title}" adicionada ao carrinho (${format})!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const genres = ['all', ...Array.from(new Set(albumList.map(a => a.genre)))];

  const filteredAlbums = selectedGenre === 'all' 
    ? albumList 
    : albumList.filter(a => a.genre.toLowerCase().includes(selectedGenre.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      <AnimatePresence>
        {addedToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 bg-amber-950 text-amber-100 border border-amber-500/40 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold"
          >
            <Check className="h-4 w-4 text-emerald-400" />
            <span>{addedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner - Compact & Clean */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white border border-amber-500/20 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" />
                Áudio Master 24-bit / 96kHz
              </span>
              <span className="text-xs text-amber-200/70 font-semibold">
                Rips Diretos de Vinil de Alta Fidelidade
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Músicas & Álbuns Digitais Hi-Res
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Baixe álbuns completos ou faixas avulsas em <strong className="text-amber-300">WAV 24-bit</strong>, <strong className="text-cyan-300">FLAC Lossless</strong> ou <strong className="text-emerald-300">MP3 320k</strong>, digitalizados com agulhas profissionais.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-300">Formato padrão:</span>
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {(['WAV', 'FLAC', 'MP3'] as AudioFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    selectedFormat === fmt
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Gênero:</span>
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === g
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              {g === 'all' ? 'Todos os Álbuns' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Main Albums Grid - PROPORTIONAL SIZE (Identical to Vinyl & T-Shirts) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
        {filteredAlbums.map((album) => {
          const isCurrentActive = activeAlbum.id === album.id;
          const isCurrentlyPlaying = isCurrentActive && isPlaying;

          return (
            <motion.div
              key={album.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group hover:border-amber-400/60"
            >
              {/* Cover with Vinyl-like square ratio */}
              <div 
                onClick={() => setModalAlbum(album)}
                className="aspect-square bg-slate-900 relative overflow-hidden cursor-pointer group"
              >
                <img 
                  src={album.coverImage} 
                  alt={album.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* Badges on Cover */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start max-w-[85%]">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase shadow-xs bg-amber-500 text-slate-950">
                    {album.badge || 'Hi-Res 24-bit'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-900/80 text-white backdrop-blur-xs border border-white/10">
                    {album.fileSizeMB} MB
                  </span>
                </div>

                {/* Quick Play Button Overlay */}
                <button
                  type="button"
                  onClick={(e) => togglePlayTrack(album, album.tracks[0], e)}
                  aria-label={isCurrentlyPlaying ? "Pausar prévia" : "Tocar prévia"}
                  className={`absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                    isCurrentlyPlaying
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30 scale-105'
                      : 'bg-white/90 hover:bg-white text-slate-900 group-hover:scale-105'
                  }`}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  )}
                </button>

                <div className="absolute bottom-2.5 left-2.5">
                  <span className="text-[10px] font-bold text-slate-200 drop-shadow-sm flex items-center gap-1">
                    <ListMusic className="h-3 w-3 text-amber-400" />
                    {album.tracks.length} Faixas
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 truncate">
                      {album.genre} • {album.year}
                    </span>
                  </div>

                  <h3 
                    onClick={() => setModalAlbum(album)}
                    className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors cursor-pointer"
                    title={album.title}
                  >
                    {album.title}
                  </h3>

                  <p className="text-xs font-semibold text-slate-600 line-clamp-1">
                    {album.artist}
                  </p>
                </div>

                {/* Price & Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-sm sm:text-base font-black text-slate-950 font-mono">
                        R$ {album.albumPrice.toFixed(2).replace('.', ',')}
                      </span>
                      {album.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through ml-1.5">
                          R$ {album.originalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {selectedFormat}
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setModalAlbum(album)}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ListMusic className="h-3 w-3 text-slate-600" />
                      <span>Faixas</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleBuyFullAlbum(album, selectedFormat, e)}
                      className="py-1.5 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs active:scale-95"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      <span>Comprar</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Album Details & Tracklist Modal */}
      <AnimatePresence>
        {modalAlbum && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 to-amber-950 text-white flex items-start justify-between relative">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-white/20 shadow-md">
                    <img 
                      src={modalAlbum.coverImage} 
                      alt={modalAlbum.title} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] uppercase rounded-md">
                      {modalAlbum.badge || 'Áudio Master Hi-Res'}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight mt-1">
                      {modalAlbum.title}
                    </h3>
                    <p className="text-xs font-bold text-amber-200">
                      {modalAlbum.artist} • {modalAlbum.genre} ({modalAlbum.year})
                    </p>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {modalAlbum.tracks.length} Faixas • {modalAlbum.fileSizeMB} MB • Rip Direto de Vinil
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalAlbum(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Format Toggle Bar */}
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <FileAudio className="h-4 w-4 text-amber-600" />
                  Formato de Download:
                </span>
                <div className="flex gap-1">
                  {(['WAV', 'FLAC', 'MP3'] as AudioFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setSelectedFormat(fmt)}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        selectedFormat === fmt
                          ? 'bg-amber-950 text-amber-200 border-amber-950 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {fmt} {fmt === 'WAV' ? '(24-bit)' : fmt === 'FLAC' ? '(Lossless)' : '(320k)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Body: Tracklist */}
              <div className="p-5 flex-1 overflow-y-auto space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-900 pb-1">
                  <span>Faixas Disponíveis ({modalAlbum.tracks.length})</span>
                  <span className="text-slate-500 font-semibold text-[11px]">Compra Avulsa</span>
                </div>

                <div className="space-y-1.5">
                  {modalAlbum.tracks.map((track) => {
                    const isTrackActive = activeTrack?.id === track.id && activeAlbum.id === modalAlbum.id;
                    const isTrackPlaying = isTrackActive && isPlaying;

                    return (
                      <div
                        key={track.id}
                        onClick={() => togglePlayTrack(modalAlbum, track)}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isTrackActive
                            ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black transition-all ${
                              isTrackPlaying
                                ? 'bg-amber-600 text-white ring-2 ring-amber-500/30'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isTrackPlaying ? (
                              <Pause className="h-3.5 w-3.5 fill-current" />
                            ) : (
                              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold truncate">
                              <span className="text-slate-400 mr-1.5 font-mono">{track.trackNumber}.</span>
                              {track.title}
                            </p>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {track.duration} • {track.sampleRate || '24-bit / 96kHz'}
                            </span>
                          </div>
                        </div>

                        {/* Buy Track Button */}
                        <button
                          type="button"
                          onClick={(e) => handleBuyTrack(modalAlbum, track, selectedFormat, e)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                          title={`Comprar faixa avulsa em ${selectedFormat}`}
                        >
                          <Download className="h-3 w-3" />
                          <span>R$ {track.individualPrice.toFixed(2).replace('.', ',')}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer: Full Album Purchase */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block">Álbum Completo ({selectedFormat})</span>
                    <span className="text-lg font-black text-slate-950 font-mono">
                      R$ {modalAlbum.albumPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      handleBuyFullAlbum(modalAlbum, selectedFormat, e);
                      setModalAlbum(null);
                    }}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all shadow-md shadow-amber-600/20 cursor-pointer active:scale-98"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Adicionar Álbum Completo</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Mini-Player Bar when playing */}
      {activeTrack && (
        <div className="sticky bottom-4 z-40 bg-slate-950/95 text-white border border-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10">
              <img 
                src={activeAlbum.coverImage} 
                alt={activeAlbum.title} 
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase text-amber-400 block tracking-wider">
                {isPlaying ? '▶ Tocando Degustação' : '⏸ Em Pausa'} • {selectedFormat}
              </span>
              <h4 className="text-xs font-black text-white truncate">
                {activeTrack.title}
              </h4>
              <p className="text-[11px] text-slate-400 truncate">
                {activeAlbum.artist}
              </p>
            </div>
          </div>

          {/* Progress bar in center */}
          <div className="hidden sm:block flex-1 max-w-xs space-y-1">
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
                style={{ width: `${playbackProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>0:{Math.floor((playbackProgress * 0.3)).toString().padStart(2, '0')}</span>
              <span>{activeTrack.duration || '03:30'}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => togglePlayTrack(activeAlbum, activeTrack)}
              className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold transition-transform active:scale-95 cursor-pointer shadow"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-slate-950" /> : <Play className="h-4 w-4 fill-slate-950 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => setModalAlbum(activeAlbum)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Ver Faixas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

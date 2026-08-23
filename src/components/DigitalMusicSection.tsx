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
  Info
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
}

export function DigitalMusicSection({
  onAddToCart,
  whatsappNumber = '5555981164666'
}: DigitalMusicSectionProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedAlbum, setSelectedAlbum] = useState<DigitalAlbumProduct>(DIGITAL_ALBUM_PRODUCTS[0]);
  const [selectedFormat, setSelectedFormat] = useState<AudioFormat>('FLAC');
  
  // Audio Player State (Web Audio simulation / sound synthesizer preview)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTrack, setActiveTrack] = useState<DigitalTrack | null>(DIGITAL_ALBUM_PRODUCTS[0].tracks[0]);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
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
          return prev + 1.2;
        });
      }, 300);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const togglePlayTrack = (track: DigitalTrack) => {
    if (activeTrack?.id === track.id && isPlaying) {
      setIsPlaying(false);
    } else {
      setActiveTrack(track);
      setPlaybackProgress(0);
      setIsPlaying(true);
    }
  };

  const handleBuyFullAlbum = (album: DigitalAlbumProduct) => {
    onAddToCart({
      id: `digital_album_${album.id}_${selectedFormat}`,
      title: `Álbum Digital Completo: ${album.title}`,
      artist: album.artist,
      price: album.albumPrice,
      coverImage: album.coverImage,
      format: selectedFormat,
      isFullAlbum: true,
      albumId: album.id
    });
    setAddedToast(`Álbum adicionado ao carrinho em ${selectedFormat}!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const handleBuyTrack = (album: DigitalAlbumProduct, track: DigitalTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart({
      id: `digital_track_${track.id}_${selectedFormat}`,
      title: `Faixa Digital: ${track.trackNumber}. ${track.title}`,
      artist: track.artist,
      price: track.individualPrice,
      coverImage: album.coverImage,
      format: selectedFormat,
      isFullAlbum: false,
      albumId: album.id,
      trackId: track.id
    });
    setAddedToast(`Faixa "${track.title}" adicionada ao carrinho (${selectedFormat})!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const filteredAlbums = selectedGenre === 'all' 
    ? DIGITAL_ALBUM_PRODUCTS 
    : DIGITAL_ALBUM_PRODUCTS.filter(a => a.genre.toLowerCase().includes(selectedGenre.toLowerCase()));

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

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 border border-amber-900/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider">
              <Headphones className="h-3.5 w-3.5" />
              Áudio de Alta Resolução • 24-bit / 96kHz & Lossless
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Loja de Música Digital & Rips Analógicos Valdir Discos
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Vinis raros do acervo de <strong>Santa Maria - RS</strong> digitalizados diretamente da agulha em alta fidelidade. Escolha o formato dos seus arquivos e receba o link de download direto e seguro após a compra.
            </p>
          </div>

          {/* Audio Formats Badge Box */}
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2.5 shrink-0 w-full sm:w-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block text-center sm:text-left">
              Formatos Disponíveis para Download:
            </span>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-sm">
                WAV 24-bit
              </span>
              <span className="px-2.5 py-1 bg-cyan-500 text-slate-950 font-black text-xs rounded-lg shadow-sm">
                FLAC Lossless
              </span>
              <span className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-lg shadow-sm">
                MP3 320k
              </span>
            </div>
            <p className="text-[10px] text-slate-400 text-center sm:text-left">
              ✓ Tagged com capas em alta definição e metadados
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Albums List & Interactive Player Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Digital Albums Grid */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Disc className="h-4 w-4 text-amber-600" />
              <span>Álbuns Digitais Disponíveis</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {filteredAlbums.length} títulos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredAlbums.map((album) => {
              const isSelected = selectedAlbum.id === album.id;
              return (
                <div
                  key={album.id}
                  onClick={() => {
                    setSelectedAlbum(album);
                    setActiveTrack(album.tracks[0]);
                    setPlaybackProgress(0);
                  }}
                  className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md ${
                    isSelected 
                      ? 'border-amber-600 ring-2 ring-amber-500/30 bg-amber-50/20' 
                      : 'border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Cover & Badge */}
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 shadow-inner">
                      <img 
                        src={album.coverImage} 
                        alt={album.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] uppercase rounded-md shadow-xs">
                        {album.badge || 'Hi-Res'}
                      </span>

                      <span className="absolute bottom-2 left-2 text-[11px] font-bold text-white drop-shadow-sm">
                        {album.tracks.length} Faixas • {album.fileSizeMB} MB
                      </span>
                    </div>

                    {/* Info */}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                        {album.genre} • {album.year}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                        {album.title}
                      </h4>
                      <p className="text-xs font-bold text-slate-600">
                        {album.artist}
                      </p>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-black text-amber-950 font-mono">
                        R$ {album.albumPrice.toFixed(2).replace('.', ',')}
                      </span>
                      {album.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through ml-1.5">
                          R$ {album.originalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyFullAlbum(album);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Comprar Álbum</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Album Tracklist & Digital Player */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-5 sticky top-24">
            
            {/* Format Selector Bar */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <FileAudio className="h-4 w-4 text-amber-600" />
                  Formato de Download Desejado:
                </span>
                <span className="text-amber-800 uppercase font-mono font-black">{selectedFormat}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['WAV', 'FLAC', 'MP3'] as AudioFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center border ${
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

            {/* Now Playing Visualizer Box */}
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                  <img 
                    src={selectedAlbum.coverImage} 
                    alt={selectedAlbum.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    {isPlaying ? '▶ Tocando Prévia' : '⏸ Prévia de Áudio'} • {selectedFormat}
                  </span>
                  <h4 className="text-xs font-black text-white truncate">
                    {activeTrack ? activeTrack.title : selectedAlbum.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {activeTrack?.artist || selectedAlbum.artist}
                  </p>
                </div>
              </div>

              {/* Simulated Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
                    style={{ width: `${playbackProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>0:{Math.floor((playbackProgress * 0.3)).toString().padStart(2, '0')}</span>
                  <span>{activeTrack?.duration || '03:45'}</span>
                </div>
              </div>

              {/* Master Player Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => activeTrack && togglePlayTrack(activeTrack)}
                    className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold transition-transform active:scale-95 shadow-md cursor-pointer"
                  >
                    {isPlaying ? <Pause className="h-4 w-4 fill-slate-950" /> : <Play className="h-4 w-4 fill-slate-950 ml-0.5" />}
                  </button>
                  <span className="text-[11px] text-slate-300 font-medium">
                    {isPlaying ? 'Ouvindo degustação' : 'Clique para ouvir prévia'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 block">
                    {activeTrack?.sampleRate || '24-bit / 96kHz'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tracklist Table with Single Track Purchase */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-slate-900 border-b border-slate-100 pb-2">
                <span>Faixas do Álbum ({selectedAlbum.tracks.length})</span>
                <span className="text-slate-500 font-semibold text-[11px]">Compra Individual</span>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {selectedAlbum.tracks.map((track, idx) => {
                  const isCurrentTrack = activeTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => togglePlayTrack(track)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isCurrentTrack
                          ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                          : 'bg-white border-slate-200/70 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                            isCurrentTrack && isPlaying 
                              ? 'bg-amber-600 text-white' 
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isCurrentTrack && isPlaying ? (
                            <Pause className="h-3 w-3 fill-current" />
                          ) : (
                            <span>{track.trackNumber}</span>
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate leading-tight">
                            {track.title}
                          </p>
                          <span className="text-[10px] text-slate-500">
                            {track.duration} • {track.bpm ? `${track.bpm} BPM` : 'Master Hi-Fi'}
                          </span>
                        </div>
                      </div>

                      {/* Single Track Buy Button */}
                      <button
                        type="button"
                        onClick={(e) => handleBuyTrack(selectedAlbum, track, e)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
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

            {/* Full Album Purchase CTA */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => handleBuyFullAlbum(selectedAlbum)}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-600/20 cursor-pointer active:scale-98"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Comprar Álbum Completo • R$ {selectedAlbum.albumPrice.toFixed(2).replace('.', ',')} ({selectedFormat})</span>
              </button>

              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Download imediato e seguro após confirmação do PIX</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music2, 
  Play, 
  ExternalLink, 
  Sparkles, 
  Disc, 
  Headphones, 
  ListMusic, 
  Radio, 
  Heart, 
  Share2,
  Check,
  Flame,
  Volume2
} from 'lucide-react';
import { CuratedPlaylist } from '../types';
import { CURATED_PLAYLISTS } from '../data/curatedPlaylistsData';

interface CuratedPlaylistsSectionProps {
  onSelectGenreFilter?: (genre: string) => void;
}

export function CuratedPlaylistsSection({ onSelectGenreFilter }: CuratedPlaylistsSectionProps) {
  const [playlists, setPlaylists] = useState<CuratedPlaylist[]>(CURATED_PLAYLISTS);
  const [selectedPlaylist, setSelectedPlaylist] = useState<CuratedPlaylist>(CURATED_PLAYLISTS[0]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleShare = (pl: CuratedPlaylist, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pl.youtubeMusicUrl);
    setCopiedLink(pl.id);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 border border-red-900/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/30 text-xs font-black uppercase tracking-wider">
              <Radio className="h-3.5 w-3.5" />
              Sintonize o Som do Valdir • YouTube Music & Spotify
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Playlists Curadas pela Valdir Discos
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-medium">
              Curadorias exclusivas montadas diretamente do nosso acervo físico em <strong>Santa Maria - Rio Grande do Sul (RS)</strong>. Ouça as pérolas do samba-rock, raridades da MPB setentista, boogie de pista e clássicos nativistas no seu aplicativo de streaming favorito!
            </p>
          </div>

          {/* Quick Platform Icons */}
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1.5">Ouça em:</span>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-red-600 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm">
                  YouTube Music
                </span>
                <span className="px-3 py-1.5 bg-emerald-600 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm">
                  Spotify
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Showcase: Featured Active Playlist with Embed / Details */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Playlist Artwork & Quick Play */}
          <div className="lg:col-span-4 relative group">
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-900 shadow-xl border-2 border-amber-500/30 relative">
              <img 
                src={selectedPlaylist.coverImage} 
                alt={selectedPlaylist.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                  {selectedPlaylist.genre}
                </span>
                <h3 className="text-lg font-black text-white leading-snug">
                  {selectedPlaylist.title}
                </h3>
                <span className="text-xs text-stone-300">
                  {selectedPlaylist.tracksCount} faixas • {selectedPlaylist.totalDuration}
                </span>
              </div>
            </div>
          </div>

          {/* Playlist Meta, Action Buttons and Featured Tracks */}
          <div className="lg:col-span-8 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold">
                  {selectedPlaylist.curator}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Curadoria 100% Analógica
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                {selectedPlaylist.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {selectedPlaylist.description}
              </p>
            </div>

            {/* Direct External Streaming Links */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={selectedPlaylist.youtubeMusicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shadow-md shadow-red-600/20 cursor-pointer active:scale-95"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Ouvir no YouTube Music</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>

              {selectedPlaylist.spotifyUrl && (
                <a
                  href={selectedPlaylist.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
                >
                  <Music2 className="h-4 w-4" />
                  <span>Ouvir no Spotify</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>
              )}

              <button
                type="button"
                onClick={(e) => handleShare(selectedPlaylist, e)}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink === selectedPlaylist.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5 text-slate-600" />
                    <span>Compartilhar</span>
                  </>
                )}
              </button>
            </div>

            {/* Featured Tracks Preview List */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider block">
                Destaques da Playlist:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedPlaylist.featuredTracks.map((trk, i) => (
                  <div 
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{trk.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{trk.artist}</p>
                      </div>
                    </div>
                    {trk.duration && (
                      <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                        {trk.duration}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Grid of All Curated Playlists */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ListMusic className="h-5 w-5 text-amber-600" />
            <span>Todas as Playlists Recomendadas pelo Valdir</span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {playlists.length} seleções musicais
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {playlists.map((pl) => {
            const isSelected = selectedPlaylist.id === pl.id;
            return (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylist(pl)}
                className={`bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected 
                    ? 'border-red-600 ring-2 ring-red-500/30' 
                    : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                <div>
                  <div className="relative aspect-video overflow-hidden bg-slate-900">
                    <img 
                      src={pl.coverImage} 
                      alt={pl.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                      {pl.genre}
                    </span>

                    <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                      <Play className="h-3.5 w-3.5 fill-white ml-0.5" />
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-2 leading-tight">
                      {pl.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {pl.description}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                  <span className="text-[10px] font-bold text-slate-400">
                    {pl.tracksCount} faixas
                  </span>

                  <div className="flex items-center gap-1">
                    <a
                      href={pl.youtubeMusicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold rounded-md border border-red-200 flex items-center gap-1 transition-colors"
                      title="Abrir no YouTube Music"
                    >
                      <Play className="h-2.5 w-2.5 fill-current" />
                      <span>YT Music</span>
                    </a>

                    {pl.spotifyUrl && (
                      <a
                        href={pl.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200 flex items-center gap-1 transition-colors"
                        title="Abrir no Spotify"
                      >
                        <Music2 className="h-2.5 w-2.5" />
                        <span>Spotify</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

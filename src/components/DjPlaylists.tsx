import React, { useState, useMemo } from 'react';
import { 
  ListMusic, Disc, Plus, Search, Star, Trash2, Copy, Edit3, 
  Clock, Calendar, MapPin, Sparkles, ArrowUp, ArrowDown, 
  Check, ChevronRight, X, Flame, FileText, Printer, 
  Headphones, Tag, Sliders, PlusCircle, Bookmark, AlertCircle,
  Eye, RefreshCw, FolderPlus, Radio, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DJPlaylist, PlaylistItem, SavedListing } from '../types';

interface DjPlaylistsProps {
  playlists: DJPlaylist[];
  listings: SavedListing[];
  onSavePlaylists: (updated: DJPlaylist[]) => void;
}

// Helper to parse duration strings like "04:15" or "4:15" into total seconds
function parseDurationToSeconds(durStr?: string): number {
  if (!durStr) return 0;
  const parts = durStr.trim().split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  } else if (parts.length === 3) {
    const hrs = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    const secs = parseInt(parts[2], 10) || 0;
    return hrs * 3600 + mins * 60 + secs;
  }
  const val = parseInt(durStr, 10);
  return isNaN(val) ? 0 : val;
}

// Format seconds into "MM:SS" or "Xh Ym"
function formatSecondsToDisplay(totalSecs: number): string {
  if (totalSecs <= 0) return '00:00';
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function DjPlaylists({ playlists = [], listings = [], onSavePlaylists }: DjPlaylistsProps) {
  // Navigation: null = list view, or string ID = active playlist studio view
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditMetaModalOpen, setIsEditMetaModalOpen] = useState(false);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [isManualTrackModalOpen, setIsManualTrackModalOpen] = useState(false);
  const [isCueSheetModalOpen, setIsCueSheetModalOpen] = useState(false);
  const [isBoothModeOpen, setIsBoothModeOpen] = useState(false);

  // Form States for Playlist Creation / Editing
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formEventDate, setFormEventDate] = useState('');
  const [formTargetMins, setFormTargetMins] = useState<number>(60);
  const [formTagsStr, setFormTagsStr] = useState('');

  // Form States for Manual Track Entry
  const [trackAlbumTitle, setTrackAlbumTitle] = useState('');
  const [trackAlbumArtist, setTrackAlbumArtist] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [trackPos, setTrackPos] = useState('');
  const [trackDuration, setTrackDuration] = useState('');
  const [trackBpm, setTrackBpm] = useState<string>('');
  const [trackKey, setTrackKey] = useState('');
  const [trackEnergy, setTrackEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [trackDjNotes, setTrackDjNotes] = useState('');
  const [trackDrawer, setTrackDrawer] = useState('');

  // Catalog Picker Search & Drawer Filters
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerDrawerFilter, setPickerDrawerFilter] = useState('all');

  // Edit Track Inline State
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editBpm, setEditBpm] = useState<string>('');
  const [editKey, setEditKey] = useState<string>('');
  const [editEnergy, setEditEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [editNotes, setEditNotes] = useState<string>('');

  // Copy Cue Sheet Toast
  const [copiedCueSheet, setCopiedCueSheet] = useState(false);

  // Currently Selected Playlist
  const activePlaylist = useMemo(() => {
    return playlists.find(p => p.id === activePlaylistId) || null;
  }, [playlists, activePlaylistId]);

  // All unique tags across playlists
  const allTags = useMemo(() => {
    const set = new Set<string>();
    playlists.forEach(p => {
      p.tags?.forEach(t => set.add(t));
    });
    return Array.from(set);
  }, [playlists]);

  // Unique list of physical record drawers in catalog
  const catalogDrawers = useMemo(() => {
    const set = new Set<string>();
    listings.forEach(l => {
      if (l.drawer) set.add(l.drawer);
    });
    return Array.from(set);
  }, [listings]);

  // Filtered Playlists
  const filteredPlaylists = useMemo(() => {
    return playlists.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.venue && p.venue.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.items.some(it => 
          it.trackTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          it.albumArtist.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesTag = selectedTagFilter === 'all' || (p.tags && p.tags.includes(selectedTagFilter));

      return matchesSearch && matchesTag;
    }).sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [playlists, searchTerm, selectedTagFilter]);

  // Calculate active playlist stats
  const activePlaylistStats = useMemo(() => {
    if (!activePlaylist) return { totalSeconds: 0, formattedTime: '00:00', bpmAvg: 0, percentTarget: 0 };
    
    let totalSecs = 0;
    let bpmSum = 0;
    let bpmCount = 0;

    activePlaylist.items.forEach(it => {
      totalSecs += parseDurationToSeconds(it.duration);
      if (it.bpm && it.bpm > 0) {
        bpmSum += it.bpm;
        bpmCount += 1;
      }
    });

    const targetSecs = (activePlaylist.targetDurationMinutes || 60) * 60;
    const percentTarget = targetSecs > 0 ? Math.min(100, Math.round((totalSecs / targetSecs) * 100)) : 0;
    const bpmAvg = bpmCount > 0 ? Math.round(bpmSum / bpmCount) : 0;

    return {
      totalSeconds: totalSecs,
      formattedTime: formatSecondsToDisplay(totalSecs),
      bpmAvg,
      percentTarget
    };
  }, [activePlaylist]);

  // Preset suggestions for quick DJ playlist creation
  const handleApplyPreset = (preset: { title: string; desc: string; targetMins: number; tags: string }) => {
    setFormTitle(preset.title);
    setFormDesc(preset.desc);
    setFormTargetMins(preset.targetMins);
    setFormTagsStr(preset.tags);
  };

  // Create Playlist
  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const tagsArray = formTagsStr
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const newPlaylist: DJPlaylist = {
      id: 'pl_' + Date.now(),
      title: formTitle.trim(),
      description: formDesc.trim() || undefined,
      venue: formVenue.trim() || undefined,
      eventDate: formEventDate || undefined,
      targetDurationMinutes: Number(formTargetMins) || 60,
      tags: tagsArray.length > 0 ? tagsArray : ['DJ Set'],
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false
    };

    onSavePlaylists([newPlaylist, ...playlists]);
    setActivePlaylistId(newPlaylist.id);
    setIsCreateModalOpen(false);
    resetForm();
  };

  // Edit Playlist Metadata
  const handleOpenEditMeta = () => {
    if (!activePlaylist) return;
    setFormTitle(activePlaylist.title);
    setFormDesc(activePlaylist.description || '');
    setFormVenue(activePlaylist.venue || '');
    setFormEventDate(activePlaylist.eventDate || '');
    setFormTargetMins(activePlaylist.targetDurationMinutes || 60);
    setFormTagsStr(activePlaylist.tags ? activePlaylist.tags.join(', ') : '');
    setIsEditMetaModalOpen(true);
  };

  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlaylist || !formTitle.trim()) return;

    const tagsArray = formTagsStr
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const updated = playlists.map(p => {
      if (p.id === activePlaylist.id) {
        return {
          ...p,
          title: formTitle.trim(),
          description: formDesc.trim() || undefined,
          venue: formVenue.trim() || undefined,
          eventDate: formEventDate || undefined,
          targetDurationMinutes: Number(formTargetMins) || 60,
          tags: tagsArray,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    onSavePlaylists(updated);
    setIsEditMetaModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormVenue('');
    setFormEventDate('');
    setFormTargetMins(60);
    setFormTagsStr('');
  };

  // Favorite toggle
  const handleToggleFavorite = (playlistId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, isFavorite: !p.isFavorite };
      }
      return p;
    });
    onSavePlaylists(updated);
  };

  // Duplicate Playlist
  const handleDuplicatePlaylist = (playlist: DJPlaylist, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const duplicated: DJPlaylist = {
      ...playlist,
      id: 'pl_' + Date.now(),
      title: `${playlist.title} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false,
      items: playlist.items.map(it => ({ ...it, id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) }))
    };
    onSavePlaylists([duplicated, ...playlists]);
  };

  // Delete Playlist
  const handleDeletePlaylist = (playlistId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta playlist?')) {
      const updated = playlists.filter(p => p.id !== playlistId);
      onSavePlaylists(updated);
      if (activePlaylistId === playlistId) {
        setActivePlaylistId(null);
      }
    }
  };

  // Add Item to Playlist
  const handleAddTrackToActivePlaylist = (trackItem: Omit<PlaylistItem, 'id'>) => {
    if (!activePlaylist) return;

    const newItem: PlaylistItem = {
      ...trackItem,
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    };

    const updated = playlists.map(p => {
      if (p.id === activePlaylist.id) {
        return {
          ...p,
          items: [...p.items, newItem],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    onSavePlaylists(updated);
  };

  // Add Entire Album from Catalog to Active Playlist
  const handleAddEntireAlbumToPlaylist = (listing: SavedListing) => {
    if (!activePlaylist) return;

    const newItems: PlaylistItem[] = (listing.release.tracklist || []).map((t, idx) => ({
      id: 'item_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
      listingId: listing.id,
      albumTitle: listing.release.title,
      albumArtist: listing.release.artist,
      coverImage: listing.release.coverImage,
      trackTitle: t.title,
      trackPosition: t.position || `#${idx + 1}`,
      duration: t.duration || '',
      drawer: listing.drawer || ''
    }));

    const updated = playlists.map(p => {
      if (p.id === activePlaylist.id) {
        return {
          ...p,
          items: [...p.items, ...newItems],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    onSavePlaylists(updated);
  };

  // Move track position up / down
  const handleMoveTrack = (index: number, direction: 'up' | 'down') => {
    if (!activePlaylist) return;
    const newItems = [...activePlaylist.items];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;

    const updated = playlists.map(p => {
      if (p.id === activePlaylist.id) {
        return {
          ...p,
          items: newItems,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    onSavePlaylists(updated);
  };

  // Remove track from active playlist
  const handleRemoveTrack = (itemId: string) => {
    if (!activePlaylist) return;
    const updatedItems = activePlaylist.items.filter(it => it.id !== itemId);
    const updated = playlists.map(p => {
      if (p.id === activePlaylist.id) {
        return {
          ...p,
          items: updatedItems,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    onSavePlaylists(updated);
  };

  // Quick Inline Edit Track Details
  const handleStartEditTrack = (item: PlaylistItem) => {
    setEditingTrackId(item.id);
    setEditBpm(item.bpm ? String(item.bpm) : '');
    setEditKey(item.key || '');
    setEditEnergy(item.energy || 3);
    setEditNotes(item.djNotes || '');
  };

  const handleSaveEditTrack = (itemId: string) => {
    if (!activePlaylist) return;
    const updatedItems = activePlaylist.items.map(it => {
      if (it.id === itemId) {
        return {
          ...it,
          bpm: editBpm ? Number(editBpm) : undefined,
          key: editKey.trim() || undefined,
          energy: editEnergy,
          djNotes: editNotes.trim() || undefined
        };
      }
      return it;
    });

    const updated = playlists.map(p => {
      if (p.id === activePlaylist.id) {
        return {
          ...p,
          items: updatedItems,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    onSavePlaylists(updated);
    setEditingTrackId(null);
  };

  // Submit Manual Track Form
  const handleSaveManualTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackTitle.trim() || !trackAlbumArtist.trim()) return;

    handleAddTrackToActivePlaylist({
      albumTitle: trackAlbumTitle.trim() || 'Single / Avulso',
      albumArtist: trackAlbumArtist.trim(),
      trackTitle: trackTitle.trim(),
      trackPosition: trackPos.trim() || undefined,
      duration: trackDuration.trim() || undefined,
      bpm: trackBpm ? Number(trackBpm) : undefined,
      key: trackKey.trim() || undefined,
      energy: trackEnergy,
      djNotes: trackDjNotes.trim() || undefined,
      drawer: trackDrawer.trim() || undefined
    });

    setIsManualTrackModalOpen(false);
    // Reset form
    setTrackAlbumTitle('');
    setTrackAlbumArtist('');
    setTrackTitle('');
    setTrackPos('');
    setTrackDuration('');
    setTrackBpm('');
    setTrackKey('');
    setTrackEnergy(3);
    setTrackDjNotes('');
    setTrackDrawer('');
  };

  // Filter Catalog listings for Picker
  const catalogPickerListings = useMemo(() => {
    return listings.filter(l => {
      const matchSearch = 
        l.release.title.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        l.release.artist.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        (l.release.genres && l.release.genres.some(g => g.toLowerCase().includes(pickerSearch.toLowerCase()))) ||
        (l.release.tracklist && l.release.tracklist.some(t => t.title.toLowerCase().includes(pickerSearch.toLowerCase())));

      const matchDrawer = pickerDrawerFilter === 'all' || l.drawer === pickerDrawerFilter;

      return matchSearch && matchDrawer;
    });
  }, [listings, pickerSearch, pickerDrawerFilter]);

  // Formatted Cue Sheet Text Generator
  const formattedCueSheetText = useMemo(() => {
    if (!activePlaylist) return '';
    let text = `=====================================================\n`;
    text += `🎧 ROTEIRO DE DJ / CUE SHEET - VALDIR DISCOS\n`;
    text += `=====================================================\n`;
    text += `PLAYLIST: ${activePlaylist.title}\n`;
    if (activePlaylist.venue) text += `LOCAL: ${activePlaylist.venue}\n`;
    if (activePlaylist.eventDate) text += `DATA DO EVENTO: ${activePlaylist.eventDate}\n`;
    text += `DURAÇÃO TOTAL: ${activePlaylistStats.formattedTime} (Meta: ${activePlaylist.targetDurationMinutes || 60} min)\n`;
    text += `TOTAL DE MÚSICAS: ${activePlaylist.items.length}\n`;
    if (activePlaylist.description) text += `OBSERVAÇÕES: ${activePlaylist.description}\n`;
    text += `-----------------------------------------------------\n\n`;

    activePlaylist.items.forEach((item, idx) => {
      const num = (idx + 1).toString().padStart(2, '0');
      text += `${num}. [${item.duration || '--:--'}] ${item.trackTitle}\n`;
      text += `    Artista: ${item.albumArtist}\n`;
      text += `    Álbum: ${item.albumTitle} ${item.trackPosition ? `(${item.trackPosition})` : ''}\n`;
      if (item.drawer) text += `    📦 LOCALIZAÇÃO / GAVETA DO VINIL: ${item.drawer}\n`;
      if (item.bpm || item.key || item.energy) {
        text += `    ⚡ BPM: ${item.bpm || '--'} | Tom: ${item.key || '--'} | Energia: ${'★'.repeat(item.energy || 3)}\n`;
      }
      if (item.djNotes) text += `    📝 NOTA DJ: ${item.djNotes}\n`;
      text += `\n`;
    });

    text += `=====================================================\n`;
    text += `Gerado por Valdir Discos - Painel do DJ\n`;
    return text;
  }, [activePlaylist, activePlaylistStats]);

  const handleCopyCueSheet = () => {
    navigator.clipboard.writeText(formattedCueSheetText);
    setCopiedCueSheet(true);
    setTimeout(() => setCopiedCueSheet(false), 2500);
  };

  return (
    <div className="space-y-6" id="dj-playlists-container">
      {/* ----------------- IF IN PLAYLIST STUDIO VIEW ----------------- */}
      {activePlaylist ? (
        <div className="space-y-6">
          {/* Top Bar Header Navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActivePlaylistId(null)}
                className="h-10 w-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                title="Voltar para todas as playlists"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    {activePlaylist.title}
                  </h2>
                  {activePlaylist.isFavorite && (
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  )}
                  <button
                    type="button"
                    onClick={handleOpenEditMeta}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Editar informações da playlist"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5 flex-wrap">
                  {activePlaylist.venue && (
                    <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                      {activePlaylist.venue}
                    </span>
                  )}
                  {activePlaylist.eventDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(activePlaylist.eventDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {activePlaylistStats.formattedTime} / {activePlaylist.targetDurationMinutes || 60}m planejado
                  </span>
                </div>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsBoothModeOpen(true)}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Radio className="h-4 w-4 animate-pulse text-amber-400" />
                Modo Cabine DJ
              </button>
              <button
                type="button"
                onClick={() => setIsCueSheetModalOpen(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                Gerar Roteiro
              </button>
              <button
                type="button"
                onClick={() => setIsCatalogPickerOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Buscar do Acervo
              </button>
            </div>
          </div>

          {/* Target Progress & Set Analytics Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
                  <Headphones className="h-3.5 w-3.5 text-indigo-400" />
                  Métricas do Set do DJ
                </span>
                <p className="text-xs text-slate-300 font-medium">
                  {activePlaylist.description || 'Organize a sequência ideal de vinis, viradas de BPM e notas de transição.'}
                </p>
              </div>

              {/* Metric Chips */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-xl text-center">
                  <span className="text-[9px] text-slate-300 uppercase block font-extrabold">Total Músicas</span>
                  <span className="text-sm font-black font-mono text-white">{activePlaylist.items.length}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-xl text-center">
                  <span className="text-[9px] text-slate-300 uppercase block font-extrabold">Duração Estimada</span>
                  <span className="text-sm font-black font-mono text-amber-300">{activePlaylistStats.formattedTime}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-xl text-center">
                  <span className="text-[9px] text-slate-300 uppercase block font-extrabold">BPM Médio</span>
                  <span className="text-sm font-black font-mono text-emerald-300">{activePlaylistStats.bpmAvg || '--'}</span>
                </div>
              </div>
            </div>

            {/* Duration Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                <span>Progresso da Meta de Tempo ({activePlaylist.targetDurationMinutes || 60} min)</span>
                <span className="font-mono text-amber-300">{activePlaylistStats.percentTarget}% preenchido</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    activePlaylistStats.percentTarget > 100 
                      ? 'bg-gradient-to-r from-amber-400 to-rose-500' 
                      : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, activePlaylistStats.percentTarget)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tracklist Studio Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ListMusic className="h-5 w-5 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Sequência de Faixas do Set ({activePlaylist.items.length})
                </h3>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsCatalogPickerOpen(true)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Do Acervo
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualTrackModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Música Avulsa
                </button>
              </div>
            </div>

            {activePlaylist.items.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Disc className="h-6 w-6 animate-spin" style={{ animationDuration: '10s' }} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Sua playlist está vazia</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Adicione faixas diretamente dos discos cadastrados no seu acervo ou inclua músicas externas.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCatalogPickerOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    Adicionar Músicas do Acervo
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                {activePlaylist.items.map((item, index) => {
                  const isEditingThis = editingTrackId === item.id;

                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 transition-colors hover:bg-slate-50/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        isEditingThis ? 'bg-indigo-50/40 border-l-4 border-l-indigo-600' : ''
                      }`}
                    >
                      {/* Left Block: Track Number, Cover, Title, Album & Drawer */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Sequence Number */}
                        <span className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center flex-shrink-0 font-mono">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>

                        {/* Cover image */}
                        <div className="h-11 w-11 rounded-lg bg-slate-200 border border-slate-300/80 overflow-hidden flex-shrink-0 shadow-sm relative">
                          {item.coverImage && item.coverImage.trim() !== '' ? (
                            <img src={item.coverImage} alt={item.albumTitle} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-indigo-900 text-indigo-300 flex items-center justify-center">
                              <Disc className="h-6 w-6" />
                            </div>
                          )}
                        </div>

                        {/* Title & Artist */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-slate-900 truncate">
                              {item.trackTitle}
                            </span>
                            {item.trackPosition && (
                              <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                {item.trackPosition}
                              </span>
                            )}
                            {item.duration && (
                              <span className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {item.duration}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium truncate mt-0.5 flex-wrap">
                            <span className="text-slate-700 font-bold">{item.albumArtist}</span>
                            <span>•</span>
                            <span className="text-slate-500">{item.albumTitle}</span>
                            
                            {item.drawer && (
                              <span className="ml-1 text-[10px] bg-amber-50 text-amber-800 border border-amber-200/80 font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                📦 {item.drawer}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle Block: DJ Attributes (BPM, Key, Energy, Notes) */}
                      {!isEditingThis ? (
                        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap w-full md:w-auto">
                          {/* BPM & Key */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-center min-w-[70px]">
                            <span className="text-[8px] uppercase font-bold text-slate-400 block">BPM / Tom</span>
                            <span className="text-xs font-black font-mono text-slate-800">
                              {item.bpm || '--'} <span className="text-[10px] text-indigo-600 font-sans">{item.key || ''}</span>
                            </span>
                          </div>

                          {/* Energy Stars */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-center min-w-[70px]">
                            <span className="text-[8px] uppercase font-bold text-slate-400 block">Energia</span>
                            <div className="flex items-center justify-center gap-0.5 text-amber-500 text-xs">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={i < (item.energy || 3) ? 'text-amber-500' : 'text-slate-200'}>
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* DJ Notes */}
                          <div className="flex-1 md:w-48 bg-amber-50/60 border border-amber-200/60 rounded-xl p-1.5 text-[11px] text-amber-900 leading-tight">
                            <span className="font-extrabold text-[9px] uppercase tracking-wider text-amber-700 block">
                              Nota Transição:
                            </span>
                            <span className="line-clamp-2">
                              {item.djNotes || 'Nenhuma anotação especificada.'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Inline Editor for DJ Attributes */
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-indigo-200 shadow-sm w-full md:w-auto">
                          <div className="w-20">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block">BPM</label>
                            <input
                              type="number"
                              placeholder="Ex: 124"
                              value={editBpm}
                              onChange={(e) => setEditBpm(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold"
                            />
                          </div>

                          <div className="w-20">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block">Tom/Key</label>
                            <input
                              type="text"
                              placeholder="Ex: Am"
                              value={editKey}
                              onChange={(e) => setEditKey(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold"
                            />
                          </div>

                          <div className="w-24">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block">Energia (1-5)</label>
                            <select
                              value={editEnergy}
                              onChange={(e) => setEditEnergy(Number(e.target.value) as any)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold"
                            >
                              <option value={1}>1 - Intro</option>
                              <option value={2}>2 - Suave</option>
                              <option value={3}>3 - Médio</option>
                              <option value={4}>4 - Dançante</option>
                              <option value={5}>5 - Pico / Hino</option>
                            </select>
                          </div>

                          <div className="flex-1 min-w-[140px]">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block">Anotação do DJ</label>
                            <input
                              type="text"
                              placeholder="Ex: Entra na intro de bateria"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                            />
                          </div>

                          <div className="flex items-center gap-1 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleSaveEditTrack(item.id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTrackId(null)}
                              className="px-2 py-1 bg-slate-100 text-slate-600 rounded font-bold text-xs hover:bg-slate-200 cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0 self-end md:self-auto">
                        {!isEditingThis && (
                          <button
                            type="button"
                            onClick={() => handleStartEditTrack(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar BPM, Tom e Anotações"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleMoveTrack(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
                          title="Mover para cima"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveTrack(index, 'down')}
                          disabled={index === activePlaylist.items.length - 1}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveTrack(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover da playlist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ----------------- PLAYLISTS OVERVIEW / MAIN LIST VIEW ----------------- */
        <div className="space-y-6">
          {/* Main Top Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-amber-400 shadow-md">
                <ListMusic className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Minhas Playlists & Sets de DJ
                </h2>
                <p className="text-xs text-slate-500">
                  Crie sequências de faixas, organize festas, eventos e saiba exatamente qual gaveta pegar os discos.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Nova Playlist de DJ
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-4 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="h-11 w-11 bg-white/20 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <ListMusic className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-100 block tracking-wider">Playlists Criadas</span>
                <span className="text-2xl font-black font-mono leading-tight">{playlists.length}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="h-11 w-11 bg-white/20 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-100 block tracking-wider">Favoritas / Destaque</span>
                <span className="text-2xl font-black font-mono leading-tight">{playlists.filter(p => p.isFavorite).length}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-4 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="h-11 w-11 bg-white/20 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0">
                <Disc className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">Total de Músicas em Sets</span>
                <span className="text-2xl font-black font-mono text-amber-300 leading-tight">
                  {playlists.reduce((sum, p) => sum + p.items.length, 0)}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-4 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="h-11 w-11 bg-white/20 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-100 block tracking-wider">Próximo Gig/Evento</span>
                <span className="text-sm font-extrabold truncate block">
                  {playlists.find(p => p.eventDate)?.eventDate
                    ? new Date(playlists.find(p => p.eventDate)!.eventDate + 'T00:00:00').toLocaleDateString('pt-BR')
                    : 'Nenhum agendado'}
                </span>
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome da playlist, festa, local, tag ou música..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-700"
              />
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={selectedTagFilter}
                  onChange={(e) => setSelectedTagFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todas as Tags ({allTags.length})</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Playlists Cards Grid */}
          {filteredPlaylists.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-12 w-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <ListMusic className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Nenhuma playlist encontrada</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchTerm ? 'Tente mudar o termo de busca ou limpar os filtros.' : 'Comece criando seu primeiro set para organizar as faixas dos discos do seu acervo.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Criar Nova Playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPlaylists.map((playlist) => {
                // Calculate runtime
                const totalSecs = playlist.items.reduce((sum, it) => sum + parseDurationToSeconds(it.duration), 0);
                const formattedTime = formatSecondsToDisplay(totalSecs);

                // Collect up to 4 cover images for mosaic
                const covers = playlist.items
                  .map(it => it.coverImage)
                  .filter(Boolean) as string[];

                return (
                  <div
                    key={playlist.id}
                    onClick={() => setActivePlaylistId(playlist.id)}
                    className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative overflow-hidden"
                  >
                    {/* Top Header Card */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        {/* Cover Mosaic or Icon */}
                        <div className="h-14 w-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-900 flex-shrink-0 flex items-center justify-center shadow-sm">
                          {covers.length >= 4 ? (
                            <div className="grid grid-cols-2 h-full w-full">
                              <img src={covers[0]} className="h-full w-full object-cover" alt="" />
                              <img src={covers[1]} className="h-full w-full object-cover" alt="" />
                              <img src={covers[2]} className="h-full w-full object-cover" alt="" />
                              <img src={covers[3]} className="h-full w-full object-cover" alt="" />
                            </div>
                          ) : covers.length > 0 ? (
                            <img src={covers[0]} className="h-full w-full object-cover" alt="" />
                          ) : (
                            <Disc className="h-7 w-7 text-indigo-400 animate-spin" style={{ animationDuration: '15s' }} />
                          )}
                        </div>

                        {/* Favorite Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(playlist.id, e)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            playlist.isFavorite ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-500'
                          }`}
                          title={playlist.isFavorite ? 'Remover dos destaques' : 'Marcar como favorita'}
                        >
                          <Star className={`h-5 w-5 ${playlist.isFavorite ? 'fill-amber-500' : ''}`} />
                        </button>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {playlist.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 min-h-[32px]">
                          {playlist.description || 'Sem descrição cadastrada.'}
                        </p>
                      </div>

                      {/* Venue / Event Date */}
                      {(playlist.venue || playlist.eventDate) && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold flex-wrap">
                          {playlist.venue && (
                            <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              <MapPin className="h-3 w-3" />
                              {playlist.venue}
                            </span>
                          )}
                          {playlist.eventDate && (
                            <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Calendar className="h-3 w-3" />
                              {new Date(playlist.eventDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {playlist.tags && playlist.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {playlist.tags.map(t => (
                            <span key={t} className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Card Metrics & Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs font-mono font-bold text-slate-700">
                        <span className="flex items-center gap-1">
                          <Disc className="h-3.5 w-3.5 text-indigo-500" />
                          {playlist.items.length} faixas
                        </span>
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          {formattedTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleDuplicatePlaylist(playlist, e)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Duplicar Playlist"
                        >
                          <Copy className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir Playlist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ----------------- MODAL: CREATE PLAYLIST ----------------- */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ListMusic className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Criar Nova Playlist de DJ</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* DJ Preset Suggestions */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sugestões Rápidas de Modelos de Set:</label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { title: 'Set Baile Black & Funk 70s', desc: 'Samba-rock, boogie nacional e soul para esquentar a pista', targetMins: 90, tags: 'VinylOnly, Boogie, Soul' },
                    { title: 'Warm-up MPB & Jazz Grooves', desc: 'Músicas mais suaves para o início da noite', targetMins: 60, tags: 'MPB, Jazz, Smooth' },
                    { title: 'Pico da Noite - Disco & House 12"', desc: 'Discos de 12 polegadas com BPMs elevados', targetMins: 120, tags: 'Disco, House, 12inch' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-[11px] font-bold text-slate-700 hover:text-indigo-700 whitespace-nowrap transition-all cursor-pointer flex-shrink-0"
                    >
                      ✨ {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreatePlaylist} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Título da Playlist / Nome do Set *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Baile do Valdir - Edição Vinil Raro"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Local / Casa de Show</label>
                    <input
                      type="text"
                      placeholder="Ex: Bar do Zé / Sesc Pompeia"
                      value={formVenue}
                      onChange={(e) => setFormVenue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Data do Evento</label>
                    <input
                      type="date"
                      value={formEventDate}
                      onChange={(e) => setFormEventDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Meta de Tempo (minutos)</label>
                    <input
                      type="number"
                      min={10}
                      max={480}
                      value={formTargetMins}
                      onChange={(e) => setFormTargetMins(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Tags (separadas por vírgula)</label>
                    <input
                      type="text"
                      placeholder="Ex: VinylOnly, 70s, Boogie"
                      value={formTagsStr}
                      onChange={(e) => setFormTagsStr(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Descrição / Observações do Set</label>
                  <textarea
                    placeholder="Anotações gerais sobre o estilo da festa, público, bpm de início e encerramento..."
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    Criar Playlist
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: EDIT PLAYLIST METADATA ----------------- */}
      <AnimatePresence>
        {isEditMetaModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Editar Detalhes da Playlist</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditMetaModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMeta} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Título da Playlist *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Local / Casa de Show</label>
                    <input
                      type="text"
                      value={formVenue}
                      onChange={(e) => setFormVenue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Data do Evento</label>
                    <input
                      type="date"
                      value={formEventDate}
                      onChange={(e) => setFormEventDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Meta de Tempo (minutos)</label>
                    <input
                      type="number"
                      value={formTargetMins}
                      onChange={(e) => setFormTargetMins(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Tags (separadas por vírgula)</label>
                    <input
                      type="text"
                      value={formTagsStr}
                      onChange={(e) => setFormTagsStr(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Descrição / Observações</label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditMetaModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: CATALOG TRACK PICKER ----------------- */}
      <AnimatePresence>
        {isCatalogPickerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Disc className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Buscar Músicas no Acervo para a Playlist</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCatalogPickerOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search & Drawer Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar por título da música, artista ou álbum..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                {catalogDrawers.length > 0 && (
                  <select
                    value={pickerDrawerFilter}
                    onChange={(e) => setPickerDrawerFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Todas as Gavetas ({catalogDrawers.length})</option>
                    {catalogDrawers.map(d => (
                      <option key={d} value={d}>📦 Gaveta {d}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Catalog Items Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {catalogPickerListings.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Nenhum disco encontrado com este termo de busca.
                  </div>
                ) : (
                  catalogPickerListings.map((listing) => (
                    <div key={listing.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {listing.release.coverImage && listing.release.coverImage.trim() !== '' ? (
                            <img
                              src={listing.release.coverImage}
                              alt=""
                              className="h-10 w-10 rounded-lg object-cover border border-slate-200 flex-shrink-0 bg-white"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg border border-slate-200 flex-shrink-0 bg-slate-100 flex items-center justify-center text-slate-400">
                              <Disc className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {listing.release.artist} - {listing.release.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mt-0.5">
                              {listing.drawer && (
                                <span className="bg-amber-100 text-amber-800 font-black px-1.5 py-0.2 rounded">
                                  📦 {listing.drawer}
                                </span>
                              )}
                              <span>{listing.release.year || 'Ano N/I'}</span>
                              <span>•</span>
                              <span>{listing.release.tracklist?.length || 0} faixas</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddEntireAlbumToPlaylist(listing)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar LP Todo
                        </button>
                      </div>

                      {/* Individual Track Items */}
                      <div className="bg-white rounded-xl border border-slate-200/60 divide-y divide-slate-100 text-xs">
                        {listing.release.tracklist && listing.release.tracklist.length > 0 ? (
                          listing.release.tracklist.map((track, tIdx) => (
                            <div key={tIdx} className="p-2.5 flex items-center justify-between hover:bg-slate-50/80 gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 font-mono w-6">
                                  {track.position || `#${tIdx + 1}`}
                                </span>
                                <span className="font-semibold text-slate-800 truncate">
                                  {track.title}
                                </span>
                                {track.duration && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ({track.duration})
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  handleAddTrackToActivePlaylist({
                                    listingId: listing.id,
                                    albumTitle: listing.release.title,
                                    albumArtist: listing.release.artist,
                                    coverImage: listing.release.coverImage,
                                    trackTitle: track.title,
                                    trackPosition: track.position || `#${tIdx + 1}`,
                                    duration: track.duration || '',
                                    drawer: listing.drawer || ''
                                  });
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0"
                              >
                                <Plus className="h-3 w-3" />
                                Adicionar
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-[10px] text-slate-400 text-center">Sem lista de faixas detalhada neste disco.</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: MANUAL TRACK ENTRY ----------------- */}
      <AnimatePresence>
        {isManualTrackModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Adicionar Música Avulsa / Externa</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualTrackModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveManualTrack} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Título da Música *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Cheia de Manias"
                      value={trackTitle}
                      onChange={(e) => setTrackTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Artista / Banda *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Raça Negra"
                      value={trackAlbumArtist}
                      onChange={(e) => setTrackAlbumArtist(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Álbum / LP Originário</label>
                    <input
                      type="text"
                      placeholder="Ex: Raça Negra (1991)"
                      value={trackAlbumTitle}
                      onChange={(e) => setTrackAlbumTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Posição (A1, B2...)</label>
                    <input
                      type="text"
                      placeholder="Ex: A1"
                      value={trackPos}
                      onChange={(e) => setTrackPos(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Duração (MM:SS)</label>
                    <input
                      type="text"
                      placeholder="Ex: 03:45"
                      value={trackDuration}
                      onChange={(e) => setTrackDuration(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">BPM</label>
                    <input
                      type="number"
                      placeholder="Ex: 120"
                      value={trackBpm}
                      onChange={(e) => setTrackBpm(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Tom / Key</label>
                    <input
                      type="text"
                      placeholder="Ex: Am ou 8A"
                      value={trackKey}
                      onChange={(e) => setTrackKey(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Localização / Gaveta</label>
                    <input
                      type="text"
                      placeholder="Ex: Armário B-02"
                      value={trackDrawer}
                      onChange={(e) => setTrackDrawer(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Anotação para Transição / DJ Notes</label>
                  <input
                    type="text"
                    placeholder="Ex: Tocar em 45 RPM, introdução com metais marcantes"
                    value={trackDjNotes}
                    onChange={(e) => setTrackDjNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsManualTrackModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer"
                  >
                    Adicionar à Playlist
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: PRINTABLE CUE SHEET / ROTEIRO ----------------- */}
      <AnimatePresence>
        {isCueSheetModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Roteiro Imprimível do DJ (Cue Sheet)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCueSheetModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <textarea
                readOnly
                value={formattedCueSheetText}
                className="w-full h-80 px-4 py-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl leading-relaxed border border-slate-800 scrollbar-thin"
              />

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  {copiedCueSheet ? '✅ Copiado para a área de transferência!' : 'Pronto para levar para o evento ou colar no WhatsApp.'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Imprimir Página
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCueSheet}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar Roteiro
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: MODO CABINE DJ (HIGH-CONTRAST FULLSCREEN) ----------------- */}
      <AnimatePresence>
        {isBoothModeOpen && activePlaylist && (
          <div className="fixed inset-0 z-50 bg-slate-950 text-white overflow-y-auto p-4 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-black">
                  <Radio className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider uppercase font-mono">
                    {activePlaylist.title}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    MODO CABINE DJ • {activePlaylist.items.length} MÚSICAS • {activePlaylistStats.formattedTime}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBoothModeOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                SAIR DO MODO CABINE ✕
              </button>
            </div>

            {/* High Contrast Booth Track List */}
            <div className="space-y-3">
              {activePlaylist.items.map((item, idx) => (
                <div 
                  key={item.id} 
                  className="bg-slate-900 border-2 border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-2xl font-black text-amber-400 w-10">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-white">
                          {item.trackTitle}
                        </span>
                        {item.trackPosition && (
                          <span className="text-xs bg-slate-800 text-amber-300 font-bold px-2 py-0.5 rounded">
                            [{item.trackPosition}]
                          </span>
                        )}
                        {item.duration && (
                          <span className="text-xs text-slate-400 font-bold">
                            ({item.duration})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 font-bold mt-0.5">
                        {item.albumArtist} — <span className="text-slate-400">{item.albumTitle}</span>
                      </p>

                      {item.djNotes && (
                        <p className="text-xs text-amber-300/90 font-sans mt-1 bg-amber-950/40 p-2 rounded-lg border border-amber-900/40">
                          📝 {item.djNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right side Location & BPM badge */}
                  <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
                    {item.drawer && (
                      <div className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1 shadow-md">
                        📦 GAVETA {item.drawer}
                      </div>
                    )}

                    {(item.bpm || item.key) && (
                      <div className="bg-slate-800 border border-slate-700 text-emerald-400 font-black text-xs px-3 py-1.5 rounded-xl">
                        {item.bpm ? `${item.bpm} BPM` : ''} {item.key ? `[${item.key}]` : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  PlayCircle, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ListPlus, 
  User, 
  Users, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Track } from '../types';
import { isVariousArtistsAlbum } from '../utils/formatHelper';

interface TracklistViewerProps {
  tracklist: Track[];
  albumArtist?: string;
  albumTitle?: string;
  isCapturing?: boolean;
  onUpdateTracklist?: (updated: Track[]) => void;
}

export const TracklistViewer: React.FC<TracklistViewerProps> = ({ 
  tracklist = [], 
  albumArtist = '',
  albumTitle = '',
  isCapturing = false,
  onUpdateTracklist 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichStatus, setEnrichStatus] = useState<string | null>(null);

  const isVA = isVariousArtistsAlbum(albumArtist, undefined, tracklist);

  const handleAutoIdentifyArtists = async () => {
    if (!tracklist || tracklist.length === 0) return;
    setIsEnriching(true);
    setEnrichStatus(null);
    try {
      const res = await fetch('/api/enrich-va-artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumTitle: albumTitle || 'Coletânea',
          albumArtist: albumArtist || 'Vários Artistas',
          tracklist
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.tracklist)) {
        onUpdateTracklist?.(data.tracklist);
        setEnrichStatus('Artistas identificados com sucesso!');
        setTimeout(() => setEnrichStatus(null), 4000);
      } else {
        setEnrichStatus(data.error || 'Não foi possível identificar todos os artistas.');
      }
    } catch (err: any) {
      setEnrichStatus('Erro de conexão ao identificar artistas.');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const nextPos = newPosition.trim() || String(tracklist.length + 1);
    const newTrack: Track = {
      position: nextPos,
      title: newTitle.trim(),
      duration: newDuration.trim() || '03:30',
      artist: newArtist.trim() || undefined
    };

    const updated = [...tracklist, newTrack];
    onUpdateTracklist?.(updated);

    setNewPosition('');
    setNewTitle('');
    setNewDuration('');
    setNewArtist('');
  };

  const handleRemoveTrack = (index: number) => {
    const updated = tracklist.filter((_, i) => i !== index);
    onUpdateTracklist?.(updated);
  };

  const handleUpdateTrackItem = (index: number, field: keyof Track, value: string) => {
    const updated = tracklist.map((t, i) => {
      if (i === index) {
        return { ...t, [field]: value };
      }
      return t;
    });
    onUpdateTracklist?.(updated);
  };

  const handleApplyBulkText = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedTracks: Track[] = lines.map((line, idx) => {
      // Try to parse format: "1. Song Name (03:40)" or "A1 - Song Name" or "Artist - Song"
      let pos = String(idx + 1);
      let title = line;
      let dur = '';
      let art = '';

      // Match duration at end: (03:45) or [4:20]
      const durMatch = line.match(/[\(\[]\s*(\d{1,2}:\d{2})\s*[\)\]]/);
      if (durMatch) {
        dur = durMatch[1];
        title = line.replace(durMatch[0], '').trim();
      }

      // Match position at start: "A1 -", "1.", "B2.", "01."
      const posMatch = title.match(/^([A-Da-d]?\d{1,2})[\.\-\s:]+\s*/);
      if (posMatch) {
        pos = posMatch[1].toUpperCase();
        title = title.substring(posMatch[0].length).trim();
      }

      // Match artist if separated by " - " or " – " or " — " or " / "
      // Example: "Raul Seixas - Metamorfose Ambulante"
      const sepMatch = title.match(/^(.+?)\s+[-–—/]\s+(.+)$/);
      if (sepMatch) {
        art = sepMatch[1].trim();
        title = sepMatch[2].trim();
      }

      return {
        position: pos,
        title: title || `Faixa ${idx + 1}`,
        duration: dur || '',
        artist: art || undefined
      };
    });

    if (parsedTracks.length > 0) {
      onUpdateTracklist?.(parsedTracks);
      setIsBulkOpen(false);
      setBulkText('');
    }
  };

  return (
    <div className="space-y-2" id="tracklist-viewer-container">
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider px-1 border-b border-slate-100 pb-1.5">
        <span className="flex items-center gap-1.5">
          <PlayCircle className="h-3.5 w-3.5 text-indigo-600" />
          <span>Músicas / Faixas ({tracklist.length})</span>
          {isVA && (
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1 normal-case tracking-normal">
              <Users className="h-3 w-3" />
              Coletânea / V.A.
            </span>
          )}
        </span>
        
        {!isCapturing && onUpdateTracklist && (
          <div className="flex items-center gap-1.5">
            {isVA && (
              <button
                type="button"
                onClick={handleAutoIdentifyArtists}
                disabled={isEnriching}
                className="text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                title="Identificar automaticamente o artista de cada música com IA"
              >
                <Sparkles className={`h-3 w-3 ${isEnriching ? 'animate-spin' : ''}`} />
                {isEnriching ? 'Identificando...' : 'Identificar Artistas'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsBulkOpen(!isBulkOpen)}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer"
              title="Colar lista de músicas em texto"
            >
              <ListPlus className="h-3 w-3" />
              Colar Lista
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                isEditing
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {isEditing ? (
                <>
                  <Check className="h-3 w-3" />
                  Pronto
                </>
              ) : (
                <>
                  <Edit3 className="h-3 w-3" />
                  Editar
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {enrichStatus && (
        <div className="text-[11px] font-medium text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-teal-600 shrink-0" />
          <span>{enrichStatus}</span>
        </div>
      )}

      {/* Bulk Paste Box */}
      {isBulkOpen && (
        <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-xs animate-scaleUp">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-950 text-[11px]">
              Cole a lista de faixas (uma por linha) - para coletâneas, use "Artista - Música":
            </span>
            <button 
              type="button" 
              onClick={() => setIsBulkOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <textarea
            rows={4}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"Ex:\nA1. Raul Seixas - Metamorfose Ambulante (03:50)\nA2. Tim Maia - Gostava Tanto de Você (04:15)\nB1. Rita Lee - Ovelha Negra (05:20)"}
            className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsBulkOpen(false)}
              className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-md cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyBulkText}
              className="px-3 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-pointer shadow-xs"
            >
              Importar Faixas
            </button>
          </div>
        </div>
      )}

      {/* Track List */}
      {tracklist.length === 0 ? (
        <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs space-y-1">
          <p>Nenhuma faixa cadastrada.</p>
          {onUpdateTracklist && (
            <p className="text-[10px] text-indigo-600 font-semibold cursor-pointer hover:underline" onClick={() => setIsBulkOpen(true)}>
              + Clique aqui para colar as músicas do disco
            </p>
          )}
        </div>
      ) : (
        <div className={`${isCapturing ? 'max-h-none overflow-visible' : 'max-h-[220px] overflow-y-auto pr-1'} scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent space-y-1`}>
          {tracklist.map((track, idx) => (
            <div
              key={`track-${idx}-${track.position}`}
              className="flex items-center justify-between py-1.5 px-2 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/50 text-xs transition-colors group"
            >
              {isEditing ? (
                <div className="flex items-center gap-1.5 w-full flex-wrap sm:flex-nowrap">
                  <input
                    type="text"
                    value={track.position}
                    onChange={(e) => handleUpdateTrackItem(idx, 'position', e.target.value)}
                    className="w-10 px-1.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold text-indigo-600 text-center"
                    placeholder="Pos"
                  />
                  <input
                    type="text"
                    value={track.title}
                    onChange={(e) => handleUpdateTrackItem(idx, 'title', e.target.value)}
                    className="flex-1 min-w-[120px] px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800"
                    placeholder="Nome da Música"
                  />
                  <input
                    type="text"
                    value={track.artist || ''}
                    onChange={(e) => handleUpdateTrackItem(idx, 'artist', e.target.value)}
                    className="w-28 px-1.5 py-1 bg-white border border-teal-200 rounded text-[11px] font-medium text-teal-800"
                    placeholder="Artista / Banda"
                  />
                  <input
                    type="text"
                    value={track.duration || ''}
                    onChange={(e) => handleUpdateTrackItem(idx, 'duration', e.target.value)}
                    className="w-14 px-1 py-1 bg-white border border-slate-200 rounded text-[10px] font-mono text-center text-slate-500"
                    placeholder="03:30"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTrack(idx)}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    title="Excluir faixa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="font-mono text-[11px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-lg border border-indigo-100/55 shrink-0">
                      {track.position || (idx + 1)}
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-800 font-semibold truncate">
                          {track.title}
                        </span>
                        {track.artist ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200 shrink-0">
                            <User className="h-2.5 w-2.5 text-teal-600" />
                            {track.artist}
                          </span>
                        ) : isVA ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                            <AlertCircle className="h-2.5 w-2.5 text-amber-500" />
                            Artista pendente
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {track.duration && (
                    <span className="font-mono text-[10px] text-slate-400 font-bold pl-2 shrink-0">
                      {track.duration}
                    </span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Track Form (When in editing mode) */}
      {isEditing && (
        <form onSubmit={handleAddTrack} className="pt-2 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center gap-1.5">
          <input
            type="text"
            placeholder="Pos"
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
            className="w-10 px-1.5 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
          />
          <input
            type="text"
            placeholder="Nome da nova música..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 min-w-[120px] px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
          />
          <input
            type="text"
            placeholder="Artista / Banda..."
            value={newArtist}
            onChange={(e) => setNewArtist(e.target.value)}
            className="w-28 px-1.5 py-1 bg-slate-50 border border-teal-200 rounded-lg text-xs font-medium text-teal-800"
          />
          <input
            type="text"
            placeholder="03:30"
            value={newDuration}
            onChange={(e) => setNewDuration(e.target.value)}
            className="w-14 px-1.5 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-500"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </form>
      )}
    </div>
  );
};


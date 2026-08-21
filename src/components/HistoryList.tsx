/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { History, Search, Trash2, ArrowRight, Disc, Music, Video, FileAudio, Download, X, Check } from 'lucide-react';
import { SavedListing } from '../types';

interface HistoryListProps {
  listings: SavedListing[];
  onSelect: (listing: SavedListing) => void;
  onDelete: (id: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  listings,
  onSelect,
  onDelete,
}) => {
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(listings, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `valdir_discos_catalog_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Erro ao exportar banco de dados:", err);
    }
  };

  const filteredListings = listings.filter((l) => {
    const query = search.toLowerCase();
    return (
      l.release.title.toLowerCase().includes(query) ||
      l.release.artist.toLowerCase().includes(query) ||
      l.release.label.toLowerCase().includes(query)
    );
  });

  const getFormatIcon = (formatName: string) => {
    const lower = formatName.toLowerCase();
    if (lower.includes('vinyl') || lower.includes('vinil') || lower.includes('lp')) {
      return <Disc className="h-4 w-4 text-indigo-600" />;
    }
    if (lower.includes('cd')) {
      return <Music className="h-4 w-4 text-rose-500" />;
    }
    if (lower.includes('dvd')) {
      return <Video className="h-4 w-4 text-rose-600" />;
    }
    return <FileAudio className="h-4 w-4 text-slate-400" />;
  };

  return (
    <div className="space-y-4" id="history-list-container">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <History className="h-5 w-5 text-indigo-600" />
        <h3 className="text-base font-bold text-slate-900">Anúncios Salvos / Histórico</h3>
        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-200">
          {listings.length}
        </span>
        {listings.length > 0 && (
          <button
            type="button"
            onClick={handleExportJSON}
            className="ml-auto text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow"
            title="Exportar todo o banco de dados como arquivo JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar Banco (.JSON)</span>
          </button>
        )}
      </div>

      {listings.length > 0 && (
        <div className="relative rounded-xl shadow-sm" id="search-history-box">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar nos salvos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      )}

      {filteredListings.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <History className="h-8 w-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
          <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed font-medium">
            {listings.length === 0 
              ? "Nenhum anúncio criado ou salvo ainda." 
              : "Nenhum anúncio corresponde à sua busca."}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {filteredListings.map((item) => {
            const formatName = item.release.formats?.[0]?.name || 'Disco';
            const formattedDate = new Date(item.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={item.id}
                className="group flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/60 border border-slate-200/60 hover:border-slate-300 rounded-2xl transition-all cursor-pointer"
                onClick={() => onSelect(item)}
              >
                {/* Cover art thumbnail */}
                <div className="relative h-10 w-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200 shadow-sm">
                  {item.customImages && item.customImages.length > 0 && item.customImages[0] && item.customImages[0].trim() !== '' ? (
                    <img
                      src={item.customImages[0]}
                      alt={item.release.title}
                      className="h-full w-full object-cover"
                    />
                  ) : item.release.coverImage && item.release.coverImage.trim() !== '' ? (
                    <img
                      src={item.release.coverImage}
                      alt={item.release.title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    getFormatIcon(formatName)
                  )}
                </div>

                {/* Album Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1 font-semibold shadow-sm">
                      {getFormatIcon(formatName)}
                      {formatName}
                    </span>
                    {item.drawer && (
                      <span className="text-[10px] bg-indigo-50/80 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1 font-semibold shadow-sm truncate max-w-[100px]" title={`Local: ${item.drawer}`}>
                        📁 {item.drawer}
                      </span>
                    )}
                    <span className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200 font-bold shadow-sm">
                      Shopee
                    </span>
                    {item.mercadolivre && (
                      <span className="text-[10px] bg-yellow-50 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-200 font-bold shadow-sm">
                        M. Livre
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono ml-auto font-medium">{formattedDate}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {item.release.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{item.release.artist}</p>
                </div>

                {/* Action buttons */}
                {confirmDeleteId === item.id ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                        setConfirmDeleteId(null);
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1"
                      title="Confirmar exclusão"
                    >
                      <Check className="h-3 w-3" />
                      <span>Confirmar</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(null);
                      }}
                      className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-all cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-600 mr-1">R$ {item.shopee.suggestedPrice.toFixed(0)}</span>
                    <button
                      type="button"
                      title="Excluir Anúncio"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(item.id);
                      }}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

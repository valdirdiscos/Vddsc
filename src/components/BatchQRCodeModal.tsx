/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  QrCode, Printer, X, Disc, Filter, CheckSquare, Square, 
  Layers, MapPin, Tag, Download, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SavedListing } from '../types';
import { formatDiscQRCodePayload, generateDiscQRCode } from '../utils/qrcode';
import { exportBatchListingsToPdf } from '../utils/pdfExport';

interface BatchQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: SavedListing[];
}

export const BatchQRCodeModal: React.FC<BatchQRCodeModalProps> = ({
  isOpen,
  onClose,
  listings
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterDrawer, setFilterDrawer] = useState<string>('all');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Extract unique drawers
  const drawers = Array.from(new Set(listings.map(l => l.drawer?.trim()).filter(Boolean))) as string[];

  // Filter listings
  const filteredListings = listings.filter(l => {
    if (filterDrawer !== 'all' && l.drawer?.trim() !== filterDrawer) return false;
    return true;
  });

  // Auto select all in filtered list initially
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(filteredListings.map(l => l.id)));
    }
  }, [isOpen, filterDrawer, listings.length]);

  // Generate QR codes for all selected listings
  useEffect(() => {
    if (!isOpen || selectedIds.size === 0) return;

    setIsGenerating(true);
    const itemsToGenerate = listings.filter(l => selectedIds.has(l.id));

    Promise.all(
      itemsToGenerate.map(async item => {
        const payload = formatDiscQRCodePayload(item, { mode: 'full' });
        const url = await generateDiscQRCode(payload, { width: 220, margin: 1 });
        return { id: item.id, url };
      })
    ).then(results => {
      const map: Record<string, string> = {};
      results.forEach(r => {
        map[r.id] = r.url;
      });
      setQrMap(map);
      setIsGenerating(false);
    });
  }, [isOpen, selectedIds]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredListings.map(l => l.id)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const handleExportPdf = async () => {
    if (selectedIds.size === 0) return;
    setIsPdfGenerating(true);
    try {
      const itemsToExport = listings
        .filter(l => selectedIds.has(l.id))
        .map(l => ({
          elementId: `batch-label-${l.id}`,
          artist: l.release.artist,
          title: l.release.title,
          barcode: l.barcode || `VD-${l.id.replace('list_', '').slice(-8)}`
        }));

      await exportBatchListingsToPdf(itemsToExport, {
        filename: `folha-etiquetas-lote-${selectedIds.size}-itens.pdf`
      });
    } catch (err) {
      console.error('Erro gerando folha PDF de etiquetas:', err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedItems = listings.filter(l => selectedIds.has(l.id));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer no-print"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col z-10 max-h-[92vh]"
        >
          {/* Top Bar */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between no-print">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-wide flex items-center gap-2">
                  Impressão em Lote de Etiquetas QR Code
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-200 font-bold px-2 py-0.5 rounded-full border border-indigo-400/20">
                    {selectedIds.size} selecionados
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">
                  Gere e imprima folhas com etiquetas de identificação para colar nas capas/envelopes
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filter & Selection Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Filtrar por Gaveta:</span>
              <select
                value={filterDrawer}
                onChange={e => setFilterDrawer(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none"
              >
                <option value="all">Todas as Gavetas ({listings.length})</option>
                {drawers.map(d => (
                  <option key={d} value={d}>Gaveta / Loc: {d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700 text-[11px] transition-all cursor-pointer shadow-sm"
              >
                Marcar Todos ({filteredListings.length})
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-500 text-[11px] transition-all cursor-pointer shadow-sm"
              >
                Desmarcar Todos
              </button>
            </div>
          </div>

          {/* Body Sheet with Sticker Grid */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/60 print:bg-white print:p-0">
            {selectedItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <QrCode className="h-10 w-10 mx-auto opacity-40" />
                <p className="text-xs font-bold">Nenhum disco selecionado para impressão.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
                {selectedItems.map(item => {
                  const qr = qrMap[item.id];
                  const drawerLoc = item.drawer?.trim() || 'SEM_LOC';
                  const price = item.pricing.basePriceBrl ? `R$ ${item.pricing.basePriceBrl.toFixed(2)}` : 'R$ 0,00';
                  const isChecked = selectedIds.has(item.id);

                  return (
                    <div
                      key={item.id}
                      id={`batch-label-${item.id}`}
                      onClick={() => toggleSelect(item.id)}
                      className={`relative bg-white border-2 rounded-2xl p-3.5 shadow-sm transition-all cursor-pointer select-none text-slate-900 ${
                        isChecked ? 'border-slate-900 ring-2 ring-indigo-500/20' : 'border-slate-200 opacity-50'
                      }`}
                    >
                      {/* Checkbox on top-right (hidden in print) */}
                      <div className="absolute top-2.5 right-2.5 z-10 no-print">
                        {isChecked ? (
                          <div className="h-5 w-5 bg-indigo-600 text-white rounded-md flex items-center justify-center">
                            <CheckSquare className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 bg-white border border-slate-300 rounded-md flex items-center justify-center text-slate-300">
                            <Square className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      {/* Label Header */}
                      <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2 pr-6 print:pr-0">
                        <div className="flex items-center gap-1">
                          <Disc className="h-3.5 w-3.5 text-slate-900" />
                          <span className="font-black text-[10px] uppercase tracking-wider">VALDIR DISCOS</span>
                        </div>
                        <span className="font-mono text-[9px] font-bold bg-slate-900 text-white px-1.5 py-0.2 rounded">
                          {item.id.replace('list_', '')}
                        </span>
                      </div>

                      {/* Label Body */}
                      <div className="flex gap-2.5 items-start">
                        {/* Album Thumbnail */}
                        {item.release.coverImage && (
                          <div className="h-16 w-16 shrink-0 border border-slate-200 rounded-lg overflow-hidden bg-slate-100">
                            <img
                              src={item.release.coverImage}
                              alt="Capa"
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="text-xs font-black text-slate-900 uppercase truncate leading-tight">
                            {item.release.artist}
                          </p>
                          <p className="text-[10px] font-bold text-slate-700 truncate leading-tight">
                            {item.release.title}
                          </p>
                          <p className="text-[9px] text-slate-500 font-medium truncate">
                            {item.release.year || 'Ano'} • {item.release.label || 'Selo'}
                          </p>
                          <div className="flex items-center gap-1 text-[8px] pt-1 font-bold">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                              {item.condition.mediaCondition}/{item.condition.sleeveCondition}
                            </span>
                            <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded font-mono">
                              LOC: {drawerLoc}
                            </span>
                          </div>
                        </div>

                        {/* QR Code */}
                        <div className="shrink-0 text-center">
                          {qr ? (
                            <img src={qr} alt="QR" className="w-16 h-16 object-contain border border-slate-300 rounded-md p-0.5" />
                          ) : (
                            <div className="w-16 h-16 bg-slate-100 animate-pulse rounded-md" />
                          )}
                        </div>
                      </div>

                      {/* Label Footer */}
                      <div className="mt-2 pt-1 border-t border-slate-150 flex items-center justify-between text-[9px]">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                          CADASTRO FÍSICO
                        </span>
                        <strong className="text-slate-900 font-black font-mono">
                          {price}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2.5 items-center justify-between no-print">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
            >
              Fechar
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={selectedIds.size === 0 || isGenerating || isPdfGenerating}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                title="Salvar todas as etiquetas selecionadas organizadas em um documento PDF A4"
              >
                <FileText className="h-4 w-4 text-indigo-300" />
                <span>{isPdfGenerating ? 'Gerando PDF...' : `Salvar Folha em PDF (${selectedIds.size})`}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={selectedIds.size === 0 || isGenerating}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                Imprimir Folha ({selectedIds.size})
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

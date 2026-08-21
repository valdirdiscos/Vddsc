/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tag, 
  Search, 
  Printer, 
  Download, 
  Trash2, 
  ShoppingBag, 
  FileText, 
  QrCode, 
  Check, 
  Plus, 
  Layers, 
  Calendar, 
  Music,
  ExternalLink,
  ChevronRight,
  Disc,
  AlertCircle
} from 'lucide-react';
import { SavedLabel, SavedListing, CartItem, LabelFormatType } from '../types';
import { exportBatchListingsToPdf, exportThermalTicketToPdf } from '../utils/pdfExport';
import { renderThermalTicketToCanvas, renderDiscLabelToCanvas } from '../utils/qrcode';

interface SavedLabelsManagerProps {
  savedLabels?: SavedLabel[];
  labels?: SavedLabel[];
  savedListings?: SavedListing[];
  listings?: SavedListing[];
  onAddToCart: (listing: SavedListing, customPrice?: number) => void;
  onOpenThermalPrint?: (listing: SavedListing, initialFormat?: LabelFormatType) => void;
  onPrintLabel?: (listing: SavedListing, initialFormat?: LabelFormatType) => void;
  onDeleteLabel: (labelId: string) => void;
  onClearAllLabels?: () => void;
  onClearAll?: () => void;
  onOpenScanner?: () => void;
}

export const SavedLabelsManager: React.FC<SavedLabelsManagerProps> = ({
  savedLabels = [],
  labels = [],
  savedListings = [],
  listings = [],
  onAddToCart,
  onOpenThermalPrint,
  onPrintLabel,
  onDeleteLabel,
  onClearAllLabels,
  onClearAll,
  onOpenScanner
}) => {
  const activeLabels = savedLabels.length > 0 ? savedLabels : labels;
  const activeListings = savedListings.length > 0 ? savedListings : listings;
  const handlePrint = onOpenThermalPrint || onPrintLabel || (() => {});
  const handleClear = onClearAllLabels || onClearAll || (() => {});

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [isExportingBatch, setIsExportingBatch] = useState(false);

  // Filter labels
  const filteredLabels = (activeLabels || []).filter((lbl) => {
    if (!lbl) return false;
    const matchesSearch = 
      (lbl.artist || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lbl.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lbl.barcode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lbl.drawer && lbl.drawer.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFormat = selectedFormat === 'all' || lbl.format === selectedFormat;

    return matchesSearch && matchesFormat;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedLabelIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLabelIds.length === filteredLabels.length) {
      setSelectedLabelIds([]);
    } else {
      setSelectedLabelIds(filteredLabels.map(l => l.id));
    }
  };

  // Find linked listing for a label
  const getListingForLabel = (lbl: SavedLabel): SavedListing | undefined => {
    if (!activeListings) return undefined;
    if (lbl.listingId) {
      const found = activeListings.find(l => l.id === lbl.listingId);
      if (found) return found;
    }
    return activeListings.find(l => 
      l.barcode === lbl.barcode || 
      (l.release?.artist && lbl.artist && l.release.artist.toLowerCase() === lbl.artist.toLowerCase() && 
       l.release?.title && lbl.title && l.release.title.toLowerCase() === lbl.title.toLowerCase())
    );
  };

  // Handle direct single label PDF download
  const handleDownloadSinglePdf = async (lbl: SavedLabel) => {
    try {
      const listing = getListingForLabel(lbl);
      if (!listing) {
        alert('Dados completos do disco não encontrados para gerar PDF.');
        return;
      }

      let dataUrl = lbl.labelImageUrl;
      if (!dataUrl) {
        if (lbl.format === 'disc-card-qr') {
          dataUrl = await renderDiscLabelToCanvas(listing, 'standard');
        } else {
          dataUrl = await renderThermalTicketToCanvas(listing, lbl.format as any);
        }
      }

      await exportThermalTicketToPdf(dataUrl, {
        format: lbl.format as any,
        copies: lbl.copies || 1,
        filename: `etiqueta-${lbl.barcode}-${(lbl.artist || '').replace(/\s+/g, '_')}.pdf`
      });
    } catch (err) {
      console.error('Erro gerando PDF da etiqueta:', err);
      alert('Erro ao gerar PDF da etiqueta.');
    }
  };

  // Handle batch export to A4 PDF
  const handleExportSelectedToA4Pdf = async () => {
    if (selectedLabelIds.length === 0) return;
    setIsExportingBatch(true);
    try {
      const itemsToExport: Array<{
        imageDataUrl?: string;
        artist: string;
        title: string;
        barcode: string;
      }> = [];

      for (const id of selectedLabelIds) {
        const lbl = activeLabels.find(l => l.id === id);
        if (!lbl) continue;

        const listing = getListingForLabel(lbl);
        let imgUrl = lbl.labelImageUrl;
        if (!imgUrl && listing) {
          imgUrl = await renderThermalTicketToCanvas(listing, 'sticker-60x40');
        }

        if (imgUrl) {
          itemsToExport.push({
            imageDataUrl: imgUrl,
            artist: lbl.artist,
            title: lbl.title,
            barcode: lbl.barcode
          });
        }
      }

      if (itemsToExport.length === 0) {
        alert('Nenhuma etiqueta válida selecionada.');
        return;
      }

      await exportBatchListingsToPdf(itemsToExport, {
        filename: `lote-etiquetas-valdir-${Date.now()}.pdf`
      });
    } catch (err) {
      console.error('Erro gerando lote em PDF:', err);
    } finally {
      setIsExportingBatch(false);
    }
  };

  // Batch Add to Cart
  const handleAddSelectedToCart = () => {
    let addedCount = 0;
    selectedLabelIds.forEach(id => {
      const lbl = activeLabels.find(l => l.id === id);
      if (lbl) {
        const listing = getListingForLabel(lbl);
        if (listing && listing.status !== 'sold') {
          onAddToCart(listing, lbl.price);
          addedCount++;
        }
      }
    });
    setSelectedLabelIds([]);
    alert(`${addedCount} discos das etiquetas selecionadas foram adicionados ao carrinho!`);
  };

  const getFormatLabel = (fmt: string) => {
    switch (fmt) {
      case 'thermal-80mm': return 'Térmica 80mm';
      case 'thermal-58mm': return 'Térmica 58mm';
      case 'sticker-60x40': return 'Adesivo 60x40mm';
      case 'sticker-50x30': return 'Adesivo 50x30mm';
      case 'disc-card-qr': return 'Card QR 960x540';
      case 'a4-sheet': return 'Folha A4';
      default: return fmt;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Tag className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              Histórico de Etiquetas Armazenadas
              <span className="text-xs bg-indigo-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full">
                {savedLabels.length} cadastradas
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Todas as etiquetas térmicas e adesivas geradas ficam salvas aqui para consulta, reimpressão e adição rápida ao carrinho.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {selectedLabelIds.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-slate-800/80 p-2 rounded-2xl border border-slate-700">
            <span className="text-xs text-indigo-300 font-bold px-2">
              {selectedLabelIds.length} selecionadas
            </span>
            <button
              onClick={handleAddSelectedToCart}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Adicionar ao Carrinho
            </button>
            <button
              disabled={isExportingBatch}
              onClick={handleExportSelectedToA4Pdf}
              className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileText className="h-3.5 w-3.5" />
              {isExportingBatch ? 'Gerando...' : 'Exportar PDF A4'}
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por artista, título, código (VD-...) ou gaveta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Format selector filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Formato:</span>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
          >
            <option value="all">Todos os Formatos</option>
            <option value="thermal-80mm">Térmica 80mm</option>
            <option value="thermal-58mm">Térmica 58mm</option>
            <option value="sticker-60x40">Adesivo 60x40mm</option>
            <option value="sticker-50x30">Adesivo 50x30mm</option>
            <option value="disc-card-qr">Card QR Code</option>
          </select>

          {savedLabels.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              {selectedLabelIds.length === filteredLabels.length ? 'Desmarcar Todos' : 'Marcar Todos'}
            </button>
          )}
        </div>
      </div>

      {/* Grid of Saved Labels */}
      {filteredLabels.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Tag className="h-8 w-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800">Nenhuma etiqueta armazenada encontrada</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {savedLabels.length === 0 
              ? 'Ao gerar e imprimir etiquetas térmicas ou QR codes para seus vinis, elas serão salvas automaticamente neste histórico permanente.'
              : 'Nenhum resultado corresponde aos filtros ou termo de busca digitado.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLabels.map((lbl) => {
            const isSelected = selectedLabelIds.includes(lbl.id);
            const linkedListing = getListingForLabel(lbl);
            const isSold = linkedListing?.status === 'sold';

            return (
              <motion.div
                key={lbl.id}
                layout
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                  isSelected ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20' : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Card Top */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(lbl.id)}
                        className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                      />
                      <span className="text-[11px] font-mono font-black bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200">
                        {lbl.barcode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {getFormatLabel(lbl.format)}
                      </span>
                      {isSold ? (
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                          Vendido
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          Disponível
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Disc Title and Artist */}
                  <div>
                    <h4 className="text-sm font-black text-slate-900 line-clamp-1">{lbl.artist}</h4>
                    <p className="text-xs font-semibold text-slate-600 line-clamp-1">{lbl.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {[lbl.year, lbl.country, lbl.label, lbl.catno].filter(Boolean).join(' • ')}
                    </p>
                  </div>

                  {/* Badges / Price */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      {lbl.drawer && (
                        <span className="font-mono text-[10px] font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                          📍 {lbl.drawer}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-slate-600">
                        {lbl.mediaCondition}/{lbl.sleeveCondition}
                      </span>
                    </div>
                    <span className="font-mono font-black text-emerald-600 text-sm">
                      R$ {Number(lbl.price).toFixed(2)}
                    </span>
                  </div>

                  {/* Date stored */}
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Criada em: {new Date(lbl.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {/* Add to Cart button */}
                    <button
                      disabled={isSold || !linkedListing}
                      onClick={() => {
                        if (linkedListing) {
                          onAddToCart(linkedListing, lbl.price);
                        }
                      }}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isSold || !linkedListing
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                      }`}
                      title="Adicionar este disco ao Carrinho de Vendas"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>{isSold ? 'Vendido' : 'Ao Carrinho'}</span>
                    </button>

                    {/* Print Label */}
                    <button
                      onClick={() => {
                        if (linkedListing) {
                          onOpenThermalPrint(linkedListing, lbl.format);
                        } else {
                          // Build fallback listing
                          const dummyListing: SavedListing = {
                            id: lbl.listingId || `list_${Date.now()}`,
                            barcode: lbl.barcode,
                            createdAt: lbl.createdAt,
                            drawer: lbl.drawer,
                            release: {
                              id: 0,
                              title: lbl.title,
                              artist: lbl.artist,
                              year: Number(lbl.year) || 0,
                              country: lbl.country,
                              label: lbl.label || '',
                              catno: lbl.catno || '',
                              genres: [],
                              styles: [],
                              tracklist: [],
                              formats: [],
                              coverImage: lbl.coverImage || ''
                            },
                            condition: {
                              mediaCondition: lbl.mediaCondition as any || 'VG+',
                              mediaDetails: '',
                              sleeveCondition: lbl.sleeveCondition as any || 'VG+',
                              sleeveDetails: ''
                            },
                            pricing: {
                              basePriceBrl: lbl.price,
                              exchangeRate: 5.6,
                              useExchange: false,
                              shopeeCommissionPercent: 14,
                              shopeeFixedFee: 4,
                              packagingCost: 3,
                              profitMarginPercent: 30,
                              directPrice: lbl.price
                            },
                            shopee: {
                              title: `${lbl.artist} - ${lbl.title}`,
                              description: '',
                              suggestedPrice: lbl.price,
                              hashtags: []
                            }
                          };
                          onOpenThermalPrint(dummyListing, lbl.format);
                        }
                      }}
                      className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg cursor-pointer transition-all"
                      title="Reimprimir etiqueta"
                    >
                      <Printer className="h-3.5 w-3.5 text-indigo-600" />
                    </button>

                    {/* Download PDF */}
                    <button
                      onClick={() => handleDownloadSinglePdf(lbl)}
                      className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg cursor-pointer transition-all"
                      title="Baixar PDF da etiqueta"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-700" />
                    </button>
                  </div>

                  {/* Delete from history */}
                  <button
                    onClick={() => onDeleteLabel(lbl.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    title="Remover do histórico"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

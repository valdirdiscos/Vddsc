/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Printer, Download, X, Check, Copy, Sliders,
  Tag, Shield, Sparkles, RefreshCw, CheckCircle, Smartphone,
  FileText, FileCheck, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SavedListing, DiscogsRelease, ConditionSelection, PricingConfig, SalesChannel, SavedLabel, LabelFormatType } from '../types';
import { formatDiscQRCodePayload, generateDiscQRCode, renderThermalTicketToCanvas, getSalesChannelMeta } from '../utils/qrcode';
import { exportThermalTicketToPdf } from '../utils/pdfExport';

interface ThermalPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id?: string;
    barcode?: string;
    release: DiscogsRelease;
    condition?: ConditionSelection;
    pricing?: PricingConfig;
    drawer?: string;
    salesChannels?: SalesChannel[];
  } | null;
  onSaveLabel?: (label: SavedLabel) => void;
  initialFormat?: LabelFormatType;
}

export const ThermalPrintModal: React.FC<ThermalPrintModalProps> = ({
  isOpen,
  onClose,
  listing,
  onSaveLabel,
  initialFormat = 'thermal-80mm'
}) => {
  const [thermalFormat, setThermalFormat] = useState<'thermal-80mm' | 'thermal-58mm' | 'sticker-50x30' | 'sticker-60x40'>(
    (initialFormat === 'thermal-58mm' || initialFormat === 'sticker-50x30' || initialFormat === 'sticker-60x40') ? initialFormat : 'thermal-80mm'
  );
  const [ticketImage, setTicketImage] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !listing) return;

    let active = true;
    const generatePreview = async () => {
      setIsGenerating(true);
      try {
        const payload = formatDiscQRCodePayload(listing, { mode: 'compact' });
        const qr = await generateDiscQRCode(payload, {
          width: 300,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        });
        if (active) setQrCodeUrl(qr);

        const canvasData = await renderThermalTicketToCanvas(listing, thermalFormat);
        if (active) setTicketImage(canvasData);
      } catch (e) {
        console.error('Erro gerando ticket térmico:', e);
      } finally {
        if (active) setIsGenerating(false);
      }
    };

    generatePreview();
    return () => { active = false; };
  }, [isOpen, listing, thermalFormat]);

  if (!isOpen || !listing) return null;

  const itemId = (listing.id || 'ITEM-NOVO').replace('list_', '');
  const barcode = listing.barcode || `VD-${itemId.slice(-8)}`;
  const artist = (listing.release.artist || 'ARTISTA').toUpperCase();
  const title = listing.release.title || 'Álbum';
  const drawer = (listing.drawer?.trim() || 'SEM_LOC').toUpperCase();
  const mediaCond = listing.condition?.mediaCondition || 'VG+';
  const sleeveCond = listing.condition?.sleeveCondition || 'VG+';
  const price = listing.pricing?.basePriceBrl ? `R$ ${listing.pricing.basePriceBrl.toFixed(2)}` : 'R$ 0,00';
  const channels = listing.salesChannels || ['physical_store', 'online_store', 'shopee', 'mercadolivre'];

  const recordSavedLabel = () => {
    if (!onSaveLabel || !listing) return;
    const labelObj: SavedLabel = {
      id: `lbl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      listingId: listing.id,
      barcode,
      artist: listing.release.artist || 'Artista Desconhecido',
      title: listing.release.title || 'Álbum',
      label: listing.release.label,
      catno: listing.release.catno,
      year: listing.release.year,
      country: listing.release.country,
      mediaCondition: listing.condition?.mediaCondition || 'VG+',
      sleeveCondition: listing.condition?.sleeveCondition || 'VG+',
      price: listing.pricing?.basePriceBrl || 0,
      drawer: listing.drawer,
      format: thermalFormat,
      copies: printCopies || 1,
      createdAt: new Date().toISOString(),
      printedAt: new Date().toISOString(),
      labelImageUrl: ticketImage || undefined
    };
    onSaveLabel(labelObj);
  };

  const handlePrint = () => {
    recordSavedLabel();
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const is58mm = thermalFormat === 'thermal-58mm';
    const isSticker = thermalFormat.startsWith('sticker-');
    const widthMm = is58mm ? '58mm' : thermalFormat === 'sticker-50x30' ? '50mm' : thermalFormat === 'sticker-60x40' ? '60mm' : '80mm';

    let copiesHtml = '';
    for (let i = 0; i < printCopies; i++) {
      copiesHtml += `
        <div class="ticket-wrapper">
          <img src="${ticketImage}" class="ticket-img" />
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impressão Térmica - ${artist} - ${barcode}</title>
          <style>
            @page {
              size: ${widthMm} auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              display: flex;
              flex-direction: column;
              align-items: center;
              font-family: monospace;
              color: #000;
            }
            .ticket-wrapper {
              width: 100%;
              max-width: ${widthMm};
              page-break-after: always;
              display: flex;
              justify-content: center;
              padding: 2mm 0;
            }
            .ticket-img {
              width: 100%;
              height: auto;
              display: block;
              image-rendering: pixelated;
            }
            @media screen {
              body {
                background: #f1f5f9;
                padding: 20px;
              }
              .ticket-wrapper {
                background: #fff;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-bottom: 20px;
              }
            }
          </style>
        </head>
        <body>
          ${copiesHtml}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPdf = async (mode: 'exact' | 'a4') => {
    if (!ticketImage) return;
    recordSavedLabel();
    setIsPdfGenerating(true);
    try {
      const safeArtist = (listing.release.artist || 'artista').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = mode === 'a4'
        ? `etiquetas-a4-${barcode}-${safeArtist}.pdf`
        : `etiqueta-termica-${barcode}-${safeArtist}.pdf`;
      
      await exportThermalTicketToPdf(ticketImage, {
        format: mode === 'a4' ? 'a4-sheet' : thermalFormat,
        copies: printCopies,
        filename
      });
    } catch (err) {
      console.error('Erro ao gerar PDF da etiqueta:', err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!ticketImage) return;
    recordSavedLabel();
    const link = document.createElement('a');
    const safeArtist = (listing.release.artist || 'artista').toLowerCase().replace(/[^a-z0-9]/g, '-');
    link.download = `etiqueta-termica-${barcode}-${safeArtist}.png`;
    link.href = ticketImage;
    link.click();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Printer className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  Impressão Térmica de Etiquetas
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
                    ESC/POS & Adesivos
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Formato de alto contraste preto & branco otimizado para bobinas e adesivos térmicos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Configuration Controls */}
            <div className="lg:col-span-5 space-y-4">
              {/* Product Card Overview */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Código do Produto</span>
                  <button
                    onClick={handleCopyCode}
                    className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-slate-800"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {barcode}
                  </button>
                </div>
                <h4 className="text-sm font-black text-slate-900 line-clamp-1">{artist}</h4>
                <p className="text-xs text-slate-600 font-medium line-clamp-1">{title}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                    GAVETA: {drawer}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    {price}
                  </span>
                </div>
              </div>

              {/* Format Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                  Modelo da Impressora / Papel Térmico:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setThermalFormat('thermal-80mm')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      thermalFormat === 'thermal-80mm'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black">Bobina 80mm</div>
                    <div className="text-[10px] text-slate-500">Padrão cupom grande</div>
                  </button>

                  <button
                    onClick={() => setThermalFormat('thermal-58mm')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      thermalFormat === 'thermal-58mm'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black">Bobina 58mm</div>
                    <div className="text-[10px] text-slate-500">Compacta 2 polegadas</div>
                  </button>

                  <button
                    onClick={() => setThermalFormat('sticker-60x40')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      thermalFormat === 'sticker-60x40'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black">Adesivo 60x40 mm</div>
                    <div className="text-[10px] text-slate-500">Etiqueta p/ vinil / capa</div>
                  </button>

                  <button
                    onClick={() => setThermalFormat('sticker-50x30')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      thermalFormat === 'sticker-50x30'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black">Adesivo 50x30 mm</div>
                    <div className="text-[10px] text-slate-500">Mini etiqueta adesiva</div>
                  </button>
                </div>
              </div>

              {/* Number of Copies */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Quantidade de Cópias:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrintCopies(Math.max(1, printCopies - 1))}
                    className="h-7 w-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm text-slate-900 w-6 text-center">{printCopies}</span>
                  <button
                    onClick={() => setPrintCopies(printCopies + 1)}
                    className="h-7 w-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Channels Status */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Canais Vinculados:</span>
                <div className="flex flex-wrap gap-1.5">
                  {channels.map(c => {
                    const meta = getSalesChannelMeta(c);
                    return (
                      <span key={c} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${meta.badgeColor}`}>
                        {meta.shortName}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handlePrint}
                  disabled={isGenerating || !ticketImage}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-200"
                >
                  <Printer className="h-5 w-5" />
                  <span>Imprimir na Impressora Térmica ({printCopies}x)</span>
                </button>

                {/* PDF Download Options */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownloadPdf('exact')}
                    disabled={isGenerating || !ticketImage || isPdfGenerating}
                    className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-100"
                    title="Baixar arquivo PDF no tamanho exato da etiqueta/bobina selecionada"
                  >
                    <FileText className="h-4 w-4 text-indigo-200" />
                    <span>{isPdfGenerating ? 'Gerando...' : 'Salvar PDF (Etiqueta)'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf('a4')}
                    disabled={isGenerating || !ticketImage || isPdfGenerating}
                    className="py-2.5 px-3 bg-indigo-900 hover:bg-indigo-950 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-200"
                    title="Baixar arquivo PDF formatado para folha A4 com grade de etiquetas"
                  >
                    <Layers className="h-4 w-4 text-indigo-300" />
                    <span>Salvar PDF (Folha A4)</span>
                  </button>
                </div>

                <button
                  onClick={handleDownload}
                  disabled={isGenerating || !ticketImage}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar Imagem PNG da Etiqueta</span>
                </button>
              </div>
            </div>

            {/* Right Column: High-Res Real Thermal Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-100/80 rounded-2xl p-6 border border-slate-200 min-h-[420px]">
              <div className="text-center mb-3">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Pré-visualização Térmica Real (Preto & Branco 1-Bit)
                </span>
              </div>

              <div className="relative max-w-sm w-full flex justify-center">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-3">
                    <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-500">Renderizando layout térmico...</span>
                  </div>
                ) : ticketImage ? (
                  <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-300 max-h-[500px] overflow-y-auto">
                    <img
                      src={ticketImage}
                      alt="Etiqueta Térmica"
                      className="w-full h-auto object-contain rounded border border-slate-200"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs">Nenhuma visualização disponível</div>
                )}
              </div>

              <p className="text-[11px] text-slate-500 text-center mt-4 max-w-md">
                💡 Esta imagem é renderizada com pixels pretos puros para garantir nitidez máxima na cabeça de impressão térmica, sem pontos acinzentados ou falhas.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, Printer, Download, Copy, Check, X, Disc, MapPin, 
  Tag, Shield, Sparkles, ExternalLink, Sliders, FileText, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SavedListing, DiscogsRelease, ConditionSelection, PricingConfig, SavedLabel } from '../types';
import { formatDiscQRCodePayload, generateDiscQRCode, renderDiscLabelToCanvas } from '../utils/qrcode';
import { exportThermalTicketToPdf, exportElementToPdf } from '../utils/pdfExport';

interface DiscQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id?: string;
    barcode?: string;
    release: DiscogsRelease;
    condition?: ConditionSelection;
    pricing?: PricingConfig;
    drawer?: string;
    createdAt?: string;
  } | null;
  onSaveLabel?: (label: SavedLabel) => void;
}

export const DiscQRCodeModal: React.FC<DiscQRCodeModalProps> = ({
  isOpen,
  onClose,
  listing,
  onSaveLabel
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrMode, setQrMode] = useState<'full' | 'compact' | 'link'>('full');
  const [labelSize, setLabelSize] = useState<'standard' | 'compact' | 'minimal'>('standard');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listing) return;

    const payload = formatDiscQRCodePayload(listing, { mode: qrMode });
    generateDiscQRCode(payload, { width: 350, margin: 1 }).then(url => {
      setQrCodeUrl(url);
    });
  }, [listing, qrMode]);

  if (!isOpen || !listing) return null;

  const payloadText = formatDiscQRCodePayload(listing, { mode: qrMode });
  const itemId = listing.id || 'ITEM-NOVO';
  const drawerLoc = listing.drawer?.trim() || 'SEM_LOC';
  const mediaGrade = listing.condition?.mediaCondition || 'VG+';
  const sleeveGrade = listing.condition?.sleeveCondition || 'VG+';
  const priceVal = listing.pricing?.basePriceBrl ? `R$ ${listing.pricing.basePriceBrl.toFixed(2)}` : 'R$ 0,00';
  const formatName = listing.release.formats?.[0]?.name || 'Vinil';

  const recordSavedLabel = (imageUrl?: string) => {
    if (!onSaveLabel || !listing) return;
    const barcode = listing.barcode || `VD-${(listing.id || 'ITEM').replace('list_', '').slice(-8)}`;
    const labelObj: SavedLabel = {
      id: `lbl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      listingId: listing.id,
      barcode,
      artist: listing.release.artist || 'Artista',
      title: listing.release.title || 'Álbum',
      label: listing.release.label,
      catno: listing.release.catno,
      year: listing.release.year,
      country: listing.release.country,
      mediaCondition: listing.condition?.mediaCondition || 'VG+',
      sleeveCondition: listing.condition?.sleeveCondition || 'VG+',
      price: listing.pricing?.basePriceBrl || 0,
      drawer: listing.drawer,
      format: 'disc-card-qr',
      copies: 1,
      createdAt: new Date().toISOString(),
      printedAt: new Date().toISOString(),
      labelImageUrl: imageUrl || qrCodeUrl || undefined
    };
    onSaveLabel(labelObj);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(payloadText);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleDownloadPdf = async () => {
    setIsPdfDownloading(true);
    try {
      const dataUrl = await renderDiscLabelToCanvas(listing, labelSize, qrCodeUrl);
      if (!dataUrl) {
        throw new Error('Falha ao renderizar etiqueta');
      }
      recordSavedLabel(dataUrl);
      const safeArtist = (listing.release.artist || 'artista').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const safeTitle = (listing.release.title || 'album').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `etiqueta-valdir-discos-${safeArtist}-${safeTitle}.pdf`;

      if (labelRef.current) {
        await exportElementToPdf(labelRef.current, {
          filename,
          pdfFormat: 'label-exact',
          pixelRatio: 3
        });
      } else {
        await exportThermalTicketToPdf(dataUrl, {
          format: 'sticker-60x40',
          filename
        });
      }
    } catch (err) {
      console.error('Erro ao exportar PDF da etiqueta:', err);
    } finally {
      setIsPdfDownloading(false);
    }
  };

  const handleDownloadLabel = async () => {
    setIsDownloading(true);
    try {
      const dataUrl = await renderDiscLabelToCanvas(listing, labelSize, qrCodeUrl);
      if (!dataUrl) {
        throw new Error('Falha ao renderizar etiqueta');
      }
      recordSavedLabel(dataUrl);
      const link = document.createElement('a');
      const safeArtist = (listing.release.artist || 'artista').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const safeTitle = (listing.release.title || 'album').toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.download = `etiqueta-valdir-discos-${safeArtist}-${safeTitle}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao gerar imagem da etiqueta:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    recordSavedLabel();
    const link = document.createElement('a');
    link.download = `qrcode-${itemId}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const handlePrint = () => {
    recordSavedLabel();
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col z-10 max-h-[92vh]"
        >
          {/* Top Bar */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-wide flex items-center gap-2">
                  QR Code de Cadastro & Identificação
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-200 font-bold px-2 py-0.5 rounded-full border border-indigo-400/20">
                    Valdir Discos
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">
                  {listing.release.artist} — {listing.release.title}
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

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* Control Bar: Mode & Size */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span className="font-bold text-slate-700">Conteúdo do QR:</span>
                <div className="inline-flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
                  <button
                    onClick={() => setQrMode('full')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      qrMode === 'full' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ficha Completa
                  </button>
                  <button
                    onClick={() => setQrMode('compact')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      qrMode === 'compact' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Compacto
                  </button>
                  <button
                    onClick={() => setQrMode('link')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      qrMode === 'link' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Link/ID
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Modelo:</span>
                <div className="inline-flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
                  <button
                    onClick={() => setLabelSize('standard')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      labelSize === 'standard' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Etiqueta Completa
                  </button>
                  <button
                    onClick={() => setLabelSize('compact')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      labelSize === 'compact' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Adesivo Gaveta
                  </button>
                  <button
                    onClick={() => setLabelSize('minimal')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      labelSize === 'minimal' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Apenas QR
                  </button>
                </div>
              </div>
            </div>

            {/* PRINTABLE LABEL CONTAINER (What gets printed / saved) */}
            <div className="flex justify-center">
              <div
                ref={labelRef}
                id="printable-disc-label"
                className={`bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-md transition-all text-slate-900 select-none ${
                  labelSize === 'standard'
                    ? 'w-full max-w-[480px]'
                    : labelSize === 'compact'
                    ? 'w-full max-w-[360px]'
                    : 'w-full max-w-[260px]'
                }`}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {/* Header of Label */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Disc className="h-4 w-4 text-slate-900 animate-spin-slow" />
                    <span className="font-black text-xs uppercase tracking-wider">VALDIR DISCOS</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    {itemId}
                  </span>
                </div>

                {labelSize === 'minimal' ? (
                  /* Minimal QR Only layout */
                  <div className="flex flex-col items-center justify-center p-2 text-center">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="QR Code" className="w-44 h-44 object-contain border border-slate-200 rounded-lg p-1" />
                    ) : (
                      <div className="w-44 h-44 bg-slate-100 animate-pulse rounded-lg" />
                    )}
                    <p className="text-xs font-black mt-2 truncate max-w-[220px]">{listing.release.artist}</p>
                    <p className="text-[10px] text-slate-600 truncate max-w-[220px]">{listing.release.title}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] font-bold">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">LOC: {drawerLoc}</span>
                      <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-mono">{priceVal}</span>
                    </div>
                  </div>
                ) : labelSize === 'compact' ? (
                  /* Compact 60x30mm layout */
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate leading-tight uppercase">
                        {listing.release.artist}
                      </p>
                      <p className="text-[11px] font-bold text-slate-700 truncate leading-tight">
                        {listing.release.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px] pt-1">
                        <span className="bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded font-mono">
                          LOC: {drawerLoc}
                        </span>
                        <span className="bg-slate-100 font-bold px-1.5 py-0.5 rounded border border-slate-300">
                          {mediaGrade}/{sleeveGrade}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-900 pt-0.5 font-mono">
                        {priceVal}
                      </p>
                    </div>

                    <div className="shrink-0 text-center">
                      {qrCodeUrl ? (
                        <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 object-contain border border-slate-300 rounded-lg p-0.5" />
                      ) : (
                        <div className="w-24 h-24 bg-slate-100 animate-pulse rounded-lg" />
                      )}
                    </div>
                  </div>
                ) : (
                  /* Standard 80x50mm Full Tag layout */
                  <div className="space-y-3">
                    <div className="flex gap-3.5 items-start">
                      {/* Album Thumbnail */}
                      {listing.release.coverImage && (
                        <div className="h-20 w-20 shrink-0 border border-slate-300 rounded-lg overflow-hidden bg-slate-100">
                          <img
                            src={listing.release.coverImage}
                            alt="Capa"
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Main Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-snug">
                          {listing.release.artist}
                        </p>
                        <p className="text-xs font-bold text-slate-700 leading-snug">
                          {listing.release.title}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {listing.release.label || 'Selo'} • {listing.release.year || 'Ano'} • {listing.release.country || 'Brasil'}
                        </p>
                        {listing.release.catno && (
                          <p className="text-[9px] font-mono text-slate-400 font-bold">
                            CAT: {listing.release.catno}
                          </p>
                        )}
                      </div>

                      {/* QR Code */}
                      <div className="shrink-0 text-center flex flex-col items-center">
                        {qrCodeUrl ? (
                          <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 object-contain border border-slate-300 rounded-lg p-0.5" />
                        ) : (
                          <div className="w-24 h-24 bg-slate-100 animate-pulse rounded-lg" />
                        )}
                        <span className="text-[7px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">
                          SCAN P/ DADOS
                        </span>
                      </div>
                    </div>

                    {/* Bottom Badges on Label */}
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="bg-slate-100 border border-slate-200 rounded-lg p-1">
                        <span className="text-[8px] text-slate-500 font-bold uppercase block">Gaveta / Loc</span>
                        <strong className="text-slate-900 font-black truncate block uppercase">{drawerLoc}</strong>
                      </div>
                      <div className="bg-slate-100 border border-slate-200 rounded-lg p-1">
                        <span className="text-[8px] text-slate-500 font-bold uppercase block">Disco / Capa</span>
                        <strong className="text-slate-900 font-black block font-mono">{mediaGrade} / {sleeveGrade}</strong>
                      </div>
                      <div className="bg-slate-900 text-white rounded-lg p-1">
                        <span className="text-[8px] text-slate-300 font-bold uppercase block">Preço de Venda</span>
                        <strong className="text-white font-black block font-mono">{priceVal}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer text */}
                <div className="text-[7px] text-slate-400 text-center font-bold uppercase mt-2 tracking-wider">
                  Valdir Discos • Catálogo e Controle de Estoque
                </div>
              </div>
            </div>

            {/* Payload preview and Raw text box */}
            <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-sans font-bold">
                <span className="flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5 text-indigo-400" />
                  Dados Codificados no QR Code ({qrMode.toUpperCase()})
                </span>
                <button
                  onClick={handleCopyPayload}
                  className="hover:text-white flex items-center gap-1 text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer"
                >
                  {copiedPayload ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedPayload ? 'Copiado!' : 'Copiar Texto'}
                </button>
              </div>
              <pre className="text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap break-all bg-slate-950 p-2.5 rounded-xl max-h-28 overflow-y-auto border border-slate-800">
                {payloadText}
              </pre>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2.5 items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
            >
              Fechar
            </button>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Baixar apenas a imagem do QR Code em PNG"
              >
                <Download className="h-3.5 w-3.5 text-indigo-600" />
                Baixar QR
              </button>

              <button
                type="button"
                onClick={handleDownloadLabel}
                disabled={isDownloading}
                className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                title="Baixar a imagem da etiqueta completa em formato PNG"
              >
                <Download className="h-3.5 w-3.5 text-slate-700" />
                {isDownloading ? 'Gerando...' : 'Etiqueta PNG'}
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isPdfDownloading}
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-100 cursor-pointer disabled:opacity-50"
                title="Salvar a etiqueta formatada como documento PDF de alta resolução"
              >
                <FileText className="h-3.5 w-3.5 text-indigo-200" />
                {isPdfDownloading ? 'Gerando PDF...' : 'Salvar como PDF'}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-slate-200 cursor-pointer"
                title="Imprimir etiqueta física na impressora padrão ou térmica"
              >
                <Printer className="h-4 w-4 text-emerald-400" />
                Imprimir
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

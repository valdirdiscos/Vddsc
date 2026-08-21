/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode, Camera, Keyboard, Search, X, Check, AlertCircle,
  ShoppingBag, ArrowRight, DollarSign, User, Shield,
  Layers, MapPin, Sparkles, RefreshCw, Smartphone, Volume2, CheckCircle2,
  Store, Globe, Zap, Flashlight, Plus, CheckCheck, Upload, Image as ImageIcon,
  Trash2, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { SavedListing, Customer, SalesChannel, CartItem } from '../types';
import { parseScannedCode, getSalesChannelMeta } from '../utils/qrcode';

interface BarcodeQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: SavedListing[];
  customers?: Customer[];
  initialCode?: string;
  cartItems?: CartItem[];
  onAddToCart?: (listing: SavedListing, customPrice?: number) => void;
  onOpenCart?: () => void;
  onUpdateListing: (listing: SavedListing) => void;
  onSelectListing?: (listing: SavedListing) => void;
  onLoadToWorkspace?: (listing: SavedListing) => void;
}

export const BarcodeQrScannerModal: React.FC<BarcodeQrScannerModalProps> = ({
  isOpen,
  onClose,
  listings,
  customers = [],
  initialCode,
  cartItems = [],
  onAddToCart,
  onOpenCart,
  onUpdateListing,
  onSelectListing,
  onLoadToWorkspace
}) => {
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | 'usb' | 'search' | 'test'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [scannedListing, setScannedListing] = useState<SavedListing | null>(null);
  const [scannedRawText, setScannedRawText] = useState<string | null>(null);
  const [notFoundQuery, setNotFoundQuery] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);

  // Auto Add to Cart on Scan Mode (Great for mobile phone scanning at store counter!)
  const [autoAddToCart, setAutoAddToCart] = useState(true);
  const [recentlyAddedBanner, setRecentlyAddedBanner] = useState<{ artist: string; title: string; price: number } | null>(null);

  // PDV Quick Single Sale State with Proof Prints
  const [isSelling, setIsSelling] = useState(false);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [saleChannel, setSaleChannel] = useState<SalesChannel>('physical_store');
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [marketplaceOrderId, setMarketplaceOrderId] = useState<string>('');
  const [salePrints, setSalePrints] = useState<string[]>([]);
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);

  // Test QR on screen
  const [testSelectedListingId, setTestSelectedListingId] = useState<string>('');
  const [testQrDataUrl, setTestQrDataUrl] = useState<string | null>(null);

  // Image Upload Decode
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageDecodeStatus, setImageDecodeStatus] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const usbInputRef = useRef<HTMLInputElement>(null);
  const lastScannedCodeRef = useRef<{ code: string; timestamp: number }>({ code: '', timestamp: 0 });

  // Handle initial code if provided from global scanner
  useEffect(() => {
    if (isOpen && initialCode) {
      findListingFromScannedText(initialCode);
    }
  }, [isOpen, initialCode]);

  // Cart stats
  const cartCount = cartItems.length;
  const cartTotal = cartItems.reduce((acc, item) => acc + item.finalPrice, 0);

  // Beep sound on scan
  const playBeep = (isSuccess = true) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio context might be restricted before interaction
    }

    // Phone vibration if on mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([70, 40, 70]);
    }
  };

  // Find listing by parsed result with exhaustive matching strategies
  const findListingFromScannedText = (text: string) => {
    const rawClean = (text || '').trim();
    if (!rawClean) return;

    // Prevent duplicated bips of identical code within 2 seconds in continuous camera mode
    const now = Date.now();
    if (lastScannedCodeRef.current.code === rawClean && now - lastScannedCodeRef.current.timestamp < 2000) {
      return;
    }
    lastScannedCodeRef.current = { code: rawClean, timestamp: now };
    setScannedRawText(rawClean);

    const parsed = parseScannedCode(rawClean);
    let found: SavedListing | undefined;

    // Strategy 1: Direct ID Match (e.g., list_1740000000000)
    if (parsed.id) {
      found = listings.find(l => 
        l.id === parsed.id || 
        l.id === `list_${parsed.id}` ||
        l.id.replace('list_', '') === parsed.id.replace('list_', '')
      );
    }

    // Strategy 2: Barcode Match (VD-XXXXXXXX, alphanumeric clean, suffix match)
    if (!found && (parsed.barcode || rawClean)) {
      const targetBarcode = (parsed.barcode || rawClean).toUpperCase();
      const targetClean = targetBarcode.replace(/[^A-Z0-9]/g, '');

      found = listings.find(l => {
        const itemBarcode = (l.barcode || `VD-${l.id.replace('list_', '').slice(-8)}`).toUpperCase();
        const itemClean = itemBarcode.replace(/[^A-Z0-9]/g, '');

        if (itemBarcode === targetBarcode || itemClean === targetClean) return true;
        if (targetClean.length >= 6 && itemClean.endsWith(targetClean)) return true;
        if (itemClean.length >= 6 && targetClean.endsWith(itemClean)) return true;
        return false;
      });
    }

    // Strategy 3: Discogs Release ID match
    if (!found && parsed.discogsId) {
      found = listings.find(l => `${l.release.id}` === parsed.discogsId);
    }

    // Strategy 4: Catalog Number match (e.g. SMAS-2653, LP-001)
    if (!found && (parsed.catno || rawClean.length >= 3)) {
      const targetCat = (parsed.catno || rawClean).toLowerCase().replace(/[\s-_/]/g, '');
      found = listings.find(l => {
        if (!l.release.catno) return false;
        const itemCat = l.release.catno.toLowerCase().replace(/[\s-_/]/g, '');
        return itemCat === targetCat || (targetCat.length >= 4 && itemCat.includes(targetCat));
      });
    }

    // Strategy 5: Check text matching inside title/artist
    if (!found && rawClean.length >= 4) {
      const q = rawClean.toLowerCase();
      found = listings.find(l => 
        l.release.title.toLowerCase().includes(q) || 
        l.release.artist.toLowerCase().includes(q)
      );
    }

    if (found) {
      playBeep(true);
      setScannedListing(found);
      setSalePrice(found.pricing?.basePriceBrl || 0);
      setNotFoundQuery(null);
      setSaleSuccessMessage(null);

      // Auto Add to Cart feature for quick POS
      if (autoAddToCart && onAddToCart) {
        if (found.status === 'sold') {
          setSaleSuccessMessage(`Atenção: Este disco já consta como VENDIDO no estoque!`);
          setTimeout(() => setSaleSuccessMessage(null), 4000);
        } else {
          onAddToCart(found);
          setRecentlyAddedBanner({
            artist: found.release.artist,
            title: found.release.title,
            price: found.pricing?.basePriceBrl || 0
          });
          setTimeout(() => {
            setRecentlyAddedBanner(null);
          }, 3500);
        }
      }
    } else {
      playBeep(false);
      setNotFoundQuery(rawClean);
      setScannedListing(null);
    }
  };

  // Handle USB scanner input
  const handleUsbSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    findListingFromScannedText(manualInput.trim());
    setManualInput('');
  };

  // Multi-pass Canvas Decoder (Standard + Binarized Contrast for thermal prints)
  const decodeCanvasWithFallback = (canvas: HTMLCanvasElement): string | null => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return null;

    // Pass 1: Standard with both inversions
    const imgData = ctx.getImageData(0, 0, width, height);
    let code = jsQR(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: 'attemptBoth'
    });
    if (code && code.data) return code.data;

    // Pass 2: High Contrast Binarization
    try {
      const binarizedData = ctx.createImageData(width, height);
      const src = imgData.data;
      const dst = binarizedData.data;

      let sumLuma = 0;
      const totalPixels = width * height;
      for (let i = 0; i < src.length; i += 4) {
        const luma = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
        sumLuma += luma;
      }
      const avgThreshold = sumLuma / totalPixels;

      for (let i = 0; i < src.length; i += 4) {
        const luma = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
        const val = luma > avgThreshold ? 255 : 0;
        dst[i] = val;
        dst[i + 1] = val;
        dst[i + 2] = val;
        dst[i + 3] = 255;
      }

      code = jsQR(dst, width, height, { inversionAttempts: 'attemptBoth' });
      if (code && code.data) return code.data;
    } catch {}

    return null;
  };

  // Process and decode uploaded / pasted image
  const processImageForQRCode = async (file: File) => {
    setIsProcessingImage(true);
    setImageDecodeStatus('Processando imagem do QR Code...');
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const decoded = decodeCanvasWithFallback(canvas);
            if (decoded) {
              setImageDecodeStatus(`QR Code decodificado com sucesso!`);
              findListingFromScannedText(decoded);
            } else {
              setImageDecodeStatus('Não foi possível identificar um QR code legível na imagem. Tente uma foto mais nítida ou mais próxima.');
            }
          }
          setIsProcessingImage(false);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setImageDecodeStatus('Erro ao ler o arquivo de imagem.');
      setIsProcessingImage(false);
    }
  };

  // Global Paste (Ctrl+V) listener for quick screenshot scan
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          setScanMode('upload');
          processImageForQRCode(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Generate interactive test QR Code
  useEffect(() => {
    const targetListing = listings.find(l => l.id === testSelectedListingId) || listings[0];
    if (targetListing) {
      const barcode = targetListing.barcode || `VD-${targetListing.id.replace('list_', '').slice(-8)}`;
      const payload = `VALDIR|${targetListing.id}|${barcode}|${targetListing.drawer || 'SEM_LOC'}|${targetListing.condition?.mediaCondition || 'VG+'}|R$ ${(targetListing.pricing?.basePriceBrl || 0).toFixed(2)}`;
      QRCode.toDataURL(payload, { width: 320, margin: 2, errorCorrectionLevel: 'M' })
        .then(url => setTestQrDataUrl(url))
        .catch(err => console.error(err));
    }
  }, [testSelectedListingId, listings]);

  // Camera Scanning Loop with native BarcodeDetector + jsQR fallback
  const startCamera = async () => {
    setCameraError(null);
    setIsTorchOn(false);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Seu navegador ou dispositivo atual não possui suporte a acesso direto à câmera.');
      setCameraActive(false);
      return;
    }

    try {
      let stream: MediaStream | null = null;
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr: any) {
        if (firstErr.name !== 'NotAllowedError' && firstErr.name !== 'PermissionDeniedError') {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } else {
          throw firstErr;
        }
      }

      if (!stream) {
        throw new Error('Não foi possível obter o fluxo de vídeo.');
      }

      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        setHasTorchSupport(Boolean(capabilities.torch));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setCameraActive(true);
        setCameraError(null);
        requestAnimationFrame(tickCamera);
      }
    } catch (err: any) {
      const errName = err?.name || '';
      const errMsg = err?.message || String(err);
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.includes('Permission denied')) {
        setCameraError('Permissão de acesso à câmera não concedida. Você pode clicar em "Tentar Novamente", fazer upload de uma foto/print ou usar a busca manual.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraError('Nenhuma câmera conectada foi encontrada.');
      } else {
        setCameraError('Não foi possível acessar a câmera. Verifique as permissões ou utilize a busca/leitor USB.');
      }
      setCameraActive(false);
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && (track as any).applyConstraints) {
      try {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setIsTorchOn(nextState);
      } catch (e) {
        console.error('Erro ao acionar lanterna:', e);
      }
    }
  };

  const toggleFacingMode = () => {
    stopCamera();
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsTorchOn(false);
  };

  // Persistent native BarcodeDetector instance if supported by browser
  const barcodeDetectorRef = useRef<any>(null);
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e', 'itf']
        });
      } catch (e) {
        console.warn('BarcodeDetector formats not fully supported, will use fallback:', e);
        try {
          barcodeDetectorRef.current = new (window as any).BarcodeDetector();
        } catch {}
      }
    }
  }, []);

  const tickCamera = async () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      let detectedCode: string | null = null;

      // 1. Try native hardware BarcodeDetector (reads 1D Barcodes + QR at 60fps)
      if (barcodeDetectorRef.current) {
        try {
          const barcodes = await barcodeDetectorRef.current.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            detectedCode = barcodes[0].rawValue;
          }
        } catch (err) {
          // Native detector error fallback
        }
      }

      // 2. jsQR multi-pass fallback for QR codes
      if (!detectedCode) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            const vWidth = video.videoWidth || 640;
            const vHeight = video.videoHeight || 480;
            const scale = Math.min(1, 800 / vWidth);
            canvas.width = Math.round(vWidth * scale);
            canvas.height = Math.round(vHeight * scale);

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            detectedCode = decodeCanvasWithFallback(canvas);
          }
        }
      }

      if (detectedCode) {
        findListingFromScannedText(detectedCode);
      }
    }

    if (scanMode === 'camera' && cameraActive) {
      animationFrameRef.current = requestAnimationFrame(tickCamera);
    }
  };

  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, scanMode, facingMode]);

  // Keep USB scanner input focused
  useEffect(() => {
    if (isOpen && scanMode === 'usb' && usbInputRef.current) {
      usbInputRef.current.focus();
    }
  }, [isOpen, scanMode, scannedListing]);

  // Handle uploading sale proof screenshot
  const handleAddSalePrint = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSalePrints(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Complete PDV Quick Single Sale with optional Marketplace Screenshot Proof
  const handleConfirmSingleSale = () => {
    if (!scannedListing) return;
    const customer = customers.find(c => c.id === selectedCustomerId);
    const updated: SavedListing = {
      ...scannedListing,
      status: 'sold',
      customerId: selectedCustomerId || undefined,
      customerName: customer ? customer.name : undefined,
      saleDetails: {
        salePrice: Number(salePrice) || scannedListing.pricing?.basePriceBrl || 0,
        platform: saleChannel,
        soldAt: new Date().toISOString(),
        netProfit: Number(salePrice) || scannedListing.pricing?.basePriceBrl || 0,
        paymentStatus: 'pago',
        paymentMethod: paymentMethod,
        marketplaceOrderId: marketplaceOrderId.trim() || undefined,
        proofScreenshots: salePrints.length > 0 ? salePrints : undefined
      }
    };

    onUpdateListing(updated);
    setScannedListing(updated);
    setIsSelling(false);
    setSalePrints([]);
    setMarketplaceOrderId('');
    setSaleSuccessMessage(`Venda de R$ ${Number(salePrice).toFixed(2)} registrada com sucesso no canal ${getSalesChannelMeta(saleChannel).name}!`);
    setTimeout(() => setSaleSuccessMessage(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-4 flex flex-col max-h-[92vh]"
        >
          {/* Top Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  Leitor de Etiquetas & PDV Celular
                  <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                    Bip & Carrinho
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Escaneie com a câmera do celular, leitor USB ou faça upload de foto/print do QR Code
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenCart && cartCount > 0 && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCart();
                  }}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>{cartCount} no Carrinho (R$ {cartTotal.toFixed(2)})</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Mode Selectors */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 flex-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setScanMode('camera')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    scanMode === 'camera'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera className="h-4 w-4 text-indigo-400" />
                  Câmera Celular
                </button>

                <button
                  type="button"
                  onClick={() => setScanMode('upload')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    scanMode === 'upload'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="h-4 w-4 text-emerald-400" />
                  Carregar / Print
                </button>

                <button
                  type="button"
                  onClick={() => setScanMode('usb')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    scanMode === 'usb'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Keyboard className="h-4 w-4 text-amber-400" />
                  Pistola USB
                </button>

                <button
                  type="button"
                  onClick={() => setScanMode('search')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    scanMode === 'search'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Search className="h-4 w-4 text-sky-400" />
                  Busca
                </button>

                <button
                  type="button"
                  onClick={() => setScanMode('test')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    scanMode === 'test'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-indigo-700 hover:text-indigo-900'
                  }`}
                  title="Testar leitor com QR code gerado na tela"
                >
                  <QrCode className="h-4 w-4" />
                  QR de Teste
                </button>
              </div>

              {/* Auto Add To Cart Toggle */}
              {onAddToCart && (
                <button
                  type="button"
                  onClick={() => setAutoAddToCart(!autoAddToCart)}
                  className={`py-2 px-3.5 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    autoAddToCart
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                  title="Ao ler uma etiqueta, adiciona o disco imediatamente ao carrinho"
                >
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${autoAddToCart ? 'bg-emerald-600 text-white' : 'bg-slate-300'}`}>
                    {autoAddToCart && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <span>Adicionar Direto ao Carrinho</span>
                </button>
              )}
            </div>

            {/* Instant Banner: Recently Added to Cart */}
            <AnimatePresence>
              {recentlyAddedBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 bg-white/20 rounded-xl">
                      <CheckCheck className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 block">
                        Adicionado ao Carrinho com Sucesso!
                      </span>
                      <p className="text-xs font-bold truncate">
                        {recentlyAddedBanner.artist} - {recentlyAddedBanner.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono font-black text-sm bg-white/20 px-2 py-0.5 rounded-lg">
                      R$ {recentlyAddedBanner.price.toFixed(2)}
                    </span>
                    {onOpenCart && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenCart();
                        }}
                        className="py-1 px-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-lg text-xs font-black cursor-pointer shadow-xs"
                      >
                        Ver Carrinho
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mode 1: Camera View */}
            {scanMode === 'camera' && (
              <div className="flex flex-col items-center justify-center p-3 bg-slate-950 rounded-3xl text-white relative overflow-hidden min-h-[300px] border border-slate-800 shadow-inner">
                {cameraError ? (
                  <div className="text-center p-6 space-y-3">
                    <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                    <p className="text-xs text-rose-300 font-bold">{cameraError}</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-500 cursor-pointer"
                      >
                        Tentar Novamente
                      </button>
                      <button
                        onClick={() => setScanMode('upload')}
                        className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
                      >
                        Carregar Foto / Print
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} className="w-full max-h-[340px] object-cover rounded-2xl" />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Camera controls toolbar */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                      {hasTorchSupport && (
                        <button
                          type="button"
                          onClick={toggleTorch}
                          className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                            isTorchOn ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-900/80 text-white border-slate-700'
                          }`}
                          title="Ligar/Desligar Lanterna"
                        >
                          <Zap className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 rounded-xl backdrop-blur-md transition-all cursor-pointer"
                        title="Alternar Câmera (Traseira/Frontal)"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Scanner Target Box Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 border-2 border-emerald-400 rounded-3xl relative shadow-[0_0_25px_rgba(52,211,153,0.35)] animate-pulse">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                          Aponte para o QR Code ou Código de Barras
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mode 2: Upload / Paste Screenshot Mode */}
            {scanMode === 'upload' && (
              <div className="p-6 bg-slate-50 border-2 border-dashed border-indigo-200 rounded-3xl text-center space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processImageForQRCode(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                  <Upload className="h-8 w-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-900">
                    Carregar Foto, Arquivo ou Colar Print (Ctrl+V)
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Tirou uma foto ou print do QR code impresso? Cole com <strong>Ctrl+V</strong> ou selecione o arquivo abaixo para decodificar instantaneamente com filtros de alto contraste.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isProcessingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-100 transition-all"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>{isProcessingImage ? 'Lendo imagem...' : 'Selecionar Imagem do QR Code'}</span>
                  </button>
                </div>

                {imageDecodeStatus && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 max-w-md mx-auto shadow-xs">
                    {imageDecodeStatus}
                  </div>
                )}
              </div>
            )}

            {/* Mode 3: USB Scanner Mode */}
            {scanMode === 'usb' && (
              <form onSubmit={handleUsbSubmit} className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Aponte o leitor de código de barras ou digite o código:</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                    ● Foco Ativo para Leitura
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    ref={usbInputRef}
                    type="text"
                    placeholder="Ex: VD-17240192, list_1724... ou código de barras"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border-2 border-indigo-500 focus:bg-white rounded-2xl text-sm font-mono font-bold text-slate-800 outline-none shadow-sm"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    Buscar
                  </button>
                </div>
              </form>
            )}

            {/* Mode 4: Search Mode */}
            {scanMode === 'search' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Digite título, artista ou gaveta para localizar:</label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: Tim Maia, Roberto Carlos, Pink Floyd, Gaveta B..."
                    value={manualInput}
                    onChange={(e) => {
                      setManualInput(e.target.value);
                      if (e.target.value.length >= 2) {
                        findListingFromScannedText(e.target.value);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-2xl text-sm font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Mode 5: Test QR Code on Screen */}
            {scanMode === 'test' && (
              <div className="p-6 bg-slate-900 text-white rounded-3xl border border-indigo-900/60 flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-white rounded-2xl shadow-xl flex-shrink-0 flex items-center justify-center">
                  {testQrDataUrl ? (
                    <img src={testQrDataUrl} alt="QR Code de Teste" className="w-52 h-52 object-contain" />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">Gerando QR...</div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Ambiente de Calibração</span>
                    <h4 className="text-lg font-black text-white">QR Code de Teste na Tela</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Aponte a câmera do seu celular para este QR code exibido na tela ou use um leitor de código de barras USB para validar que a leitura e cadastro funcionam 100%.
                    </p>
                  </div>

                  {listings.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Escolher Disco para Gerar QR:</label>
                      <select
                        value={testSelectedListingId || listings[0]?.id}
                        onChange={(e) => setTestSelectedListingId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                      >
                        {listings.map(l => (
                          <option key={l.id} value={l.id}>
                            {l.release.artist} - {l.release.title} ({l.drawer || 'Sem Gaveta'} • R$ {(l.pricing?.basePriceBrl || 0).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const target = listings.find(l => l.id === testSelectedListingId) || listings[0];
                      if (target) {
                        const barcode = target.barcode || `VD-${target.id.replace('list_', '').slice(-8)}`;
                        findListingFromScannedText(`VALDIR|${target.id}|${barcode}|${target.drawer || 'SEM_LOC'}`);
                      }
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Check className="h-4 w-4" />
                    <span>Simular Leitura deste QR</span>
                  </button>
                </div>
              </div>
            )}

            {/* Notification of not found with Raw Text Display */}
            {notFoundQuery && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-bold text-slate-900">Leitor detectou um código:</span>
                  </div>
                  <button
                    onClick={() => setNotFoundQuery(null)}
                    className="text-amber-800 font-bold hover:underline cursor-pointer"
                  >
                    Limpar
                  </button>
                </div>

                <div className="p-2.5 bg-white border border-amber-200 rounded-xl font-mono text-xs text-slate-800 break-all select-all">
                  {notFoundQuery}
                </div>
                <p className="text-[11px] text-amber-800">
                  O código foi lido com sucesso pela câmera/scanner, mas não corresponde a nenhum disco salvo no estoque no momento.
                </p>
              </div>
            )}

            {/* Sale Success Notification */}
            {saleSuccessMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>{saleSuccessMessage}</span>
              </div>
            )}

            {/* Scanned Disc Result Card */}
            {scannedListing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 space-y-4"
              >
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {/* Album Cover */}
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-800 flex-shrink-0 border-2 border-slate-700 relative">
                    <img
                      src={scannedListing.customImages?.[0] || scannedListing.release.coverImage || 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=300'}
                      alt={scannedListing.release.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {scannedListing.status === 'sold' && (
                      <div className="absolute inset-0 bg-rose-950/85 flex items-center justify-center text-xs font-black text-white uppercase tracking-wider">
                        Vendido
                      </div>
                    )}
                  </div>

                  {/* Album Info */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-black bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-lg border border-indigo-500/30">
                        {scannedListing.barcode || `VD-${scannedListing.id.replace('list_', '').slice(-8)}`}
                      </span>
                      <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                        📍 GAVETA: {scannedListing.drawer || 'SEM GAVETA'}
                      </span>
                      <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                        R$ {(scannedListing.pricing?.basePriceBrl || 0).toFixed(2)}
                      </span>
                      {scannedListing.status === 'sold' ? (
                        <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md">
                          Vendido em {scannedListing.saleDetails?.soldAt ? new Date(scannedListing.saleDetails.soldAt).toLocaleDateString('pt-BR') : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md">
                          Disponível
                        </span>
                      )}
                    </div>

                    <h4 className="text-base sm:text-lg font-black text-white truncate">{scannedListing.release.artist}</h4>
                    <p className="text-xs sm:text-sm font-semibold text-slate-300 truncate">{scannedListing.release.title}</p>
                    <p className="text-xs text-slate-400">
                      {[scannedListing.release.year, scannedListing.release.country, scannedListing.release.label, scannedListing.release.catno].filter(Boolean).join(' • ')}
                    </p>

                    {/* Condition Badges */}
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700">
                        Mídia: <strong className="text-emerald-400">{scannedListing.condition?.mediaCondition || 'VG+'}</strong>
                      </span>
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700">
                        Capa: <strong className="text-indigo-400">{scannedListing.condition?.sleeveCondition || 'VG+'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                  {onAddToCart && scannedListing.status !== 'sold' && (
                    <button
                      onClick={() => onAddToCart(scannedListing)}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950 transition-all"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>+ Adicionar ao Carrinho</span>
                    </button>
                  )}

                  {scannedListing.status !== 'sold' && (
                    <button
                      onClick={() => setIsSelling(!isSelling)}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      <span>Venda Imediata</span>
                    </button>
                  )}

                  {onLoadToWorkspace && (
                    <button
                      onClick={() => {
                        onLoadToWorkspace(scannedListing);
                        onClose();
                      }}
                      className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Sparkles className="h-4 w-4 text-indigo-200" />
                      <span>Abrir Cadastro</span>
                    </button>
                  )}
                </div>

                {/* PDV Quick Single Checkout Drawer with Marketplace Print Attachment */}
                {isSelling && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/40 space-y-4 pt-4"
                  >
                    <h5 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" />
                      Registrar Venda & Guardar Print do Marketplace
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Valor (R$)</label>
                        <input
                          type="number"
                          step="0.50"
                          value={salePrice}
                          onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Canal de Venda</label>
                        <select
                          value={saleChannel}
                          onChange={(e) => setSaleChannel(e.target.value as SalesChannel)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                        >
                          <option value="physical_store">Loja Física (Balcão)</option>
                          <option value="online_store">Loja Online Própria</option>
                          <option value="shopee">Shopee</option>
                          <option value="mercadolivre">Mercado Livre</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Pagamento</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                        >
                          <option value="PIX">PIX</option>
                          <option value="Dinheiro">Dinheiro</option>
                          <option value="Cartao_Debito">Cartão de Débito</option>
                          <option value="Cartao_Credito">Cartão de Crédito</option>
                          <option value="Shopee">Saldo Shopee</option>
                          <option value="MercadoLivre">Saldo Mercado Livre</option>
                        </select>
                      </div>
                    </div>

                    {/* Marketplace Order Code & Proof Print attachment */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">
                            Código do Pedido Marketplace (Opcional):
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 240820ABCD123, #1004..."
                            value={marketplaceOrderId}
                            onChange={(e) => setMarketplaceOrderId(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                            <span>Anexar Print da Venda / Comprovante:</span>
                            <span className="text-[9px] text-indigo-400 font-normal">Shopee / ML / Pix</span>
                          </label>
                          <label className="w-full px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-dashed border-indigo-500/50 rounded-xl text-xs text-indigo-300 font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
                            <Upload className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Anexar Imagem / Print</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAddSalePrint}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Display attached prints */}
                      {salePrints.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {salePrints.map((printUrl, idx) => (
                            <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 group">
                              <img src={printUrl} alt={`Print ${idx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setSalePrints(salePrints.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-90 hover:opacity-100 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleConfirmSingleSale}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950 transition-all"
                    >
                      <Check className="h-4 w-4" />
                      <span>Confirmar Venda Avulsa & Dar Baixa</span>
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          {/* Persistent Footer Cart Summary Bar */}
          {cartCount > 0 && onOpenCart && (
            <div className="p-3 sm:p-4 bg-emerald-950 text-white border-t border-emerald-800/60 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-black">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-300 uppercase tracking-wider block">
                    {cartCount} {cartCount === 1 ? 'disco adicionado' : 'discos adicionados'}
                  </span>
                  <span className="text-sm sm:text-base font-mono font-black text-white">
                    Total: R$ {cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenCart();
                }}
                className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <span>Ver Carrinho / Finalizar</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

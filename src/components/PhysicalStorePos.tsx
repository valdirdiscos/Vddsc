/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store,
  Scan,
  Camera,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Check,
  User,
  CreditCard,
  QrCode,
  Printer,
  FileText,
  X,
  Tag,
  Percent,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Search,
  Zap,
  Clock,
  TrendingUp,
  DollarSign,
  Share2,
  MessageCircle,
  Copy,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Layers,
  MapPin,
  Volume2,
  VolumeX,
  Flashlight,
  Smartphone,
  CheckCheck,
  Eye,
  RefreshCw,
  PlusCircle,
  UserPlus,
  PhoneCall,
  ArrowRight,
  Calculator,
  Banknote,
  Sparkle,
  History,
  Grid,
  ChevronRight,
  ShieldCheck,
  CornerDownLeft,
  ArrowUpRight
} from 'lucide-react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { SavedListing, Customer, PhysicalSaleOrder, CartItem } from '../types';
import { parseScannedCode } from '../utils/qrcode';
import { exportSaleReceiptToPdf } from '../utils/pdfExport';

interface PhysicalStorePosProps {
  listings: SavedListing[];
  customers: Customer[];
  cartItems: CartItem[];
  salesOrders?: PhysicalSaleOrder[];
  onAddToCart: (listing: SavedListing, customPrice?: number) => void;
  onRemoveFromCart: (itemId: string) => void;
  onUpdateCartDiscount: (itemId: string, discount: number) => void;
  onClearCart: () => void;
  onCompleteSale: (order: PhysicalSaleOrder) => Promise<void>;
  onRefundSale?: (orderId: string) => Promise<void>;
  onAddCustomer: (customer: Customer) => Promise<void>;
  onOpenThermalPrint?: (listing: SavedListing) => void;
  onSelectListing?: (listing: SavedListing) => void;
}

export const PhysicalStorePos: React.FC<PhysicalStorePosProps> = ({
  listings,
  customers,
  cartItems,
  salesOrders = [],
  onAddToCart,
  onRemoveFromCart,
  onUpdateCartDiscount,
  onClearCart,
  onCompleteSale,
  onRefundSale,
  onAddCustomer,
  onOpenThermalPrint,
  onSelectListing
}) => {
  // Main PDV state: 'idle' (cashier idle/summary) | 'sale' (active selling terminal) | 'history' (sales ledger)
  const [posMode, setPosMode] = useState<'idle' | 'sale' | 'history'>(() => {
    return cartItems.length > 0 ? 'sale' : 'idle';
  });

  // Keep in sync if cart has items
  useEffect(() => {
    if (cartItems.length > 0 && posMode === 'idle') {
      setPosMode('sale');
    }
  }, [cartItems.length]);

  // Terminal Sub-mode: 'camera' (live camera QR reader) | 'catalog' (visual grid of records) | 'drawers' (records by drawer)
  const [terminalView, setTerminalView] = useState<'camera' | 'catalog' | 'drawers'>('camera');

  // Scanner & Camera States
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorchSupport, setHasTorchSupport] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [recentlyScannedFeedback, setRecentlyScannedFeedback] = useState<{
    artist: string;
    title: string;
    price: number;
    barcode: string;
    drawer?: string;
    isDuplicate?: boolean;
  } | null>(null);

  // Manual Inputs
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [selectedDrawerFilter, setSelectedDrawerFilter] = useState<string>('all');

  // Checkout Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Dinheiro' | 'Cartao_Debito' | 'Cartao_Credito' | 'Parcelado' | 'Shopee' | 'MercadoLivre' | 'Outro'>('PIX');
  const [installments, setInstallments] = useState<number>(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [generalDiscount, setGeneralDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [marketplaceOrderId, setMarketplaceOrderId] = useState<string>('');
  const [proofScreenshots, setProofScreenshots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<PhysicalSaleOrder | null>(null);
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string | null>(null);
  const [copiedPixKey, setCopiedPixKey] = useState<boolean>(false);

  // Quick Customer Modal
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustCity, setNewCustCity] = useState<string>('');
  const [isSavingCustomer, setIsSavingCustomer] = useState<boolean>(false);

  // Receipt Preview / Modal
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<PhysicalSaleOrder | null>(null);

  // Search input ref to focus with F3
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Video and Canvas Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScannedCodeRef = useRef<{ code: string; timestamp: number }>({ code: '', timestamp: 0 });

  // Sound generator
  const playBeep = (isSuccess = true) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Audio autoplay blocked
    }
  };

  // Keyboard Shortcuts (Standard POS: F2 Nova Venda, F3 Buscar, F4 Pagamento, ESC Cancelar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Start sale / New Sale
      if (e.key === 'F2') {
        e.preventDefault();
        setPosMode('sale');
        if (completedOrder) {
          handleResetForNextCustomer();
        }
        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 100);
      }
      // F3: Focus Search
      if (e.key === 'F3') {
        e.preventDefault();
        setTerminalView('catalog');
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
      // F4: Open Payment if items exist
      if (e.key === 'F4') {
        e.preventDefault();
        if (cartItems.length > 0 && !isPaymentModalOpen) {
          setIsPaymentModalOpen(true);
        }
      }
      // ESC: Close modals or go back
      if (e.key === 'Escape') {
        if (isPaymentModalOpen) {
          setIsPaymentModalOpen(false);
        } else if (isNewCustomerModalOpen) {
          setIsNewCustomerModalOpen(false);
        } else if (viewingReceiptOrder) {
          setViewingReceiptOrder(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length, isPaymentModalOpen, isNewCustomerModalOpen, viewingReceiptOrder, completedOrder]);

  // Available drawers
  const availableDrawers = useMemo(() => {
    const set = new Set<string>();
    listings.forEach(l => {
      if (l.drawer && l.drawer.trim()) {
        set.add(l.drawer.trim());
      }
    });
    return Array.from(set).sort();
  }, [listings]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.originalPrice, 0);
  }, [cartItems]);

  const itemDiscountsTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.discount || 0), 0);
  }, [cartItems]);

  const totalDiscount = useMemo(() => {
    return itemDiscountsTotal + Number(generalDiscount || 0);
  }, [itemDiscountsTotal, generalDiscount]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - totalDiscount);
  }, [subtotal, totalDiscount]);

  const cashAmountNum = parseFloat(cashReceived) || 0;
  const changeAmount = paymentMethod === 'Dinheiro' && cashAmountNum > totalAmount ? cashAmountNum - totalAmount : 0;

  // Selected customer
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Today's Sales Metrics
  const todayMetrics = useMemo(() => {
    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];

    const todayOrders = salesOrders.filter(order => {
      return order.soldAt && order.soldAt.startsWith(todayDateStr);
    });

    const totalRevenue = todayOrders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);
    const totalDiscs = todayOrders.reduce((sum, ord) => sum + (ord.items?.length || 0), 0);
    const totalTransactions = todayOrders.length;
    const avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      todayOrders,
      totalRevenue,
      totalDiscs,
      totalTransactions,
      avgTicket
    };
  }, [salesOrders]);

  // Generate PIX QR Code
  useEffect(() => {
    if (paymentMethod === 'PIX' && totalAmount > 0 && isPaymentModalOpen) {
      const pixKey = 'valdirdiscos@gmail.com';
      const pixPayload = `PIX|VALDIR DISCOS|CHAVE:${pixKey}|VALOR:R$${totalAmount.toFixed(2)}|REF:PDV_LOJA`;

      QRCode.toDataURL(pixPayload, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then(url => {
        setPixQrDataUrl(url);
      }).catch(err => {
        console.error('Erro gerando QR Code Pix:', err);
      });
    } else {
      setPixQrDataUrl(null);
    }
  }, [paymentMethod, totalAmount, isPaymentModalOpen]);

  // Process Scanned Barcode / QR Code
  const handleProcessScannedCode = (rawText: string): boolean => {
    if (!rawText || !rawText.trim()) return false;
    const clean = rawText.trim();

    // Debounce
    const now = Date.now();
    if (lastScannedCodeRef.current.code === clean && now - lastScannedCodeRef.current.timestamp < 1600) {
      return false;
    }
    lastScannedCodeRef.current = { code: clean, timestamp: now };

    const parsed = parseScannedCode(clean);

    let matched: SavedListing | undefined;

    // 1. Match by exact ID
    if (parsed.id) {
      matched = listings.find(l => l.id === parsed.id);
    }

    // 2. Match by Barcode
    if (!matched && parsed.barcode) {
      const cleanBc = parsed.barcode.toUpperCase();
      matched = listings.find(l => {
        const itemBc = (l.barcode || '').toUpperCase();
        return itemBc === cleanBc || itemBc.includes(cleanBc) || cleanBc.includes(itemBc);
      });
    }

    // 3. Match by Discogs Release ID
    if (!matched && parsed.discogsId) {
      matched = listings.find(l => String(l.release.id) === parsed.discogsId);
    }

    // 4. Match by Raw text substring
    if (!matched) {
      const queryLower = clean.toLowerCase();
      matched = listings.find(l => {
        const idMatch = l.id.toLowerCase() === queryLower;
        const bcMatch = l.barcode && l.barcode.toLowerCase().includes(queryLower);
        const titleMatch = l.release.title.toLowerCase().includes(queryLower);
        const artistMatch = l.release.artist.toLowerCase().includes(queryLower);
        return idMatch || bcMatch || (titleMatch && artistMatch);
      });
    }

    if (matched) {
      // If idle, switch to sale mode automatically
      if (posMode !== 'sale') {
        setPosMode('sale');
      }

      const alreadyInCart = cartItems.some(item => item.listingId === matched!.id);
      if (alreadyInCart) {
        playBeep(true);
        setRecentlyScannedFeedback({
          artist: matched.release.artist,
          title: matched.release.title,
          price: matched.pricing?.basePriceBrl || 0,
          barcode: matched.barcode || matched.id,
          drawer: matched.drawer,
          isDuplicate: true
        });
        return true;
      }

      onAddToCart(matched);
      playBeep(true);
      setRecentlyScannedFeedback({
        artist: matched.release.artist,
        title: matched.release.title,
        price: matched.pricing?.basePriceBrl || 0,
        barcode: matched.barcode || matched.id,
        drawer: matched.drawer,
        isDuplicate: false
      });

      setTimeout(() => {
        setRecentlyScannedFeedback(null);
      }, 3500);

      return true;
    } else {
      playBeep(false);
      return false;
    }
  };

  // Camera Management
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Seu navegador não possui suporte a acesso direto à webcam. Use a busca no acervo ou leitor USB.');
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
        // If advanced constraint failed (e.g. OverconstrainedError or specific resolution), fallback to generic video
        if (firstErr.name !== 'NotAllowedError' && firstErr.name !== 'PermissionDeniedError') {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } else {
          throw firstErr;
        }
      }

      if (!stream) {
        throw new Error('Não foi possível obter o fluxo de vídeo da câmera.');
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        setCameraError(null);

        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
          if (capabilities.torch) {
            setHasTorchSupport(true);
          }
        }

        scanVideoFrame();
      }
    } catch (err: any) {
      const errName = err?.name || '';
      const errMsg = err?.message || String(err);
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.includes('Permission denied')) {
        setCameraError('Permissão de acesso à câmera não concedida. Clique em "Ativar Câmera" para permitir ou utilize a busca manual / leitor USB.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraError('Nenhuma câmera foi detectada neste dispositivo. Utilize o leitor USB ou a busca de discos.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setCameraError('A câmera parece estar em uso por outro aplicativo ou aba.');
      } else {
        setCameraError('Não foi possível inicializar a câmera. Utilize a busca no acervo ou o leitor de código de barras USB.');
      }
      setCameraActive(false);
    }
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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: !isTorchOn }]
        });
        setIsTorchOn(!isTorchOn);
      } catch (err) {
        console.error('Erro ao acionar lanterna:', err);
      }
    }
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      let code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (!code) {
        code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'onlyInvert'
        });
      }

      if (!code) {
        const data = imageData.data;
        const len = data.length;
        for (let i = 0; i < len; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const val = gray > 120 ? 255 : 0;
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }
        code = jsQR(data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });
      }

      if (code && code.data) {
        handleProcessScannedCode(code.data);
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  useEffect(() => {
    if (posMode === 'sale' && terminalView === 'camera' && cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [posMode, terminalView, facingMode]);

  // Handle Manual Input Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const success = handleProcessScannedCode(barcodeInput);
    if (success) {
      setBarcodeInput('');
    } else {
      setCatalogSearch(barcodeInput.trim());
      setTerminalView('catalog');
    }
  };

  // Quick Customer Creation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    setIsSavingCustomer(true);
    try {
      const newCust: Customer = {
        id: `cust_${Date.now()}`,
        name: newCustName.trim(),
        phone: newCustPhone.trim() || undefined,
        city: newCustCity.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      await onAddCustomer(newCust);
      setSelectedCustomerId(newCust.id);
      setIsNewCustomerModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustCity('');
    } catch (err) {
      console.error('Erro ao cadastrar cliente:', err);
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Finalize Sale
  const handleFinalizeSale = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const now = new Date();
      const orderId = `ord_${Date.now()}`;
      const orderNumber = `VD-PED-${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      const order: PhysicalSaleOrder = {
        id: orderId,
        orderNumber,
        items: cartItems.map(item => ({
          listingId: item.listingId,
          barcode: item.barcode,
          artist: item.artist,
          title: item.title,
          originalPrice: item.originalPrice,
          discount: item.discount,
          finalPrice: item.finalPrice,
          drawer: item.drawer,
          condition: `${item.mediaCondition}/${item.sleeveCondition}`,
          coverImage: item.coverImage
        })),
        subtotal,
        totalDiscount,
        totalAmount,
        customerId: selectedCustomerId || undefined,
        customerName: selectedCustomer ? selectedCustomer.name : 'Cliente Avulso (Balcão)',
        customerPhone: selectedCustomer?.phone,
        paymentMethod: paymentMethod === 'Parcelado' ? `Cartão Crédito (${installments}x)` as any : paymentMethod,
        amountPaid: paymentMethod === 'Dinheiro' ? cashAmountNum : totalAmount,
        changeAmount: changeAmount > 0 ? changeAmount : undefined,
        notes: notes.trim() || undefined,
        channel: 'physical_store',
        marketplaceOrderId: marketplaceOrderId.trim() || undefined,
        proofScreenshots: proofScreenshots.length > 0 ? proofScreenshots : undefined,
        soldAt: now.toISOString()
      };

      await onCompleteSale(order);
      playBeep(true);
      setIsPaymentModalOpen(false);
      setCompletedOrder(order);
    } catch (err) {
      console.error('Erro ao finalizar venda no PDV:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset for next customer
  const handleResetForNextCustomer = () => {
    setCompletedOrder(null);
    setProofScreenshots([]);
    setMarketplaceOrderId('');
    setNotes('');
    setCashReceived('');
    setGeneralDiscount(0);
    setSelectedCustomerId('');
    onClearCart();
    setPosMode('sale');
    setTerminalView('camera');
  };

  // WhatsApp Receipt
  const handleSendWhatsAppReceipt = (order: PhysicalSaleOrder) => {
    const phone = order.customerPhone ? order.customerPhone.replace(/\D/g, '') : '';
    const itemsList = order.items.map((it, idx) => `• ${it.artist} - ${it.title} (R$ ${it.finalPrice.toFixed(2)})`).join('\n');
    
    const message = [
      `*VALDIR DISCOS • COMPROVANTE DE COMPRA* 🎵`,
      `Pedido: *${order.orderNumber}*`,
      `Data: ${new Date(order.soldAt).toLocaleString('pt-BR')}`,
      `Cliente: ${order.customerName}`,
      `---------------------------------`,
      `*Discos Adquiridos:*`,
      itemsList,
      `---------------------------------`,
      order.totalDiscount > 0 ? `Desconto: R$ ${order.totalDiscount.toFixed(2)}` : null,
      `*TOTAL PAGO: R$ ${order.totalAmount.toFixed(2)}*`,
      `Forma de Pagamento: ${order.paymentMethod}`,
      `---------------------------------`,
      `Muito obrigado pela preferência! Viva o Vinil! 🖤🎶`
    ].filter(Boolean).join('\n');

    const encodedMsg = encodeURIComponent(message);
    const waUrl = phone
      ? `https://wa.me/55${phone}?text=${encodedMsg}`
      : `https://wa.me/?text=${encodedMsg}`;
    
    window.open(waUrl, '_blank');
  };

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return listings.filter(l => {
      if (selectedDrawerFilter !== 'all' && l.drawer !== selectedDrawerFilter) {
        return false;
      }
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        const artist = l.release.artist.toLowerCase();
        const title = l.release.title.toLowerCase();
        const barcode = (l.barcode || '').toLowerCase();
        const drawer = (l.drawer || '').toLowerCase();
        const catno = (l.release.catno || '').toLowerCase();
        return artist.includes(q) || title.includes(q) || barcode.includes(q) || drawer.includes(q) || catno.includes(q);
      }
      return true;
    });
  }, [listings, selectedDrawerFilter, catalogSearch]);

  return (
    <div className="space-y-5" id="pos-root-container">
      {/* Top Cashier Bar - Retail Standard */}
      <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-3 bg-emerald-500 text-slate-950 rounded-2xl shadow-lg shadow-emerald-500/20 font-black flex items-center justify-center">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                VALDIR DISCOS • FRENTE DE CAIXA (PDV)
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${
                posMode === 'sale'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              }`}>
                <span className={`h-2 w-2 rounded-full ${posMode === 'sale' ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400'}`} />
                {posMode === 'sale' ? 'Venda em Andamento' : 'Caixa Aberto'}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Operador: <strong>Valdir</strong></span>
              <span>•</span>
              <span className="text-slate-300">Atalhos: <strong>F2</strong> (Vender), <strong>F3</strong> (Buscar), <strong>F4</strong> (Pagar)</span>
            </p>
          </div>
        </div>

        {/* Live Metrics Pill & Master "VENDER" Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          {/* Quick Metrics */}
          <div className="bg-slate-800/80 border border-slate-700 px-3.5 py-2 rounded-2xl flex items-center gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Caixa Hoje</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                R$ {todayMetrics.totalRevenue.toFixed(2)}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Vendas</span>
              <span className="text-sm font-black text-white font-mono">
                {todayMetrics.totalTransactions} ({todayMetrics.totalDiscs} un)
              </span>
            </div>
          </div>

          {/* Master "VENDER / NOVA VENDA" Button */}
          {posMode !== 'sale' ? (
            <button
              type="button"
              id="btn-iniciar-venda-master"
              onClick={() => {
                setPosMode('sale');
                setTimeout(() => barcodeInputRef.current?.focus(), 150);
              }}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-sm flex items-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Zap className="h-5 w-5 fill-slate-950" />
              <span>VENDER (F2)</span>
              <span className="bg-slate-950/20 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                Iniciar Atendimento
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPosMode('history')}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <History className="h-4 w-4" />
                <span>Histórico ({todayMetrics.todayOrders.length})</span>
              </button>

              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all animate-pulse"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>PAGAR (F4) • R$ {totalAmount.toFixed(2)}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* STATE 1: IDLE SCREEN (When no sale is currently active) */}
      {posMode === 'idle' && (
        <div className="space-y-6">
          {/* Big Retail Launchpad Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-indigo-800/40 shadow-2xl relative overflow-hidden text-center">
            {/* Background graphic */}
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
              <QrCode className="w-96 h-96" />
            </div>

            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
              <div className="w-20 h-20 bg-emerald-500 text-slate-950 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <Scan className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Pronto para o Próximo Atendimento
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Bipe o QR Code ou código de barras da etiqueta térmica de qualquer disco, ou clique no botão abaixo para abrir a tela de vendas.
                </p>
              </div>

              {/* Big Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  id="btn-iniciar-venda-hero"
                  onClick={() => {
                    setPosMode('sale');
                    setTerminalView('camera');
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Zap className="h-6 w-6 fill-slate-950" />
                  <span>INICIAR VENDA (F2)</span>
                  <ArrowRight className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPosMode('sale');
                    setTerminalView('catalog');
                  }}
                  className="w-full sm:w-auto px-6 py-4 bg-slate-800/90 hover:bg-slate-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-colors"
                >
                  <Search className="h-5 w-5 text-indigo-400" />
                  <span>Consultar Acervo / Gavetas (F3)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPosMode('history')}
                  className="w-full sm:w-auto px-6 py-4 bg-slate-800/90 hover:bg-slate-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-colors"
                >
                  <History className="h-5 w-5 text-amber-400" />
                  <span>Ver Vendas de Hoje</span>
                </button>
              </div>

              {/* Instant Barcode scanner wedge even while idle */}
              <div className="pt-4 max-w-md mx-auto">
                <form onSubmit={handleManualSubmit} className="relative">
                  <Scan className="h-4 w-4 text-emerald-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    ref={barcodeInputRef}
                    placeholder="Ou bipe com leitor USB aqui para abrir venda instantânea..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-700 rounded-2xl text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </form>
              </div>
            </div>
          </div>

          {/* Quick Summary of Today's Sales */}
          {todayMetrics.todayOrders.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  <h4 className="text-base font-black text-slate-900">
                    Últimos Atendimentos Realizados Hoje
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setPosMode('history')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  Ver todas as {todayMetrics.todayOrders.length} vendas <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {todayMetrics.todayOrders.slice(0, 3).map(order => (
                  <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-mono font-bold text-slate-800">{order.orderNumber}</span>
                        <span>{new Date(order.soldAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1 truncate">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.items.length} {order.items.length === 1 ? 'disco' : 'discos'} • {order.paymentMethod}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-base font-black font-mono text-emerald-600">
                        R$ {order.totalAmount.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewingReceiptOrder(order)}
                        className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>Recibo</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 2: ACTIVE SELLING TERMINAL (The Standard PDV / Caixa Screen) */}
      {posMode === 'sale' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 7 COLUMNS: Disc Entry, QR Code Camera, Search & Catalog Grid */}
          <div className="lg:col-span-7 space-y-4">
            {/* Multi-mode Input Bar (Scanner + Search + Fast Tabs) */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
              {/* Tabs: Camera | Catalog | Drawers */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTerminalView('camera')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                      terminalView === 'camera'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Camera className="h-4 w-4 text-emerald-400" />
                    <span>Câmera QR / Código</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTerminalView('catalog')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                      terminalView === 'catalog'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Grid className="h-4 w-4 text-indigo-400" />
                    <span>Catálogo / Acervo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTerminalView('drawers')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                      terminalView === 'drawers'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="h-4 w-4 text-amber-400" />
                    <span>Por Gaveta</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-2 rounded-xl text-xs cursor-pointer ${
                      soundEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}
                    title={soundEnabled ? 'Som de bip ligado' : 'Som de bip desligado'}
                  >
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Fast Barcode / Search form */}
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Scan className="h-4 w-4 text-indigo-600 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    ref={barcodeInputRef}
                    placeholder="Bipe com pistola USB ou digite código do vinil (Ex: VD-249504)..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Inserir</span>
                </button>
              </form>

              {/* Scanned Notification Banner */}
              <AnimatePresence>
                {recentlyScannedFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold ${
                      recentlyScannedFeedback.isDuplicate
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-900'
                        : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`p-1.5 rounded-lg text-white ${recentlyScannedFeedback.isDuplicate ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                        <Check className="h-4 w-4" />
                      </div>
                      <span className="truncate">
                        <strong>{recentlyScannedFeedback.artist} - {recentlyScannedFeedback.title}</strong>
                        {recentlyScannedFeedback.drawer ? ` (📍 Gaveta: ${recentlyScannedFeedback.drawer})` : ''}
                        {recentlyScannedFeedback.isDuplicate ? ' [Já no carrinho]' : ' [Adicionado!]'}
                      </span>
                    </div>
                    <span className="font-mono font-black text-sm">
                      R$ {recentlyScannedFeedback.price.toFixed(2)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* VIEW A: Camera QR Code Reader */}
            {terminalView === 'camera' && (
              <div className="bg-slate-900 rounded-3xl p-4 text-white shadow-md border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Camera className="h-4 w-4 text-emerald-400" />
                    Leitor Óptico Ao Vivo (QR Code / Etiqueta Térmica)
                  </span>

                  <div className="flex items-center gap-1.5">
                    {hasTorchSupport && cameraActive && (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                          isTorchOn ? 'text-amber-400 bg-amber-500/20' : 'text-slate-400 bg-slate-800'
                        }`}
                        title="Lanterna"
                      >
                        <Flashlight className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setFacingMode(facingMode === 'environment' ? 'user' : 'environment')}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg text-xs cursor-pointer"
                      title="Alternar Câmera"
                    >
                      <Smartphone className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (cameraActive) stopCamera();
                        else startCamera();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer ${
                        cameraActive ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500 text-slate-950 font-bold'
                      }`}
                    >
                      {cameraActive ? 'Pausar' : 'Ligar'}
                    </button>
                  </div>
                </div>

                <div className="relative aspect-16/10 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  {cameraActive ? (
                    <>
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Optical Target Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                        <div className="w-56 h-56 border-2 border-emerald-400/80 rounded-2xl relative shadow-lg shadow-emerald-500/10">
                          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                          <motion.div
                            animate={{ y: [0, 190, 0] }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-sm shadow-emerald-400"
                          />
                        </div>
                      </div>

                      <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
                        <span className="text-[10px] font-bold bg-slate-900/90 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-xs">
                          Aponte para o QR Code da etiqueta do vinil
                        </span>
                      </div>
                    </>
                  ) : cameraError ? (
                    <div className="p-6 text-center space-y-3 max-w-md">
                      <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
                        <AlertCircle className="h-6 w-6" />
                      </div>
                      <p className="text-xs text-amber-200 font-medium leading-relaxed">
                        {cameraError}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>Ativar Câmera</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTerminalView('catalog')}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border border-slate-700"
                        >
                          <Search className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Buscar no Acervo (F3)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-700">
                        <Camera className="h-6 w-6" />
                      </div>
                      <p className="text-xs text-slate-400">Câmera em espera.</p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all"
                      >
                        Ativar Câmera
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW B: Visual Catalog Grid */}
            {terminalView === 'catalog' && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      ref={searchInputRef}
                      placeholder="Pesquisar por título, artista, gênero, código..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredCatalog.slice(0, 18).map(item => {
                    const isSold = item.status === 'sold';
                    const inCart = cartItems.some(c => c.listingId === item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!isSold && !inCart) onAddToCart(item);
                        }}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                          isSold
                            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                            : inCart
                            ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400'
                            : 'bg-white hover:border-indigo-400 hover:shadow-md border-slate-200'
                        }`}
                      >
                        <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative">
                          <img
                            src={item.customImages?.[0] || item.release.coverImage || 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=200'}
                            alt={item.release.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {item.drawer && (
                            <span className="absolute top-1.5 left-1.5 bg-slate-950/80 text-amber-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                              📍 {item.drawer}
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-900 truncate">{item.release.artist}</p>
                          <p className="text-[11px] text-slate-600 truncate">{item.release.title}</p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-xs font-mono font-black text-slate-900">
                            R$ {(item.pricing?.basePriceBrl || 0).toFixed(2)}
                          </span>
                          {inCart ? (
                            <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black">
                              No Carrinho
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="p-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW C: Records by Drawer */}
            {terminalView === 'drawers' && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    Selecione a Gaveta ou Prateleira
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDrawerFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selectedDrawerFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Todas as Gavetas
                  </button>
                  {availableDrawers.map(drawer => (
                    <button
                      key={drawer}
                      type="button"
                      onClick={() => setSelectedDrawerFilter(drawer)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        selectedDrawerFilter === drawer
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      📍 Gaveta {drawer}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {filteredCatalog.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                          <img
                            src={item.customImages?.[0] || item.release.coverImage || 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=100'}
                            alt={item.release.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.release.artist} - {item.release.title}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.barcode || item.id.slice(-6)} • Estoque: <strong>{item.drawer || 'Geral'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          R$ {(item.pricing?.basePriceBrl || 0).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAddToCart(item)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 5 COLUMNS: The Sale Ticket / Cupom do Caixa */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-[640px]">
              {/* Ticket Top Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-bold">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                      Comanda do Atendimento
                      <span className="bg-emerald-500 text-slate-950 px-2 py-0.2 rounded-full text-[10px] font-black">
                        {cartItems.length} {cartItems.length === 1 ? 'disco' : 'discos'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Itens lançados no balcão da loja
                    </p>
                  </div>
                </div>

                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Customer Selector Ribbon */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <User className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer truncate"
                  >
                    <option value="">Cliente Avulso (Balcão)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(true)}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>+ Novo</span>
                </button>
              </div>

              {/* Cart Items List (The Realtime Receipt Style) */}
              <div className="flex-1 p-4 overflow-y-auto space-y-2.5 max-h-[380px]">
                {cartItems.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800">Nenhum disco no carrinho</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Bipe a etiqueta com o QR Code ou selecione discos no catálogo à esquerda.
                      </p>
                    </div>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-start gap-3 transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-300">
                        <img
                          src={item.coverImage || 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=100'}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded">
                            {item.barcode}
                          </span>
                          {item.drawer && (
                            <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                              📍 {item.drawer}
                            </span>
                          )}
                        </div>

                        <h5 className="text-xs font-bold text-slate-900 truncate mt-0.5">{item.artist}</h5>
                        <p className="text-[11px] text-slate-600 truncate">{item.title}</p>

                        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-black text-slate-900">
                              R$ {item.finalPrice.toFixed(2)}
                            </span>
                            {item.discount > 0 && (
                              <span className="text-[10px] text-slate-400 line-through font-mono">
                                R$ {item.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              placeholder="Desc R$"
                              value={item.discount || ''}
                              onChange={(e) => onUpdateCartDiscount(item.id, parseFloat(e.target.value) || 0)}
                              className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded-lg text-[10px] font-mono font-bold text-slate-900 text-right"
                              title="Desconto em Reais neste disco"
                            />
                            <button
                              type="button"
                              onClick={() => onRemoveFromCart(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remover disco do carrinho"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Summary & Big "FINALIZAR VENDA" button */}
              <div className="p-4 bg-slate-900 text-white border-t border-slate-800 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-amber-400 font-bold">
                      <span>Descontos:</span>
                      <span className="font-mono">- R$ {totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-800">
                    <span className="text-sm font-black uppercase text-slate-300">TOTAL A PAGAR:</span>
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      R$ {totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (cartItems.length > 0) {
                        onClearCart();
                      }
                      setPosMode('idle');
                    }}
                    className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancelar (ESC)
                  </button>

                  <button
                    type="button"
                    id="btn-finalizar-venda-pos"
                    disabled={cartItems.length === 0}
                    onClick={() => setIsPaymentModalOpen(true)}
                    className={`py-3 px-3 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                      cartItems.length > 0
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>PAGAR (F4)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: SALES HISTORY & RECENT ORDERS */}
      {posMode === 'history' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" />
                Histórico de Vendas da Loja Física
              </h3>
              <p className="text-xs text-slate-500">
                Registro de todas as transações realizadas no balcão e marketplaces com baixa de estoque
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPosMode('sale')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Zap className="h-4 w-4" />
                <span>+ Nova Venda (F2)</span>
              </button>
            </div>
          </div>

          {/* Orders Table */}
          {salesOrders.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <History className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhuma venda registrada ainda</p>
              <p className="text-xs text-slate-400">Inicie uma venda clicando no botão VENDER acima.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="pb-3">Pedido / Data</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3">Discos / Itens</th>
                    <th className="pb-3">Pagamento</th>
                    <th className="pb-3 text-right">Total</th>
                    <th className="pb-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5">
                        <span className="font-mono font-black text-slate-900 block">{order.orderNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.soldAt).toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-slate-900 block">{order.customerName}</span>
                        {order.customerPhone && (
                          <span className="text-[10px] text-slate-500">{order.customerPhone}</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-slate-800 block">
                          {order.items.length} {order.items.length === 1 ? 'disco' : 'discos'}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block max-w-xs">
                          {order.items.map(i => `${i.artist} - ${i.title}`).join(', ')}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-800 inline-block">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-mono font-black text-sm text-emerald-600">
                        R$ {order.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingReceiptOrder(order)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Recibo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppReceipt(order)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold cursor-pointer"
                          title="Enviar pelo WhatsApp"
                        >
                          WhatsApp
                        </button>
                        {onRefundSale && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja estornar o pedido ${order.orderNumber}? Os discos voltarão para o estoque disponível.`)) {
                                onRefundSale(order.id);
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold cursor-pointer"
                            title="Estornar venda e devolver ao estoque"
                          >
                            Estornar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CHECKOUT PAYMENT MODAL (Standard Retail Checkout) */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-2xl font-bold">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      Recebimento do Caixa
                    </h3>
                    <p className="text-xs text-slate-400">
                      Selecione o método e confirme o pagamento do cliente
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Total Display Banner */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold block">Valor Total a Pagar</span>
                    <span className="text-3xl font-black font-mono text-emerald-400">
                      R$ {totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right text-xs text-slate-300">
                    <span>{cartItems.length} discos no pedido</span>
                    {totalDiscount > 0 && (
                      <span className="block text-amber-300 font-bold">Desc: R$ {totalDiscount.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                {/* Payment Method Selector Grid */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-700 block">
                    Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'PIX', label: 'PIX (QR Code)', icon: QrCode, color: 'text-emerald-600' },
                      { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote, color: 'text-emerald-700' },
                      { id: 'Cartao_Debito', label: 'Cartão Débito', icon: CreditCard, color: 'text-blue-600' },
                      { id: 'Cartao_Credito', label: 'Cartão Crédito', icon: CreditCard, color: 'text-indigo-600' },
                      { id: 'Parcelado', label: 'Parcelado', icon: Calculator, color: 'text-purple-600' },
                      { id: 'Shopee', label: 'Shopee', icon: Store, color: 'text-orange-600' },
                      { id: 'MercadoLivre', label: 'Mercado Livre', icon: Store, color: 'text-yellow-600' },
                      { id: 'Outro', label: 'Outro / Link', icon: DollarSign, color: 'text-slate-600' }
                    ].map(method => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === method.id
                            ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <method.icon className={`h-5 w-5 ${method.color}`} />
                        <span className="text-xs font-bold text-slate-900">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Specific Details */}
                {/* 1. PIX */}
                {paymentMethod === 'PIX' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                    {pixQrDataUrl && (
                      <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 flex-shrink-0">
                        <img src={pixQrDataUrl} alt="QR Code Pix" className="w-32 h-32" />
                      </div>
                    )}
                    <div className="space-y-2 text-center sm:text-left flex-1">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800">Chave PIX da Valdir Discos</span>
                        <p className="text-sm font-mono font-black text-indigo-900 select-all">valdirdiscos@gmail.com</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('valdirdiscos@gmail.com');
                          setCopiedPixKey(true);
                          setTimeout(() => setCopiedPixKey(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 mx-auto sm:mx-0 cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>{copiedPixKey ? 'Chave Copiada!' : 'Copiar Chave Pix'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Dinheiro / Troco */}
                {paymentMethod === 'Dinheiro' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Valor Recebido em Dinheiro (R$)</label>
                      {changeAmount > 0 && (
                        <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Troco: R$ {changeAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder={`Ex: ${Math.ceil(totalAmount)}`}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {/* Fast Tender Buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      {[totalAmount, 20, 50, 100, 150, 200].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCashReceived(val.toFixed(2))}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-xs font-mono font-bold rounded-lg cursor-pointer"
                        >
                          R$ {val.toFixed(2)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Parcelado */}
                {paymentMethod === 'Parcelado' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700">Número de Parcelas</label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none"
                    >
                      {[2, 3, 4, 5, 6, 10, 12].map(n => (
                        <option key={n} value={n}>
                          {n}x de R$ {(totalAmount / n).toFixed(2)} sem juros
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* General Discount & Customer Identification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Desconto Geral no Pedido (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0,00"
                      value={generalDiscount || ''}
                      onChange={(e) => setGeneralDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Cliente do Pedido
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    >
                      <option value="">Cliente Avulso (Balcão)</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  Voltar ao Carrinho
                </button>

                <button
                  type="button"
                  id="btn-confirmar-pagamento-final"
                  disabled={isSubmitting}
                  onClick={handleFinalizeSale}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{isSubmitting ? 'Processando...' : `CONFIRMAR RECEBIMENTO (R$ ${totalAmount.toFixed(2)})`}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POST-SALE SUCCESS MODAL (Receipt, WhatsApp, Thermal Print) */}
      <AnimatePresence>
        {completedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col p-6 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-500 text-slate-950 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Venda Concluída com Sucesso!</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">Pedido: <strong>{completedOrder.orderNumber}</strong></p>
                <p className="text-xs text-slate-500 font-bold">Estoque baixado automaticamente em tempo real.</p>
              </div>

              {/* Receipt Summary Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Cliente:</span>
                  <span className="truncate">{completedOrder.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Discos:</span>
                  <span>{completedOrder.items.length} un</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pagamento:</span>
                  <span>{completedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between font-black text-emerald-700 text-sm pt-2 border-t border-slate-200">
                  <span>Total Pago:</span>
                  <span>R$ {completedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppReceipt(completedOrder)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Enviar Comprovante por WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingReceiptOrder(completedOrder)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Ver Cupom Não-Fiscal / Imprimir</span>
                </button>

                <button
                  type="button"
                  id="btn-proxima-venda-pos"
                  onClick={handleResetForNextCustomer}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
                >
                  <Plus className="h-4 w-4 text-emerald-400" />
                  <span>PRÓXIMA VENDA (F2)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECEIPT VIEWER MODAL */}
      <AnimatePresence>
        {viewingReceiptOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">Comprovante de Venda</span>
                <button
                  type="button"
                  onClick={() => setViewingReceiptOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Printable Receipt Paper */}
              <div className="p-6 bg-slate-50 overflow-y-auto space-y-3 font-mono text-xs text-slate-800">
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                  <h4 className="text-sm font-black uppercase text-slate-900">VALDIR DISCOS</h4>
                  <p className="text-[10px] text-slate-500">Curadoria de Vinil & Colecionismo</p>
                  <p className="text-[10px] text-slate-500">Pedido: {viewingReceiptOrder.orderNumber}</p>
                  <p className="text-[10px] text-slate-500">Data: {new Date(viewingReceiptOrder.soldAt).toLocaleString('pt-BR')}</p>
                </div>

                <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300">
                  <div className="text-[10px] uppercase font-bold text-slate-500 flex justify-between">
                    <span>Item</span>
                    <span>Valor</span>
                  </div>
                  {viewingReceiptOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between gap-2 text-slate-900">
                      <span className="truncate">{it.artist} - {it.title}</span>
                      <span className="flex-shrink-0">R$ {it.finalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {viewingReceiptOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {viewingReceiptOrder.totalDiscount > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Desconto:</span>
                      <span>- R$ {viewingReceiptOrder.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-300">
                    <span>TOTAL:</span>
                    <span>R$ {viewingReceiptOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                    <span>Pagamento:</span>
                    <span>{viewingReceiptOrder.paymentMethod}</span>
                  </div>
                </div>

                <div className="text-center pt-3 text-[10px] text-slate-500 border-t border-dashed border-slate-300">
                  Obrigado pela preferência! Viva a música em vinil! 🖤🎶
                </div>
              </div>

              <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppReceipt(viewingReceiptOrder)}
                  className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK CUSTOMER CREATION MODAL */}
      <AnimatePresence>
        {isNewCustomerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-emerald-400" />
                  Cadastro Rápido de Cliente no Balcão
                </span>
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Santana"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Cidade / Bairro</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo / SP"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewCustomerModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCustomer || !newCustName.trim()}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {isSavingCustomer ? 'Salvando...' : 'Salvar e Vincular'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

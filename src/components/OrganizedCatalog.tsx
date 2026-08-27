/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, Search, Trash2, ArrowRight, Disc, Music, Video, 
  FileAudio, Download, X, Check, Copy, TrendingUp, MapPin, 
  Sparkles, Calendar, Layers, Shield, Tag, DollarSign, Eye, Play,
  ShoppingBag, CheckCircle, AlertCircle, RefreshCw, Bookmark, AlertTriangle,
  Edit3, FileText, Phone, Plus, Heart, QrCode, Printer
} from 'lucide-react';
import { SavedListing, Customer } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { SalesChannel } from '../types';
import { getSalesChannelMeta } from '../utils/qrcode';
import { BatchQRCodeModal } from './BatchQRCodeModal';
import { DiscQRCodeModal } from './DiscQRCodeModal';
import { ThermalPrintModal } from './ThermalPrintModal';

interface OrganizedCatalogProps {
  listings: SavedListing[];
  onSelect: (listing: SavedListing) => void;
  onDelete: (id: string) => void;
  onUpdate: (listing: SavedListing) => void;
  onSwitchToEditor: () => void;
  customers?: Customer[];
  onAddCustomer?: (customer: Customer) => Promise<void>;
}

export const OrganizedCatalog: React.FC<OrganizedCatalogProps> = ({
  listings = [],
  onSelect,
  onDelete,
  onUpdate,
  onSwitchToEditor,
  customers = [],
  onAddCustomer,
}) => {
  const [innerTab, setInnerTab] = useState<'estoque' | 'financeiro'>('estoque');
  const [isBatchQrModalOpen, setIsBatchQrModalOpen] = useState(false);
  const [qrModalListing, setQrModalListing] = useState<SavedListing | null>(null);
  const [thermalPrintListing, setThermalPrintListing] = useState<SavedListing | null>(null);
  const [search, setSearch] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedDrawer, setSelectedDrawer] = useState<string>('all');
  const [selectedGrading, setSelectedGrading] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<'all' | SalesChannel>('all');
  const [diagnosticFilter, setDiagnosticFilter] = useState<'all' | 'no-loc' | 'no-photos'>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [selectedListing, setSelectedListing] = useState<SavedListing | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modal States
  const [sellingListing, setSellingListing] = useState<SavedListing | null>(null);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [salePlatform, setSalePlatform] = useState<'shopee' | 'mercadolivre' | 'direct' | 'other'>('shopee');
  const [saleFees, setSaleFees] = useState<number>(0);

  const [reservingListing, setReservingListing] = useState<SavedListing | null>(null);
  const [reserveNote, setReserveNote] = useState<string>('');

  // Customers integration states
  const [selectedReserveCustomerId, setSelectedReserveCustomerId] = useState<string>('');
  const [isAddingReserveCustomer, setIsAddingReserveCustomer] = useState(false);
  const [newReserveCustomerName, setNewReserveCustomerName] = useState('');
  const [newReserveCustomerPhone, setNewReserveCustomerPhone] = useState('');
  const [newReserveCustomerCity, setNewReserveCustomerCity] = useState('');
  const [newReserveCustomerState, setNewReserveCustomerState] = useState('');

  const [selectedSaleCustomerId, setSelectedSaleCustomerId] = useState<string>('');
  const [isAddingSaleCustomer, setIsAddingSaleCustomer] = useState(false);
  const [newSaleCustomerName, setNewSaleCustomerName] = useState('');
  const [newSaleCustomerPhone, setNewSaleCustomerPhone] = useState('');
  const [newSaleCustomerCity, setNewSaleCustomerCity] = useState('');
  const [newSaleCustomerState, setNewSaleCustomerState] = useState('');

  // Payment integration and Shopee Screenshot analyzer states
  const [paymentStatus, setPaymentStatus] = useState<'pago' | 'pendente'>('pago');
  const [paymentMethod, setPaymentMethod] = useState<string>('shopee');
  const [isParsingPrint, setIsParsingPrint] = useState(false);
  const [printParseError, setPrintParseError] = useState<string | null>(null);
  const [printParseSuccess, setPrintParseSuccess] = useState<string | null>(null);

  // Advanced sales, filtering, editing, and receipt states
  const [saleSearch, setSaleSearch] = useState('');
  const [saleStatusFilter, setSaleStatusFilter] = useState<'all' | 'pago' | 'pendente'>('all');
  const [salePlatformFilter, setSalePlatformFilter] = useState<string>('all');
  const [saleDateRange, setSaleDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  const [editingSaleListing, setEditingSaleListing] = useState<SavedListing | null>(null);
  const [editSalePrice, setEditSalePrice] = useState<number>(0);
  const [editSaleFees, setEditSaleFees] = useState<number>(0);
  const [editSalePlatform, setEditSalePlatform] = useState<'shopee' | 'mercadolivre' | 'direct' | 'other'>('shopee');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'pago' | 'pendente'>('pago');
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('shopee');

  const [receiptListing, setReceiptListing] = useState<SavedListing | null>(null);

  // Shopee, Mercado Livre, and Direct print uploader and parser
  const handlePrintUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPrint(true);
    setPrintParseError(null);
    setPrintParseSuccess(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const res = await fetch("/api/parse-shopee-print", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type,
          }),
        });

        if (!res.ok) {
          throw new Error("Erro no servidor ao processar imagem.");
        }

        const json = await res.json();
        if (json.success && json.data) {
          const data = json.data;
          
          let activePlatform = salePlatform;
          if (data.platform && ['shopee', 'mercadolivre', 'direct', 'other'].includes(data.platform)) {
            activePlatform = data.platform as any;
            setSalePlatform(activePlatform);
            if (activePlatform === 'shopee') {
              setPaymentMethod('shopee');
            } else if (activePlatform === 'mercadolivre') {
              setPaymentMethod('mercadolivre');
            } else if (activePlatform === 'direct') {
              setPaymentMethod('pix');
            } else {
              setPaymentMethod('dinheiro');
            }
          }

          if (typeof data.salePrice === 'number' && data.salePrice > 0) {
            setSalePrice(data.salePrice);
            // trigger fee calculation based on parsed sale price and platform
            let calFees = data.feesPaid || 0;
            if (activePlatform === 'shopee') {
              const commission = (sellingListing?.pricing.shopeeCommissionPercent) || 14;
              const fixedFee = (sellingListing?.pricing.shopeeFixedFee) || 4;
              calFees = data.feesPaid || ((data.salePrice * (commission / 100)) + fixedFee);
            } else if (activePlatform === 'mercadolivre') {
              calFees = data.feesPaid || ((data.salePrice * 0.12) + 5);
            }
            setSaleFees(parseFloat(calFees.toFixed(2)));
          } else if (typeof data.feesPaid === 'number') {
            setSaleFees(data.feesPaid);
          }

          const platformNames: Record<string, string> = {
            shopee: 'Shopee',
            mercadolivre: 'Mercado Livre',
            direct: 'Direto (WhatsApp/Pix)',
            other: 'Outro / Físico'
          };
          const resolvedPlatform = platformNames[activePlatform] || 'Identificada';

          if (data.customerName) {
            const normalizedParsed = data.customerName.toLowerCase().trim();
            const existingCust = (customers || []).find(
              c => c.name.toLowerCase().trim() === normalizedParsed || 
                   normalizedParsed.includes(c.name.toLowerCase().trim()) ||
                   c.name.toLowerCase().trim().includes(normalizedParsed)
            );
            if (existingCust) {
              setSelectedSaleCustomerId(existingCust.id);
              setIsAddingSaleCustomer(false);
              setPrintParseSuccess(`Print lido (${resolvedPlatform})! Vinculado ao cliente: ${existingCust.name}`);
            } else {
              setIsAddingSaleCustomer(true);
              setNewSaleCustomerName(data.customerName);
              setNewSaleCustomerPhone('');
              setNewSaleCustomerCity(data.customerCity || '');
              setNewSaleCustomerState((data.customerState || '').toUpperCase());
              setPrintParseSuccess(`Print lido (${resolvedPlatform})! Criando cliente rápido: ${data.customerName}`);
            }
          } else {
            setPrintParseSuccess(`Print lido (${resolvedPlatform})! Valores atualizados com sucesso.`);
          }
        } else {
          throw new Error("Não foi possível extrair dados estruturados deste print.");
        }
      } catch (err: any) {
        console.error(err);
        setPrintParseError(err.message || "Ocorreu um erro ao processar o print.");
      } finally {
        setIsParsingPrint(false);
      }
    };
    reader.onerror = () => {
      setPrintParseError("Falha ao ler o arquivo de imagem.");
      setIsParsingPrint(false);
    };
    reader.readAsDataURL(file);
  };

  // Helper to calculate total unit cost (Acquisition Cost + Packaging)
  const getItemCost = (item: SavedListing): number => {
    const discCost = (item.pricing?.costPrice !== undefined && item.pricing?.costPrice !== null)
      ? Number(item.pricing.costPrice)
      : 0;
    return discCost + (item.pricing?.packagingCost ?? 4.0);
  };

  // Extract unique drawers and gradings for filters
  const uniqueDrawers = Array.from(
    new Set(listings.map((l) => l.drawer?.trim()).filter(Boolean))
  ) as string[];

  const uniqueGradings = Array.from(
    new Set(listings.map((l) => l.condition.mediaCondition?.trim()).filter(Boolean))
  ) as string[];

  // Dynamic Metrics & Stats
  const totalCount = listings.length;
  
  const availableListings = listings.filter(item => !item.status || item.status === 'available');
  const soldListings = listings.filter(item => item.status === 'sold');
  const reservedListings = listings.filter(item => item.status === 'reserved');
  const personalListings = listings.filter(item => item.status === 'personal');

  // Helper for item store price
  const getItemPrice = (item: SavedListing) => {
    return item.pricing?.directPrice || item.pricing?.basePriceBrl || item.shopee?.suggestedPrice || 0;
  };

  // Available inventory metrics (projected values)
  const totalCostAvailable = availableListings.reduce((sum, item) => sum + getItemCost(item), 0);
  const totalProjectedRevenue = availableListings.reduce((sum, item) => sum + getItemPrice(item), 0);
  const totalProjectedProfit = totalProjectedRevenue - totalCostAvailable;

  // Realized Sales metrics
  const totalRealizedRevenue = soldListings.reduce((sum, item) => sum + (item.saleDetails?.salePrice || 0), 0);
  const totalFeesPaid = soldListings.reduce((sum, item) => sum + (item.saleDetails?.feesPaid || 0), 0);
  const totalActualProfit = soldListings.reduce((sum, item) => sum + (item.saleDetails?.netProfit || 0), 0);
  const totalCostSold = soldListings.reduce((sum, item) => sum + getItemCost(item), 0);

  // Platform breakdown for sales
  const platformSales = soldListings.reduce(
    (acc, item) => {
      const plat = item.saleDetails?.platform || 'other';
      acc[plat] = (acc[plat] || 0) + (item.saleDetails?.salePrice || 0);
      acc[`${plat}Count`] = (acc[`${plat}Count`] || 0) + 1;
      return acc;
    },
    { shopee: 0, shopeeCount: 0, mercadolivre: 0, mercadolivreCount: 0, direct: 0, directCount: 0, other: 0, otherCount: 0 } as any
  );

  // Pending Receivables (Contas a Receber) metrics
  const pendingSales = soldListings.filter(item => item.saleDetails?.paymentStatus === 'pendente');
  const totalPendingReceivables = pendingSales.reduce((sum, item) => sum + (item.saleDetails?.salePrice || 0), 0);
  const totalPendingProfit = pendingSales.reduce((sum, item) => sum + (item.saleDetails?.netProfit || 0), 0);

  // Filter sold listings for ledger table and pending dashboard
  const filteredSoldListings = soldListings.filter(item => {
    const details = item.saleDetails;
    if (!details) return false;

    // Text search (Title, Artist, Customer)
    const query = saleSearch.toLowerCase().trim();
    if (query) {
      const matchesSearch = 
        item.release.title.toLowerCase().includes(query) ||
        item.release.artist.toLowerCase().includes(query) ||
        (item.customerName && item.customerName.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Status filter
    if (saleStatusFilter !== 'all') {
      const status = details.paymentStatus || 'pago';
      if (status !== saleStatusFilter) return false;
    }

    // Platform filter
    if (salePlatformFilter !== 'all') {
      if (details.platform !== salePlatformFilter) return false;
    }

    // Date range filter
    if (saleDateRange !== 'all') {
      const soldDate = new Date(details.soldAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - soldDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (saleDateRange === 'today') {
        const isToday = soldDate.getDate() === now.getDate() &&
                        soldDate.getMonth() === now.getMonth() &&
                        soldDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (saleDateRange === 'week' && diffDays > 7) {
        return false;
      } else if (saleDateRange === 'month' && diffDays > 30) {
        return false;
      }
    }

    return true;
  });

  const countByFormat = listings.reduce(
    (acc, item) => {
      const format = (item.release.formats?.[0]?.name || 'Other').toLowerCase();
      if (format.includes('vinyl') || format.includes('vinil') || format.includes('lp')) {
        acc.vinyl += 1;
      } else if (format.includes('cd')) {
        acc.cd += 1;
      } else if (format.includes('dvd')) {
        acc.dvd += 1;
      } else {
        acc.other += 1;
      }
      return acc;
    },
    { vinyl: 0, cd: 0, dvd: 0, other: 0 }
  );

  const activeDrawersCount = uniqueDrawers.length;

  // Filter listings for the inventory view
  const filteredListings = listings.filter((item) => {
    // 1. Text Search
    const query = search.toLowerCase();
    const matchesText = 
      item.release.title.toLowerCase().includes(query) ||
      item.release.artist.toLowerCase().includes(query) ||
      item.release.label.toLowerCase().includes(query) ||
      (item.release.catno && item.release.catno.toLowerCase().includes(query)) ||
      (item.drawer && item.drawer.toLowerCase().includes(query));

    // 2. Format Filter
    const formatName = (item.release.formats?.[0]?.name || '').toLowerCase();
    let matchesFormat = true;
    if (selectedFormat === 'vinyl') {
      matchesFormat = formatName.includes('vinyl') || formatName.includes('vinil') || formatName.includes('lp');
    } else if (selectedFormat === 'cd') {
      matchesFormat = formatName.includes('cd');
    } else if (selectedFormat === 'dvd') {
      matchesFormat = formatName.includes('dvd');
    } else if (selectedFormat === 'other') {
      matchesFormat = !formatName.includes('vinyl') && !formatName.includes('vinil') && !formatName.includes('lp') && !formatName.includes('cd') && !formatName.includes('dvd');
    }

    // 3. Drawer Filter
    let matchesDrawer = true;
    if (selectedDrawer === 'none') {
      matchesDrawer = !item.drawer;
    } else if (selectedDrawer !== 'all') {
      matchesDrawer = item.drawer === selectedDrawer;
    }

    // 4. Grading Filter
    const matchesGrading = selectedGrading === 'all' || item.condition.mediaCondition === selectedGrading;

    // 5. Status Filter
    const itemStatus = item.status || 'available';
    const matchesStatus = selectedStatus === 'all' || itemStatus === selectedStatus;

    // 6. Sales Channels Filter
    let matchesChannel = true;
    if (selectedChannel !== 'all') {
      const channels = item.salesChannels || ['physical_store', 'online_store', 'shopee', 'mercadolivre'];
      matchesChannel = channels.includes(selectedChannel);
    }

    // 7. Diagnostic Filter
    let matchesDiagnostic = true;
    if (diagnosticFilter === 'no-loc') {
      matchesDiagnostic = !item.drawer || item.drawer.trim() === '';
    } else if (diagnosticFilter === 'no-photos') {
      matchesDiagnostic = !item.customImages || item.customImages.length === 0;
    }

    return matchesText && matchesFormat && matchesDrawer && matchesGrading && matchesStatus && matchesChannel && matchesDiagnostic;
  });

  // Sort listings
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'title-asc') {
      return a.release.title.localeCompare(b.release.title);
    }
    if (sortBy === 'title-desc') {
      return b.release.title.localeCompare(a.release.title);
    }
    if (sortBy === 'artist-asc') {
      return a.release.artist.localeCompare(b.release.artist);
    }
    if (sortBy === 'price-desc') {
      return getItemPrice(b) - getItemPrice(a);
    }
    if (sortBy === 'price-asc') {
      return getItemPrice(a) - getItemPrice(b);
    }
    return 0;
  });

  const getFormatIcon = (formatName: string, sizeClass = "h-4 w-4") => {
    const lower = formatName.toLowerCase();
    if (lower.includes('vinyl') || lower.includes('vinil') || lower.includes('lp')) {
      return <Disc className={`${sizeClass} text-indigo-600`} />;
    }
    if (lower.includes('cd')) {
      return <Music className={`${sizeClass} text-rose-500`} />;
    }
    if (lower.includes('dvd')) {
      return <Video className={`${sizeClass} text-rose-600`} />;
    }
    return <FileAudio className={`${sizeClass} text-slate-400`} />;
  };

  const getFormatBadgeColor = (formatName: string) => {
    const lower = formatName.toLowerCase();
    if (lower.includes('vinyl') || lower.includes('vinil') || lower.includes('lp')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
    if (lower.includes('cd')) {
      return 'bg-rose-50 text-rose-700 border-rose-100';
    }
    if (lower.includes('dvd')) {
      return 'bg-purple-50 text-purple-700 border-purple-100';
    }
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  const triggerCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

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
      console.error("Erro ao exportar catálogo:", err);
    }
  };

  const exportCatalogToCSV = () => {
    if (listings.length === 0) return;
    
    const headers = [
      'ID Cadastro',
      'Titulo do Disco',
      'Artista',
      'Gravadora',
      'No de Catalogo',
      'Ano',
      'Generos',
      'Estilos',
      'Estado da Midia',
      'Detalhes da Midia',
      'Estado da Capa',
      'Detalhes da Capa',
      'Encarte',
      'Preco Base (RS)',
      'Preco Shopee Gerado (RS)',
      'Preco Mercado Livre Gerado (RS)',
      'Grave/Gaveta (Loc)',
      'Status',
      'Cliente Vinculado',
      'Data de Cadastro'
    ];

    const rows = listings.map(item => {
      const genres = item.release.genres || [];
      const styles = item.release.styles || [];
      const formatName = item.release.formats?.[0]?.name || 'Vinyl';
      return [
        item.id,
        `"${(item.release.title || '').replace(/"/g, '""')}"`,
        `"${(item.release.artist || '').replace(/"/g, '""')}"`,
        `"${(item.release.label || '').replace(/"/g, '""')}"`,
        `"${(item.release.catno || '').replace(/"/g, '""')}"`,
        item.release.year || 'N/A',
        `"${genres.join(', ').replace(/"/g, '""')}"`,
        `"${styles.join(', ').replace(/"/g, '""')}"`,
        item.condition.mediaCondition || 'N/A',
        `"${(item.condition.mediaDetails || '').replace(/"/g, '""')}"`,
        item.condition.sleeveCondition || 'N/A',
        `"${(item.condition.sleeveDetails || '').replace(/"/g, '""')}"`,
        item.condition.hasInsert ? `Sim (${item.condition.insertCondition || 'N/A'})` : 'Nao',
        (item.pricing.basePriceBrl || 0).toFixed(2),
        (item.shopee?.suggestedPrice || 0).toFixed(2),
        (item.mercadolivre?.suggestedPrice || 0).toFixed(2),
        `"${(item.drawer || 'Geral').replace(/"/g, '""')}"`,
        (item.status || 'available').toUpperCase(),
        `"${(item.customerName || 'N/A').replace(/"/g, '""')}"`,
        new Date(item.createdAt).toLocaleDateString('pt-BR')
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `catalogo_valdir_discos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadToWorkspace = (item: SavedListing) => {
    onSelect(item);
    onSwitchToEditor();
    setSelectedListing(null);
  };

  // Open the sale registration modal
  const openSellModal = (item: SavedListing) => {
    setSellingListing(item);
    const suggested = getItemPrice(item);
    setSalePrice(suggested);
    setSalePlatform('shopee');
    
    // Auto calculate initial fees based on Shopee settings
    const commission = item.pricing.shopeeCommissionPercent || 14;
    const fixedFee = item.pricing.shopeeFixedFee || 4;
    const calculatedFees = (suggested * (commission / 100)) + fixedFee;
    setSaleFees(calculatedFees);

    setSelectedSaleCustomerId(item.customerId || '');
    setIsAddingSaleCustomer(false);
    setNewSaleCustomerName('');
    setNewSaleCustomerPhone('');
    setNewSaleCustomerCity('');
    setNewSaleCustomerState('');

    // Reset payment states
    setPaymentStatus('pago');
    setPaymentMethod('shopee');
    setPrintParseError(null);
    setPrintParseSuccess(null);
  };

  // Trigger when platform switches in Sell Modal
  const handlePlatformChange = (platform: 'shopee' | 'mercadolivre' | 'direct' | 'other', currentPrice: number) => {
    setSalePlatform(platform);
    if (!sellingListing) return;

    if (platform === 'shopee') {
      const commission = sellingListing.pricing.shopeeCommissionPercent || 14;
      const fixedFee = sellingListing.pricing.shopeeFixedFee || 4;
      setSaleFees((currentPrice * (commission / 100)) + fixedFee);
      setPaymentMethod('shopee');
    } else if (platform === 'mercadolivre') {
      // Mercado Livre typical fee: 12% to 14% depending on category + flat fee R$ 5
      setSaleFees((currentPrice * 0.12) + 5);
      setPaymentMethod('mercadolivre');
    } else if (platform === 'direct') {
      // direct sales or other sales typically have 0 fees
      setSaleFees(0);
      setPaymentMethod('pix');
    } else {
      setSaleFees(0);
      setPaymentMethod('dinheiro');
    }
  };

  // Confirm Sale Registration and write to Firebase
  const submitSale = async () => {
    if (!sellingListing) return;

    let custId = selectedSaleCustomerId || undefined;
    let custName = customers?.find(c => c.id === selectedSaleCustomerId)?.name || undefined;

    if (isAddingSaleCustomer && newSaleCustomerName.trim()) {
      const newCustId = Date.now().toString();
      const newCust: Customer = {
        id: newCustId,
        name: newSaleCustomerName.trim(),
        phone: newSaleCustomerPhone.trim() || undefined,
        city: newSaleCustomerCity.trim() || undefined,
        state: newSaleCustomerState.trim().toUpperCase() || undefined,
        createdAt: new Date().toISOString()
      };
      if (onAddCustomer) {
        await onAddCustomer(newCust);
      }
      custId = newCustId;
      custName = newCust.name;
    }

    const cost = getItemCost(sellingListing);
    const netProfit = salePrice - cost - saleFees;

    const updated: SavedListing = {
      ...sellingListing,
      status: 'sold',
      customerId: custId,
      customerName: custName,
      saleDetails: {
        salePrice,
        platform: salePlatform,
        soldAt: new Date().toISOString(),
        feesPaid: salePlatform === 'shopee' || salePlatform === 'mercadolivre' ? saleFees : 0,
        netProfit: parseFloat(netProfit.toFixed(2)),
        paymentStatus,
        paymentMethod
      }
    };

    onUpdate(updated);
    setSellingListing(null);
    if (selectedListing?.id === sellingListing.id) {
      setSelectedListing(updated);
    }
  };

  // Open the reservation modal
  const openReserveModal = (item: SavedListing) => {
    setReservingListing(item);
    setReserveNote(item.pricing.customNotes || '');
    setSelectedReserveCustomerId(item.customerId || '');
    setIsAddingReserveCustomer(false);
    setNewReserveCustomerName('');
    setNewReserveCustomerPhone('');
    setNewReserveCustomerCity('');
    setNewReserveCustomerState('');
  };

  // Submit Reservation
  const submitReservation = async () => {
    if (!reservingListing) return;

    let custId = selectedReserveCustomerId || undefined;
    let custName = customers.find(c => c.id === selectedReserveCustomerId)?.name || undefined;

    if (isAddingReserveCustomer && newReserveCustomerName.trim()) {
      const newCustId = Date.now().toString();
      const newCust: Customer = {
        id: newCustId,
        name: newReserveCustomerName.trim(),
        phone: newReserveCustomerPhone.trim() || undefined,
        city: newReserveCustomerCity.trim() || undefined,
        state: newReserveCustomerState.trim().toUpperCase() || undefined,
        createdAt: new Date().toISOString()
      };
      if (onAddCustomer) {
        await onAddCustomer(newCust);
      }
      custId = newCustId;
      custName = newCust.name;
    }

    const updated: SavedListing = {
      ...reservingListing,
      status: 'reserved',
      customerId: custId,
      customerName: custName,
      pricing: {
        ...reservingListing.pricing,
        customNotes: reserveNote || undefined
      }
    };

    onUpdate(updated);
    setReservingListing(null);
    if (selectedListing?.id === reservingListing.id) {
      setSelectedListing(updated);
    }
  };

  // Change item back to available
  const markAsAvailable = (item: SavedListing) => {
    const updated: SavedListing = {
      ...item,
      status: 'available',
      saleDetails: undefined
    };
    onUpdate(updated);
    if (selectedListing?.id === item.id) {
      setSelectedListing(updated);
    }
  };

  // Advanced Sales & Order Management Helpers
  const [receiptCopied, setReceiptCopied] = useState(false);

  const openEditSaleModal = (item: SavedListing) => {
    if (!item.saleDetails) return;
    setEditingSaleListing(item);
    setEditSalePrice(item.saleDetails.salePrice);
    setEditSaleFees(item.saleDetails.feesPaid || 0);
    setEditSalePlatform(item.saleDetails.platform);
    setEditPaymentStatus(item.saleDetails.paymentStatus || 'pago');
    setEditPaymentMethod(item.saleDetails.paymentMethod || 'pix');
  };

  const submitEditSale = () => {
    if (!editingSaleListing || !editingSaleListing.saleDetails) return;
    const cost = getItemCost(editingSaleListing);
    const netProfit = editSalePrice - cost - editSaleFees;

    const updated: SavedListing = {
      ...editingSaleListing,
      saleDetails: {
        ...editingSaleListing.saleDetails,
        salePrice: editSalePrice,
        feesPaid: editSaleFees,
        platform: editSalePlatform,
        paymentStatus: editPaymentStatus,
        paymentMethod: editPaymentMethod,
        netProfit: parseFloat(netProfit.toFixed(2))
      }
    };

    onUpdate(updated);
    setEditingSaleListing(null);
    if (selectedListing?.id === editingSaleListing.id) {
      setSelectedListing(updated);
    }
  };

  const confirmPendingPayment = (item: SavedListing) => {
    if (!item.saleDetails) return;
    const updated: SavedListing = {
      ...item,
      saleDetails: {
        ...item.saleDetails,
        paymentStatus: 'pago'
      }
    };
    onUpdate(updated);
    if (selectedListing?.id === item.id) {
      setSelectedListing(updated);
    }
  };

  const exportSalesToCSV = () => {
    if (filteredSoldListings.length === 0) return;
    
    const headers = [
      'Data de Venda',
      'Titulo',
      'Artista',
      'Cliente',
      'Plataforma',
      'Metodo Pagamento',
      'Status Pagamento',
      'Preco de Venda (R$)',
      'Taxas Shopee/ML (R$)',
      'Custo Unitario (R$)',
      'Lucro Liquido (R$)'
    ];

    const rows = filteredSoldListings.map(item => {
      const details = item.saleDetails!;
      const cost = getItemCost(item);
      const saleDate = new Date(details.soldAt).toLocaleDateString('pt-BR');
      return [
        saleDate,
        `"${item.release.title.replace(/"/g, '""')}"`,
        `"${item.release.artist.replace(/"/g, '""')}"`,
        `"${(item.customerName || '').replace(/"/g, '""')}"`,
        details.platform.toUpperCase(),
        details.paymentMethod || 'N/A',
        (details.paymentStatus || 'pago').toUpperCase(),
        details.salePrice.toFixed(2),
        (details.feesPaid || 0).toFixed(2),
        cost.toFixed(2),
        details.netProfit.toFixed(2)
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vendas_valdir_discos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyReceiptText = (item: SavedListing) => {
    if (!item.saleDetails) return;
    const details = item.saleDetails;
    const saleDate = new Date(details.soldAt).toLocaleDateString('pt-BR');
    const statusText = details.paymentStatus === 'pendente' ? '⏳ PENDENTE DE PAGAMENTO' : '✅ PAGO / CONFIRMADO';
    
    const text = `🧾 *VALDIR DISCOS & ANTIGUIDADES* 🧾
--------------------------------------------
*COMPROVANTE DE VENDA DE DISCO*

*Álbum:* ${item.release.title}
*Artista:* ${item.release.artist}
*Formato:* ${item.release.formats?.[0]?.name || 'Disco Vinil'}
*Estado da Mídia:* ${item.condition.mediaCondition || 'N/A'}
*Grave/Gaveta:* ${item.drawer || 'Geral'}

*Cliente:* ${item.customerName || 'Não Informado'}
*Data da Compra:* ${saleDate}
*Canal:* ${details.platform.toUpperCase()}
*Forma de Pagto:* ${(details.paymentMethod || 'Pix').toUpperCase()}
*Status:* ${statusText}

*VALOR TOTAL:* R$ ${details.salePrice.toFixed(2)}
--------------------------------------------
Obrigado por apoiar a cultura do vinil! 🎵
Colecionar é preservar a história.`;

    navigator.clipboard.writeText(text);
    setReceiptCopied(true);
    setTimeout(() => setReceiptCopied(false), 2000);
  };

  return (
    <div className="space-y-6" id="organized-catalog-root">
      
      {/* Sub-Tabs: Estoque/Acervo vs Vendas/Financeiro */}
      <div className="flex border-b border-slate-200" id="catalog-inner-tabs">
        <button
          onClick={() => setInnerTab('estoque')}
          className={`py-3 px-6 font-black uppercase text-xs tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            innerTab === 'estoque'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="h-4 w-4" />
          Meu Acervo / Estoque
          <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {availableListings.length}
          </span>
        </button>
        <button
          onClick={() => setInnerTab('financeiro')}
          className={`py-3 px-6 font-black uppercase text-xs tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            innerTab === 'financeiro'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Caixa e Relatório de Vendas
          <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
            R$ {totalRealizedRevenue.toFixed(0)}
          </span>
        </button>
      </div>

      {innerTab === 'estoque' ? (
        <>
          {/* Metrics Quick Overview Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn" id="catalog-metrics-grid">
            <div className="bg-gradient-to-br from-indigo-50/40 to-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="h-11 w-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0 border border-indigo-100">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Cadastrado</span>
                <span className="text-xl font-black text-slate-800 font-mono leading-tight">{totalCount}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50/40 to-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="h-11 w-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0 border border-emerald-100">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Discos Disponíveis</span>
                <span className="text-xl font-black text-emerald-700 font-mono leading-tight">{availableListings.length}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50/40 to-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="h-11 w-11 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 flex-shrink-0 border border-rose-100">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Coleção Pessoal</span>
                <span className="text-xl font-black text-rose-700 font-mono leading-tight">{personalListings.length}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 flex-shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Locs Ativas</span>
                  <span className="text-lg font-extrabold text-slate-800 font-mono">{activeDrawersCount}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => setIsBatchQrModalOpen(true)}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl border border-slate-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Gerar e imprimir folhas de etiquetas QR Code em lote"
                >
                  <QrCode className="h-3.5 w-3.5 text-indigo-300" />
                  <span>Etiquetas QR</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Exportar backup completo (JSON)"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={exportCatalogToCSV}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-50"
                  title="Exportar acervo para Excel (CSV)"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Excel (CSV)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter and Control Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4" id="catalog-controls">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Main search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por título, artista, gravadora, loc, código de barras..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/80 focus:bg-white focus:outline-none rounded-xl text-sm text-slate-700 font-medium transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="w-full lg:w-[220px] flex items-center gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Ordenar:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="date-desc">Mais Recentes Primeiro</option>
                  <option value="date-asc">Mais Antigos Primeiro</option>
                  <option value="title-asc">Título (A-Z)</option>
                  <option value="title-desc">Título (Z-A)</option>
                  <option value="artist-asc">Artista (A-Z)</option>
                  <option value="price-desc">Preço: Maior ao Menor</option>
                  <option value="price-asc">Preço: Menor ao Maior</option>
                </select>
              </div>
            </div>

            {/* Detailed Filters (Pills) */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 border-t border-slate-100 text-xs">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Filtrar Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Todos os Itens ({totalCount})</option>
                  <option value="available">Estoque à Venda ({availableListings.length})</option>
                  <option value="personal">Coleção Pessoal ({personalListings.length})</option>
                  <option value="reserved">Reservados ({reservedListings.length})</option>
                  <option value="sold">Vendidos ({soldListings.length})</option>
                </select>
              </div>

              {/* Format Selection Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Formato:</span>
                <button
                  onClick={() => setSelectedFormat('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                    selectedFormat === 'all'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setSelectedFormat('vinyl')}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    selectedFormat === 'vinyl'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Disc className="h-3 w-3" />
                  LPs
                </button>
                <button
                  onClick={() => setSelectedFormat('cd')}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    selectedFormat === 'cd'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Music className="h-3 w-3" />
                  CDs
                </button>
              </div>

              {/* Sales Channel Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Canal de Venda:</span>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">Todos os Canais</option>
                  <option value="physical_store">🏬 Loja Física</option>
                  <option value="online_store">🌐 Loja Online</option>
                  <option value="shopee">🛍️ Shopee</option>
                  <option value="mercadolivre">💛 Mercado Livre</option>
                </select>
              </div>

              {/* Location / Drawer Selection */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Loc:</span>
                <select
                  value={selectedDrawer}
                  onChange={(e) => setSelectedDrawer(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Todas as Gavetas</option>
                  <option value="none">Sem Gaveta</option>
                  {uniqueDrawers.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Grading Selection */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Mídia:</span>
                <select
                  value={selectedGrading}
                  onChange={(e) => setSelectedGrading(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Todos os Estados</option>
                  {uniqueGradings.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Diagnostic Quick Filters */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-600 uppercase tracking-wide text-[10px] flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Diagnóstico:
                </span>
                <select
                  value={diagnosticFilter}
                  onChange={(e) => setDiagnosticFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-150 rounded-xl text-xs font-extrabold text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">Tudo Normal</option>
                  <option value="no-loc">⚠️ Sem Loc/Gaveta ({listings.filter(i => !i.drawer || i.drawer.trim() === '').length})</option>
                  <option value="no-photos">📷 Sem Fotos Reais ({listings.filter(i => !i.customImages || i.customImages.length === 0).length})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Grid of Items */}
          {sortedListings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <Database className="h-12 w-12 text-slate-300 mx-auto stroke-[1.5]" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-700">Nenhum disco encontrado</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {listings.length === 0 
                    ? "Sua coleção está vazia. Comece a extrair e anunciar álbuns na aba de criação e clique em 'Salvar Anúncio'."
                    : "Nenhum disco corresponde aos critérios de pesquisa selecionados acima."}
                </p>
              </div>
              {listings.length === 0 && (
                <button
                  onClick={onSwitchToEditor}
                  className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
                >
                  Ir para Anunciar / Extrair
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="catalog-items-grid">
              {sortedListings.map((item) => {
                const formatName = item.release.formats?.[0]?.name || 'Disco';
                const formattedDate = new Date(item.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });
                const itemStatus = item.status || 'available';

                return (
                  <motion.div
                    key={item.id}
                    layoutId={`card-${item.id}`}
                    className={`bg-white rounded-2xl border overflow-hidden flex flex-col group transition-all relative ${
                      itemStatus === 'sold' 
                        ? 'opacity-85 border-slate-200 shadow-sm' 
                        : itemStatus === 'reserved'
                        ? 'border-amber-200 shadow-sm shadow-amber-50/50 bg-amber-50/10'
                        : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                    }`}
                  >
                    {/* Visual Cover Header */}
                    <div className="relative h-[150px] bg-slate-50 border-b border-slate-200 flex items-center justify-center overflow-hidden">
                      {item.customImages && item.customImages.length > 0 && item.customImages[0] && item.customImages[0].trim() !== '' ? (
                        <img
                          src={item.customImages[0]}
                          alt={item.release.title}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : item.release.coverImage && item.release.coverImage.trim() !== '' ? (
                        <img
                          src={item.release.coverImage}
                          alt={item.release.title}
                          className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-300">
                          {getFormatIcon(formatName, "h-10 w-10")}
                          <span className="text-[10px] font-bold uppercase">{formatName}</span>
                        </div>
                      )}

                      {/* Overlays */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-3 flex items-end justify-between text-white">
                        <span className="text-xs font-black bg-emerald-500 text-white px-2.5 py-1 rounded-xl shadow font-mono">
                          R$ {(itemStatus === 'sold' && item.saleDetails ? item.saleDetails.salePrice : getItemPrice(item)).toFixed(0)}
                        </span>
                        {item.drawer && (
                          <span className="text-[10px] font-bold bg-indigo-950/90 border border-indigo-400/30 text-indigo-200 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                            📁 {item.drawer}
                          </span>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                        {itemStatus === 'sold' ? (
                          <span className="text-[9px] font-black uppercase bg-slate-900 text-slate-300 px-2 py-1 rounded-md backdrop-blur-sm tracking-wider flex items-center gap-1 border border-slate-700">
                            <ShoppingBag className="h-2.5 w-2.5" />
                            Vendido ({item.saleDetails?.platform === 'shopee' ? 'Shopee' : item.saleDetails?.platform === 'mercadolivre' ? 'M. Livre' : 'Direto'})
                          </span>
                        ) : itemStatus === 'reserved' ? (
                          <span className="text-[9px] font-black uppercase bg-amber-500 text-white px-2 py-1 rounded-md backdrop-blur-sm tracking-wider flex items-center gap-1 shadow-sm">
                            <Bookmark className="h-2.5 w-2.5" />
                            Reservado
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-2 py-1 rounded-md backdrop-blur-sm tracking-wider flex items-center gap-1 shadow-sm">
                            <CheckCircle className="h-2.5 w-2.5" />
                            Disponível
                          </span>
                        )}
                      </div>

                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                        <span className="text-[9px] font-black uppercase bg-black/60 text-white px-2 py-0.5 rounded-md backdrop-blur-sm tracking-wider">
                          {item.condition.mediaCondition}
                        </span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 flex-1 flex flex-col space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-mono tracking-wider block">{item.release.year || 'Ano N/D'} • {item.release.label}</span>
                        <h4 className="text-xs font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {item.release.title}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-500 line-clamp-1">{item.release.artist}</p>
                        
                        {item.customerName && (
                          <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1 max-w-fit truncate border mt-1.5 ${
                            itemStatus === 'reserved'
                              ? 'bg-amber-50 text-amber-800 border-amber-200/50'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200/50'
                          }`}>
                            {itemStatus === 'reserved' ? '🔒 Reserva:' : '🤝 Cliente:'} {item.customerName}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] px-2 py-0.5 rounded-md border font-extrabold flex items-center gap-1 ${getFormatBadgeColor(formatName)}`}>
                          {getFormatIcon(formatName, "h-3 w-3")}
                          {formatName}
                        </span>
                        <span className="text-[9px] bg-slate-50 text-slate-600 border border-slate-100 font-medium px-1.5 py-0.5 rounded-md font-mono">
                          Custo: R$ {getItemCost(item).toFixed(0)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono ml-auto font-medium">{formattedDate}</span>
                      </div>

                      {/* Sales Channels Badges */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {(() => {
                          const channels = item.salesChannels || ['physical_store', 'online_store', 'shopee', 'mercadolivre'];
                          return (
                            <>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${channels.includes('physical_store') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400 line-through'}`}>
                                Física
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${channels.includes('online_store') ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-400 line-through'}`}>
                                Online
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${channels.includes('shopee') ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-400 line-through'}`}>
                                Shopee
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${channels.includes('mercadolivre') ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-400 line-through'}`}>
                                ML
                              </span>
                            </>
                          );
                        })()}
                      </div>

                      {/* Store-specific quick operations bar */}
                      <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-between text-xs border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Loja:</span>
                        <div className="flex items-center gap-1">
                          {itemStatus === 'available' && (
                            <>
                              <button
                                onClick={() => openSellModal(item)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                              >
                                <ShoppingBag className="h-3 w-3" />
                                Vender
                              </button>
                              <button
                                onClick={() => openReserveModal(item)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white border border-amber-200 hover:border-amber-500 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                              >
                                <Bookmark className="h-3 w-3" />
                                Reservar
                              </button>
                            </>
                          )}
                          {itemStatus === 'reserved' && (
                            <>
                              <button
                                onClick={() => openSellModal(item)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                              >
                                <ShoppingBag className="h-3 w-3" />
                                Confirmar Venda
                              </button>
                              <button
                                onClick={() => markAsAvailable(item)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                                title="Voltar para Disponível"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Liberar
                              </button>
                            </>
                          )}
                          {itemStatus === 'sold' && (
                            <button
                              onClick={() => markAsAvailable(item)}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                              title="Estornar venda (colocar de volta no estoque)"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Estornar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Actions Area */}
                      <div className="pt-2.5 border-t border-slate-100/80 grid grid-cols-2 gap-1.5 mt-auto">
                        <button
                          onClick={() => setSelectedListing(item)}
                          className="px-2 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[10px] font-black text-slate-700 hover:text-indigo-600 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                          title="Visualizar ficha técnica e detalhes"
                        >
                          <Eye className="h-3 w-3 text-slate-500" />
                          Ficha
                        </button>
                        <button
                          onClick={() => handleLoadToWorkspace(item)}
                          className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-600 border border-indigo-100 text-[10px] font-black text-indigo-700 hover:text-white rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                          title="Carregar no painel para re-anunciar ou editar"
                        >
                          <Sparkles className="h-3 w-3" />
                          Editar
                        </button>
                        <button
                          onClick={() => setQrModalListing(item)}
                          className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                          title="Gerar e imprimir etiqueta com QR Code deste produto"
                        >
                          <QrCode className="h-3 w-3 text-indigo-300" />
                          QR Code
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setThermalPrintListing(item)}
                            className="flex-1 px-1.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 text-amber-900 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                            title="Imprimir Cupom / Etiqueta Térmica (58mm / 80mm)"
                          >
                            <Printer className="h-3 w-3 text-amber-700" />
                            Térmica
                          </button>
                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  onDelete(item.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
                                title="Confirmar exclusão"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-1 bg-slate-100 text-slate-400 rounded-md hover:bg-slate-200 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(item.id)}
                              className="p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                              title="Remover do banco"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* SALES & FINANCIALS INNER TAB VIEW */
        <div className="space-y-6 animate-fadeIn">
          {/* Main Financial Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Faturamento Total Real</span>
              <div className="flex items-baseline gap-1 text-slate-800">
                <span className="text-xs font-bold">R$</span>
                <span className="text-2xl font-black font-mono">{totalRealizedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">De {soldListings.length} discos vendidos</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-100 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">Lucro Líquido Realizado</span>
              <div className="flex items-baseline gap-1 text-emerald-700">
                <span className="text-xs font-bold">R$</span>
                <span className="text-2xl font-black font-mono">{totalActualProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <p className="text-[10px] text-emerald-600 font-semibold">
                Margem média: {totalRealizedRevenue > 0 ? ((totalActualProfit / totalRealizedRevenue) * 100).toFixed(0) : 0}%
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50/30 to-white border border-amber-200 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider block">Contas a Receber</span>
              <div className="flex items-baseline gap-1 text-amber-700">
                <span className="text-xs font-bold">R$</span>
                <span className="text-2xl font-black font-mono">{totalPendingReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <p className="text-[10px] text-amber-600 font-bold">
                {pendingSales.length} parcelas/vendas pendentes
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Capital Recuperado</span>
              <div className="flex items-baseline gap-1 text-slate-800">
                <span className="text-xs font-bold">R$</span>
                <span className="text-2xl font-black font-mono">{totalCostSold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Retorno do valor investido nos discos</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Estoque Disponível</span>
              <div className="flex items-baseline gap-1 text-slate-800 font-mono">
                <span className="text-xs font-bold text-slate-400">R$</span>
                <span className="text-2xl font-black">{totalCostAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Capital imobilizado em {availableListings.length} discos</p>
            </div>
          </div>

          {/* Sales Breakdown and Projected Income Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales by platform */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 col-span-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-indigo-500" />
                Vendas por Plataforma de Venda
              </h3>

              <div className="space-y-3 pt-2">
                {/* Shopee progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      Shopee ({platformSales.shopeeCount || 0} vendas)
                    </span>
                    <span>R$ {platformSales.shopee.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all duration-500" 
                      style={{ width: `${totalRealizedRevenue > 0 ? (platformSales.shopee / totalRealizedRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* ML progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-yellow-400" />
                      Mercado Livre ({platformSales.mercadolivreCount || 0} vendas)
                    </span>
                    <span>R$ {platformSales.mercadolivre.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-500" 
                      style={{ width: `${totalRealizedRevenue > 0 ? (platformSales.mercadolivre / totalRealizedRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Direct / WhatsApp progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Direta / WhatsApp ({platformSales.directCount || 0} vendas)
                    </span>
                    <span>R$ {platformSales.direct.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${totalRealizedRevenue > 0 ? (platformSales.direct / totalRealizedRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Other/Loja progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      Física / Outros ({platformSales.otherCount || 0} vendas)
                    </span>
                    <span>R$ {platformSales.other.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-400 transition-all duration-500" 
                      style={{ width: `${totalRealizedRevenue > 0 ? (platformSales.other / totalRealizedRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Projected Income Card */}
            <div className="bg-gradient-to-br from-indigo-50/50 via-white to-white rounded-2xl border border-indigo-100 p-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  Projeção do Estoque Ativo
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Se você vender todos os {availableListings.length} discos que estão anunciados pelo preço sugerido da Shopee:
                </p>

                <div className="space-y-2.5 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Faturamento Estimado:</span>
                    <strong className="text-slate-700 font-bold font-mono">R$ {totalProjectedRevenue.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Custo do Estoque:</span>
                    <strong className="text-slate-700 font-bold font-mono">R$ {totalCostAvailable.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-indigo-100">
                    <span className="text-indigo-900 font-extrabold">Lucro Projetado Líquido:</span>
                    <strong className="text-indigo-700 font-black font-mono">R$ {totalProjectedProfit.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-center gap-2 text-[10px] text-indigo-700 font-semibold leading-snug mt-4">
                <AlertCircle className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                <span>As vendas diretas no WhatsApp geram até 20% mais lucro livre de taxas!</span>
              </div>
            </div>
          </div>

          {/* Outstanding Receivables Section */}
          {pendingSales.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                    Pendências de Pagamento / Contas a Receber ({pendingSales.length})
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Acompanhe quem comprou e ainda não realizou o acerto de valores.</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Pendente</span>
                  <strong className="text-sm font-black text-amber-700 font-mono">R$ {totalPendingReceivables.toFixed(2)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {pendingSales.map(item => {
                  const details = item.saleDetails!;
                  const customer = customers?.find(c => c.id === item.customerId);
                  const phone = customer?.phone || '';
                  const cleanPhone = phone.replace(/\D/g, '');
                  const messageText = encodeURIComponent(`Olá ${customer?.name || item.customerName || 'amigo(a)'}! Passando para enviar os detalhes da sua compra na Valdir Discos: o álbum *${item.release.title}* por *R$ ${details.salePrice.toFixed(2)}* está registrado. Segue os dados para acerto quando puder. Grande abraço!`);
                  const waUrl = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${messageText}` : null;

                  return (
                    <div key={item.id} className="border border-amber-100 bg-amber-50/10 rounded-xl p-3.5 flex flex-col justify-between hover:border-amber-200 transition-all space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {details.platform === 'shopee' ? 'Shopee' : details.platform === 'mercadolivre' ? 'M. Livre' : 'Direta / WhatsApp'}
                          </span>
                          <span className="text-xs font-black font-mono text-slate-800">R$ {details.salePrice.toFixed(2)}</span>
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-800 truncate leading-tight pt-1">{item.release.title}</h4>
                        <p className="text-[10px] font-bold text-slate-400 truncate leading-none">{item.release.artist}</p>
                        
                        <div className="pt-2 flex items-center gap-1 text-[10px] font-bold text-indigo-950">
                          <span>👤 Cliente:</span>
                          <span className="text-slate-700 font-semibold truncate max-w-[140px]">
                            {item.customerName || 'Avulso / Não Vinculado'}
                          </span>
                        </div>
                        {phone && (
                          <div className="text-[9px] text-slate-400 font-bold block">
                            📞 {phone}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-dashed border-amber-100">
                        <button
                          onClick={() => confirmPendingPayment(item)}
                          className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                          title="Confirmar recebimento do valor"
                        >
                          <Check className="h-3 w-3" />
                          Recebi
                        </button>
                        
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg text-[9px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm text-center"
                            title="Enviar cobrança via WhatsApp"
                          >
                            <Phone className="h-3 w-3" />
                            Cobrar
                          </a>
                        ) : (
                          <button
                            disabled
                            className="py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-extrabold cursor-not-allowed flex items-center justify-center gap-1"
                            title="Cadastre o telefone do cliente para enviar WhatsApp"
                          >
                            Sem Cel.
                          </button>
                        )}

                        <button
                          onClick={() => setReceiptListing(item)}
                          className="py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
                          title="Gerar recibo"
                        >
                          <Copy className="h-3 w-3" />
                          Recibo
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ledger/Historico de Caixa */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Livro Caixa / Registro de Vendas Realizadas</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Consulte, exporte e edite os lançamentos financeiros da loja.</p>
              </div>
              <button
                onClick={exportSalesToCSV}
                disabled={filteredSoldListings.length === 0}
                className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar CSV
              </button>
            </div>

            {/* Sales Filtering Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar disco, artista ou cliente..."
                  value={saleSearch}
                  onChange={(e) => setSaleSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <select
                  value={saleStatusFilter}
                  onChange={(e) => setSaleStatusFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">💳 Todos os pagamentos</option>
                  <option value="pago">✅ Pagamento Pago</option>
                  <option value="pendente">⏳ Pagamento Pendente</option>
                </select>
              </div>

              <div>
                <select
                  value={salePlatformFilter}
                  onChange={(e) => setSalePlatformFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">🛍️ Todas as plataformas</option>
                  <option value="shopee">Shopee</option>
                  <option value="mercadolivre">Mercado Livre</option>
                  <option value="direct">WhatsApp / Venda Direta</option>
                  <option value="other">Outros Canais</option>
                </select>
              </div>

              <div>
                <select
                  value={saleDateRange}
                  onChange={(e) => setSaleDateRange(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">📅 Qualquer período</option>
                  <option value="today">Hoje</option>
                  <option value="week">Últimos 7 dias</option>
                  <option value="month">Últimos 30 dias</option>
                </select>
              </div>
            </div>

            {filteredSoldListings.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium flex flex-col items-center justify-center gap-2">
                <ShoppingBag className="h-8 w-8 text-slate-300" />
                <span>Nenhuma venda corresponde aos filtros de busca aplicados.</span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                      <th className="py-3 px-4">Data Venda</th>
                      <th className="py-3">Disco / Álbum</th>
                      <th className="py-3">Plataforma</th>
                      <th className="py-3">Pagamento</th>
                      <th className="py-3 font-mono text-right">Preço Venda</th>
                      <th className="py-3 font-mono text-right">Taxas Pago</th>
                      <th className="py-3 font-mono text-right">Custo Unitário</th>
                      <th className="py-3 font-mono text-right text-emerald-700">Lucro Líquido</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredSoldListings.map((item) => {
                      const details = item.saleDetails!;
                      const saleDate = new Date(details.soldAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      });

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-4 text-slate-400 text-[10px] font-semibold">{saleDate}</td>
                          <td className="py-3">
                            <span className="font-extrabold text-slate-800 block line-clamp-1">{item.release.title}</span>
                            <span className="text-[10px] text-slate-400 font-bold block">{item.release.artist}</span>
                            {item.customerName && (
                              <span className="text-[9px] text-indigo-600 font-bold block mt-0.5">👤 {item.customerName}</span>
                            )}
                          </td>
                          <td className="py-3">
                            {details.platform === 'shopee' ? (
                              <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[9px] font-black uppercase">Shopee</span>
                            ) : details.platform === 'mercadolivre' ? (
                              <span className="px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200 text-[9px] font-black uppercase">M. Livre</span>
                            ) : details.platform === 'direct' ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase">WhatsApp</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-black uppercase">Física / Outro</span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-col gap-0.5 items-start">
                              {details.paymentStatus === 'pendente' ? (
                                <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold uppercase inline-flex items-center gap-0.5">
                                  ⏳ Pendente
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase inline-flex items-center gap-0.5">
                                  ✅ Pago
                                </span>
                              )}
                              {details.paymentMethod && (
                                <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">
                                  💳 {details.paymentMethod === 'pix' ? 'Pix' : details.paymentMethod === 'dinheiro' ? 'Dinheiro' : details.paymentMethod === 'cartao_credito' ? 'C. Crédito' : details.paymentMethod === 'cartao_debito' ? 'C. Débito' : details.paymentMethod === 'shopee' ? 'Saldo Shopee' : details.paymentMethod === 'mercadolivre' ? 'Mercado Pago' : details.paymentMethod === 'transferencia' ? 'TED/DOC' : details.paymentMethod}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 font-mono font-bold text-right">R$ {details.salePrice.toFixed(2)}</td>
                          <td className="py-3 font-mono text-amber-700 text-right">R$ {(details.feesPaid || 0).toFixed(2)}</td>
                          <td className="py-3 font-mono text-slate-400 text-right">R$ {getItemCost(item).toFixed(2)}</td>
                          <td className="py-3 font-mono text-emerald-700 font-black text-right">R$ {details.netProfit.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditSaleModal(item)}
                                className="px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-[9px] font-black border border-transparent hover:border-indigo-100 transition-all cursor-pointer"
                                title="Editar dados da venda"
                              >
                                Editar
                              </button>
                              
                              <button
                                onClick={() => setReceiptListing(item)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[9px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                title="Visualizar recibo oficial"
                              >
                                Recibo
                              </button>

                              <button
                                onClick={() => markAsAvailable(item)}
                                className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-[9px] font-bold border border-transparent hover:border-rose-100 transition-all cursor-pointer inline-flex items-center gap-1"
                                title="Colocar de volta no estoque ativo"
                              >
                                <RefreshCw className="h-2.5 w-2.5" />
                                Estornar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide-over Right Panel: Full Record Details View */}
      <AnimatePresence>
        {selectedListing && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="listing-detail-overlay">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedListing(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs uppercase font-black text-indigo-600 tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Visualizar Ficha</span>
                </div>
                <button
                  onClick={() => setSelectedListing(null)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* Drawer Body Scroll */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Upper Core Info Flex */}
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* Big Cover art */}
                  <div className="relative h-44 w-44 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200 shadow-md">
                    {selectedListing.customImages && selectedListing.customImages.length > 0 && selectedListing.customImages[0] && selectedListing.customImages[0].trim() !== '' ? (
                      <img
                        src={selectedListing.customImages[0]}
                        alt={selectedListing.release.title}
                        className="h-full w-full object-cover"
                      />
                    ) : selectedListing.release.coverImage && selectedListing.release.coverImage.trim() !== '' ? (
                      <img
                        src={selectedListing.release.coverImage}
                        alt={selectedListing.release.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <Disc className="h-12 w-12" />
                      </div>
                    )}
                  </div>

                  {/* Meta data list */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-extrabold flex items-center gap-1 ${getFormatBadgeColor(selectedListing.release.formats?.[0]?.name || 'Disco')}`}>
                        {getFormatIcon(selectedListing.release.formats?.[0]?.name || 'Disco', "h-3.5 w-3.5")}
                        {selectedListing.release.formats?.[0]?.name || 'Disco'}
                      </span>
                      {selectedListing.drawer && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                          📁 Loc: {selectedListing.drawer}
                        </span>
                      )}
                      
                      {/* Status pill in drawer */}
                      {selectedListing.status === 'sold' ? (
                        <span className="text-[10px] bg-slate-900 text-slate-300 border border-slate-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono uppercase">
                          Vendido
                        </span>
                      ) : selectedListing.status === 'reserved' ? (
                        <span className="text-[10px] bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm uppercase">
                          Reservado
                        </span>
                      ) : selectedListing.status === 'personal' ? (
                        <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm uppercase inline-flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-white" /> Coleção Pessoal
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm uppercase">
                          Disponível
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {selectedListing.release.title}
                    </h3>
                    <p className="text-sm font-bold text-slate-600">{selectedListing.release.artist}</p>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-2 border-t border-slate-100">
                      <div><span className="text-slate-400 block font-medium">Gravadora:</span> <strong className="text-slate-700 font-bold">{selectedListing.release.label}</strong></div>
                      <div><span className="text-slate-400 block font-medium">Nº Catálogo:</span> <strong className="text-slate-700 font-bold font-mono">{selectedListing.release.catno || 'N/D'}</strong></div>
                      <div><span className="text-slate-400 block font-medium">Ano Edição:</span> <strong className="text-slate-700 font-bold">{selectedListing.release.year || 'N/D'}</strong></div>
                      <div><span className="text-slate-400 block font-medium">Preço da Loja:</span> <strong className="text-emerald-600 font-bold text-sm font-mono">R$ {getItemPrice(selectedListing).toFixed(2)}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Status Detail Block */}
                {selectedListing.status === 'sold' && selectedListing.saleDetails && (
                  <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-2 font-medium">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4" />
                      Ficha de Venda Registrada
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs pt-1 font-mono">
                      <div><span className="text-slate-400 font-sans">Data da Venda:</span> <strong className="text-slate-200 font-bold block">{new Date(selectedListing.saleDetails.soldAt).toLocaleDateString('pt-BR')}</strong></div>
                      <div><span className="text-slate-400 font-sans">Canal de Venda:</span> <strong className="text-indigo-300 font-bold block uppercase">{selectedListing.saleDetails.platform}</strong></div>
                      <div><span className="text-slate-400 font-sans">Preço Pago pelo Cliente:</span> <strong className="text-emerald-400 font-black text-sm block">R$ {selectedListing.saleDetails.salePrice.toFixed(2)}</strong></div>
                      <div><span className="text-slate-400 font-sans">Lucro Líquido Realizado:</span> <strong className="text-emerald-400 font-black text-sm block">R$ {selectedListing.saleDetails.netProfit.toFixed(2)}</strong></div>
                      <div>
                        <span className="text-slate-400 font-sans">Status Pagto:</span>
                        <strong className={`block font-bold ${selectedListing.saleDetails.paymentStatus === 'pendente' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {selectedListing.saleDetails.paymentStatus === 'pendente' ? '⏳ PENDENTE' : '✅ PAGO'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans">Forma Pagto:</span>
                        <strong className="text-slate-200 font-bold block uppercase">
                          {selectedListing.saleDetails.paymentMethod === 'pix' ? 'Pix' : 
                           selectedListing.saleDetails.paymentMethod === 'dinheiro' ? 'Dinheiro' : 
                           selectedListing.saleDetails.paymentMethod === 'cartao_credito' ? 'C. Crédito' : 
                           selectedListing.saleDetails.paymentMethod === 'cartao_debito' ? 'C. Débito' : 
                           selectedListing.saleDetails.paymentMethod === 'shopee' ? 'Saldo Shopee' : 
                           selectedListing.saleDetails.paymentMethod === 'mercadolivre' ? 'Mercado Pago' : 
                           selectedListing.saleDetails.paymentMethod === 'transferencia' ? 'TED/DOC' : 
                           selectedListing.saleDetails.paymentMethod || '-'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo Gallery (if custom images exist) */}
                {selectedListing.customImages && selectedListing.customImages.filter(img => img && img.trim() !== '').length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fotos Reais do Produto</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {selectedListing.customImages.filter(img => img && img.trim() !== '').map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="h-20 w-20 border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:scale-95 transition-transform flex-shrink-0">
                          <img src={img} alt={`Fotos reais ${i + 1}`} className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personal Collection Destination & Status Actions */}
                <div className="space-y-3 bg-rose-50/30 border border-rose-200/60 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                      <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                      Destinação do Acervo
                    </h4>
                  </div>

                  {selectedListing.status === 'personal' ? (
                    <div className="space-y-3">
                      <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
                        💝 Este disco faz parte da sua <strong>Coleção Pessoal</strong> privada. Ele não é contabilizado no estoque de vendas da loja.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedListing = {
                            ...selectedListing,
                            status: 'available' as const,
                            saleDetails: undefined
                          };
                          onUpdate(updatedListing);
                          setSelectedListing(updatedListing);
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        Disponibilizar para Venda (Mover para Estoque)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        🛍️ Este disco está catalogado no <strong>Estoque de Vendas</strong> da loja. Ele está ativo para comercialização nos canais.
                      </p>
                      {selectedListing.status !== 'sold' && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedListing = {
                              ...selectedListing,
                              status: 'personal' as const,
                              saleDetails: undefined
                            };
                            onUpdate(updatedListing);
                            setSelectedListing(updatedListing);
                          }}
                          className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Heart className="h-3.5 w-3.5 fill-rose-600" />
                          Retirar de Venda e Guardar na Coleção Pessoal
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Physical Grading / Avaliação do Valdir */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-indigo-500" />
                    Avaliação Física e Conservação (Valdir Discos)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Media */}
                    <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-150 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium uppercase tracking-wider text-[9px]">Conservação do Disco</span>
                        <span className="bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded text-[10px] shadow-sm font-mono">{selectedListing.condition.mediaCondition}</span>
                      </div>
                      <p className="font-bold text-slate-700">
                        {selectedListing.condition.mediaCondition} - {
                          selectedListing.condition.mediaCondition === 'SEM_DISCO' ? 'Apenas Capa (Sem Disco)' :
                          selectedListing.condition.mediaCondition === 'M' ? 'Novo Lacrado' : 
                          selectedListing.condition.mediaCondition === 'NM' ? 'Como Novo / Impecável' : 
                          selectedListing.condition.mediaCondition === 'VG+' ? 'Excelente' : 
                          selectedListing.condition.mediaCondition === 'VG' ? 'Muito Bom' : 
                          selectedListing.condition.mediaCondition === 'G+' ? 'Bom / Satisfatório' : 'Regular'
                        }
                      </p>
                      {selectedListing.condition.mediaDetails && (
                        <p className="text-[10px] text-slate-500 italic border-t border-slate-100 pt-1 mt-1 font-medium">"{selectedListing.condition.mediaDetails}"</p>
                      )}
                    </div>

                    {/* Sleeve */}
                    <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-150 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium uppercase tracking-wider text-[9px]">Conservação da Capa</span>
                        <span className="bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded text-[10px] shadow-sm font-mono">{selectedListing.condition.sleeveCondition}</span>
                      </div>
                      <p className="font-bold text-slate-700">
                        {selectedListing.condition.sleeveCondition} - {
                          selectedListing.condition.sleeveCondition === 'SEM_CAPA' ? 'Apenas Disco (Sem Capa)' :
                          selectedListing.condition.sleeveCondition === 'M' ? 'Nova Lacrada' : 
                          selectedListing.condition.sleeveCondition === 'NM' ? 'Como Nova' : 
                          selectedListing.condition.sleeveCondition === 'VG+' ? 'Excelente' : 
                          selectedListing.condition.sleeveCondition === 'VG' ? 'Muito Boa' : 
                          selectedListing.condition.sleeveCondition === 'G+' ? 'Boa com Detalhes' : 'Regular'
                        }
                      </p>
                      {selectedListing.condition.sleeveDetails && (
                        <p className="text-[10px] text-slate-500 italic border-t border-slate-100 pt-1 mt-1 font-medium">"{selectedListing.condition.sleeveDetails}"</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tracklist Display */}
                {selectedListing.release.tracklist && selectedListing.release.tracklist.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Play className="h-3.5 w-3.5 text-indigo-500" />
                      Faixas do Álbum ({selectedListing.release.tracklist.length})
                    </h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs max-h-[160px] overflow-y-auto font-medium text-slate-700 divide-y divide-slate-200/50">
                      {selectedListing.release.tracklist.map((track, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                          <span className="font-mono text-slate-400 font-semibold w-8">{track.position || (i + 1)}</span>
                          <span className="flex-1 truncate pr-3 text-slate-800">{track.title}</span>
                          {track.duration && <span className="text-[10px] font-mono text-slate-400">{track.duration}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing Details */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalhamento de Custos e Margens</h4>
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Custo Unitário (Disco + Luva)</span>
                      <span className="text-sm font-mono text-slate-800 font-bold">
                        R$ {getItemCost(selectedListing).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Margem de Lucro Desejada</span>
                      <span className="text-sm font-mono text-slate-800 font-bold">{selectedListing.pricing.profitMarginPercent}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Comissão da Shopee</span>
                      <span className="text-sm font-mono text-amber-700 font-bold">
                        R$ {((selectedListing.shopee.suggestedPrice * (selectedListing.pricing.shopeeCommissionPercent / 100)) + selectedListing.pricing.shopeeFixedFee).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Preço de Venda Sugerido</span>
                      <span className="text-sm font-black text-emerald-700 font-mono text-base">R$ {selectedListing.shopee.suggestedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code & Thermal Print Quick Action Box */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                        <QrCode className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Etiquetas Físicas e QR Code</h4>
                        <p className="text-[10px] text-indigo-200">Gere etiquetas adesivas ou cupons térmicos para colar na capa</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setQrModalListing(selectedListing)}
                      className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <QrCode className="h-4 w-4 text-indigo-600" />
                      Ver / Imprimir QR Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setThermalPrintListing(selectedListing)}
                      className="py-2.5 px-3 bg-indigo-700/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-indigo-500/50"
                    >
                      <Printer className="h-4 w-4 text-indigo-200" />
                      Cupom Térmico (58/80mm)
                    </button>
                  </div>
                </div>

                {/* Copyable Content Blocks */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Copiar Dados para o Anúncio</h4>
                    <span className="text-[10px] font-extrabold bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200 uppercase">Shopee</span>
                  </div>

                  {/* Copy Shopee Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">Título do Anúncio:</span>
                      <button
                        onClick={() => triggerCopy(selectedListing.shopee.title, 'shopee-title')}
                        className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'shopee-title' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-black">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar Título</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 break-all select-all">
                      {selectedListing.shopee.title}
                    </div>
                  </div>

                  {/* Copy Shopee Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">Descrição Completa:</span>
                      <button
                        onClick={() => triggerCopy(selectedListing.shopee.description, 'shopee-desc')}
                        className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'shopee-desc' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-black">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar Descrição</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 whitespace-pre-wrap font-sans max-h-[220px] overflow-y-auto break-words leading-relaxed select-all">
                      {selectedListing.shopee.description}
                    </pre>
                  </div>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
                <button
                  onClick={() => handleLoadToWorkspace(selectedListing)}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-100 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  Carregar no Editor e Alterar
                </button>
                <button
                  onClick={() => {
                    if (confirm("Tem certeza que deseja excluir este disco definitivamente?")) {
                      onDelete(selectedListing.id);
                      setSelectedListing(null);
                    }
                  }}
                  className="px-4 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sell Confirmation Modal */}
      <AnimatePresence>
        {sellingListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSellingListing(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-emerald-600" />
                  Registrar Venda
                </h3>
                <button onClick={() => setSellingListing(null)} className="p-1 hover:bg-slate-200 rounded-lg cursor-pointer">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Disco Vendendo</span>
                  <p className="text-xs font-black text-slate-800 truncate">{sellingListing.release.title}</p>
                  <p className="text-[10px] font-bold text-slate-500">{sellingListing.release.artist}</p>
                </div>

                {/* Form fields */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  
                  {/* Platform Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Canal de Venda:</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handlePlatformChange('shopee', salePrice)}
                        className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          salePlatform === 'shopee'
                            ? 'bg-orange-50 border-orange-500 text-orange-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Shopee
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePlatformChange('mercadolivre', salePrice)}
                        className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          salePlatform === 'mercadolivre'
                            ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Mercado Livre
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePlatformChange('direct', salePrice)}
                        className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          salePlatform === 'direct'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Direto (WhatsApp)
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePlatformChange('other', salePrice)}
                        className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          salePlatform === 'other'
                            ? 'bg-slate-50 border-slate-400 text-slate-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Física / Outros
                      </button>
                    </div>
                  </div>

                  {/* Multi-Platform Screenshot / Print Parser */}
                  <div className={`p-3 rounded-xl border space-y-2 transition-all ${
                    salePlatform === 'shopee' ? 'bg-orange-50/50 border-orange-200' :
                    salePlatform === 'mercadolivre' ? 'bg-yellow-50/40 border-yellow-200' :
                    salePlatform === 'direct' ? 'bg-emerald-50/40 border-emerald-200' :
                    'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${
                        salePlatform === 'shopee' ? 'text-orange-700' :
                        salePlatform === 'mercadolivre' ? 'text-yellow-800' :
                        salePlatform === 'direct' ? 'text-emerald-700' :
                        'text-slate-700'
                      }`}>
                        📸 Importar Print de Venda ou Comprovante (Smart)
                      </span>
                      {isParsingPrint && (
                        <span className="text-[9px] text-indigo-600 font-bold animate-pulse flex items-center gap-1">
                          <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-ping" />
                          IA Lendo...
                        </span>
                      )}
                    </div>
                    
                    <div className={`relative border rounded-lg bg-white p-2.5 flex flex-col items-center justify-center transition-all cursor-pointer ${
                      salePlatform === 'shopee' ? 'border-orange-100 hover:bg-orange-50/20' :
                      salePlatform === 'mercadolivre' ? 'border-yellow-100 hover:bg-yellow-50/20' :
                      salePlatform === 'direct' ? 'border-emerald-100 hover:bg-emerald-50/20' :
                      'border-slate-200 hover:bg-slate-100/50'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePrintUpload}
                        disabled={isParsingPrint}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="text-center space-y-1">
                        <span className="text-[10px] font-bold text-slate-600 block">
                          {isParsingPrint ? '⏳ Interpretando imagem com Gemini AI...' : 'Carregar print/screenshot da venda'}
                        </span>
                        <span className="text-[8px] text-slate-400 block font-medium">
                          Funciona com Shopee, Mercado Livre, Pix, WhatsApp, etc.
                        </span>
                      </div>
                    </div>

                    {printParseError && (
                      <div className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{printParseError}</span>
                      </div>
                    )}

                    {printParseSuccess && (
                      <div className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 shrink-0 text-emerald-600" />
                        <span>{printParseSuccess}</span>
                      </div>
                    )}
                  </div>

                  {/* Customer Selection */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Vincular Cliente:</label>
                      <button
                        type="button"
                        onClick={() => setIsAddingSaleCustomer(!isAddingSaleCustomer)}
                        className="text-[9px] text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        {isAddingSaleCustomer ? 'Selecionar Existente' : '+ Criar Novo Rápido'}
                      </button>
                    </div>

                    {isAddingSaleCustomer ? (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <input
                          type="text"
                          placeholder="Nome Completo *"
                          value={newSaleCustomerName}
                          onChange={(e) => setNewSaleCustomerName(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="WhatsApp"
                            value={newSaleCustomerPhone}
                            onChange={(e) => setNewSaleCustomerPhone(e.target.value)}
                            className="col-span-1 w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Cidade"
                            value={newSaleCustomerCity}
                            onChange={(e) => setNewSaleCustomerCity(e.target.value)}
                            className="col-span-1.5 w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] outline-none"
                          />
                          <input
                            type="text"
                            placeholder="UF"
                            maxLength={2}
                            value={newSaleCustomerState}
                            onChange={(e) => setNewSaleCustomerState(e.target.value)}
                            className="col-span-0.5 w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] outline-none uppercase font-bold"
                          />
                        </div>
                      </div>
                    ) : (
                      <select
                        value={selectedSaleCustomerId}
                        onChange={(e) => setSelectedSaleCustomerId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="">-- Sem cliente vinculado --</option>
                        {customers?.map(c => (
                          <option key={c.id} value={c.id}>{c.name} {c.city ? `(${c.city}-${c.state})` : ''}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Pricing field */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Preço de Venda (R$):</label>
                      <input
                        type="number"
                        value={salePrice}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setSalePrice(val);
                          handlePlatformChange(salePlatform, val);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Taxas Cobradas (R$):</label>
                      <input
                        type="number"
                        disabled={salePlatform === 'direct'}
                        value={saleFees}
                        onChange={(e) => setSaleFees(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Payment Details (Paid/Pending and Payment Method) */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Status do Pagamento:</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPaymentStatus('pago')}
                          className={`py-1.5 rounded-xl border text-center text-[10px] font-bold transition-all cursor-pointer ${
                            paymentStatus === 'pago'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Pago
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentStatus('pendente')}
                          className={`py-1.5 rounded-xl border text-center text-[10px] font-bold transition-all cursor-pointer ${
                            paymentStatus === 'pendente'
                              ? 'bg-amber-50 border-amber-500 text-amber-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Pendente
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Forma de Pagamento:</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 cursor-pointer h-[32px]"
                      >
                        <option value="pix">Pix</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="shopee">Saldo Shopee</option>
                        <option value="mercadolivre">Mercado Pago</option>
                        <option value="transferencia">TED / Transferência</option>
                        <option value="outro">Outro / Permuta</option>
                      </select>
                    </div>
                  </div>

                  {/* Math Profit Indicator block */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs flex justify-between items-center font-semibold text-slate-600">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Lucro Líquido Estimado</span>
                      <span className="text-[10px] text-slate-400 font-medium font-sans">
                        Faturamento R$ {salePrice.toFixed(2)} - Custo R$ {getItemCost(sellingListing).toFixed(2)} - Taxas R$ {saleFees.toFixed(2)}
                      </span>
                    </div>
                    <strong className="text-emerald-700 text-base font-black font-mono">
                      R$ {(salePrice - getItemCost(sellingListing) - saleFees).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSellingListing(null)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-100 text-xs font-bold rounded-xl text-slate-500 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submitSale}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-100 cursor-pointer"
                >
                  Confirmar Venda
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Sale Modal */}
      <AnimatePresence>
        {editingSaleListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingSaleListing(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col z-10"
            >
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Edit3 className="h-4 w-4 text-indigo-600" />
                  Editar Dados da Venda
                </h3>
                <button onClick={() => setEditingSaleListing(null)} className="p-1 hover:bg-slate-200 rounded-lg cursor-pointer">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Álbum Vendido</span>
                  <p className="text-xs font-black text-slate-800 truncate">{editingSaleListing.release.title}</p>
                  <p className="text-[10px] font-bold text-slate-500">{editingSaleListing.release.artist}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {/* Platform */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Plataforma de Venda:</label>
                    <select
                      value={editSalePlatform}
                      onChange={(e) => setEditSalePlatform(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="shopee">Shopee</option>
                      <option value="mercadolivre">Mercado Livre</option>
                      <option value="direct">WhatsApp / Venda Direta</option>
                      <option value="other">Física / Outros</option>
                    </select>
                  </div>

                  {/* Pricing and Fees */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Valor Pago (R$):</label>
                      <input
                        type="number"
                        value={editSalePrice}
                        onChange={(e) => setEditSalePrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Taxas Canal (R$):</label>
                      <input
                        type="number"
                        value={editSaleFees}
                        onChange={(e) => setEditSaleFees(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Payment status & method */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Status Pagamento:</label>
                      <select
                        value={editPaymentStatus}
                        onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="pago">Pago</option>
                        <option value="pendente">Pendente</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Forma Pagto:</label>
                      <select
                        value={editPaymentMethod}
                        onChange={(e) => setEditPaymentMethod(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="pix">Pix</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="shopee">Saldo Shopee</option>
                        <option value="mercadolivre">Mercado Pago</option>
                        <option value="transferencia">TED / Transferência</option>
                        <option value="outro">Outro / Permuta</option>
                      </select>
                    </div>
                  </div>

                  {/* Math Profit Indicator */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-xs flex justify-between items-center font-semibold text-slate-600">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Novo Lucro Líquido</span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        Custo Unitário: R$ {getItemCost(editingSaleListing).toFixed(2)}
                      </span>
                    </div>
                    <strong className="text-indigo-700 text-base font-black font-mono">
                      R$ {(editSalePrice - getItemCost(editingSaleListing) - editSaleFees).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSaleListing(null)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-100 text-xs font-bold rounded-xl text-slate-500 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submitEditSale}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Drawer / Modal */}
      <AnimatePresence>
        {receiptListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setReceiptListing(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col z-10"
            >
              <div className="p-4 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-100">
                    Recibo Oficial / Comprovante
                  </h3>
                </div>
                <button onClick={() => setReceiptListing(null)} className="p-1 hover:bg-slate-800 rounded-lg cursor-pointer">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              {/* Printable Receipt Area */}
              <div className="p-6 bg-amber-50/10 space-y-6 flex-1 overflow-y-auto font-sans text-slate-800 text-xs">
                {/* Simulated Thermal Paper */}
                <div className="border border-amber-200/50 bg-yellow-50/20 rounded-2xl p-5 shadow-inner space-y-4 relative">
                  {/* Jagged border graphic at the top */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-[linear-gradient(45deg,transparent_33.333%,#f8fafc_33.333%,#f8fafc_66.667%,transparent_66.667%)] bg-[size:10px_10px] -mt-1" />
                  
                  <div className="text-center space-y-1 border-b border-dashed border-slate-200 pb-3">
                    <h2 className="text-sm font-black tracking-wide text-slate-900 uppercase">Valdir Discos & Antiguidades</h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sebo de Vinis • Relíquias Históricas</p>
                    <p className="text-[8px] text-slate-400 font-medium">Contatos: (11) 98765-4321 • São Paulo / SP</p>
                  </div>

                  {/* Album Data */}
                  <div className="space-y-2 border-b border-dashed border-slate-200 pb-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Item Vendido</span>
                      <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        #{receiptListing.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-slate-900 leading-tight">{receiptListing.release.title}</h4>
                      <p className="text-[10px] font-bold text-slate-500">{receiptListing.release.artist}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-400 uppercase pt-1">
                      <div>Formato: <span className="text-slate-600 font-semibold">{receiptListing.release.formats?.[0]?.name || 'Disco Vinil'}</span></div>
                      <div>Estado Mídia: <span className="text-slate-600 font-semibold">{receiptListing.condition.mediaCondition || 'N/A'}</span></div>
                    </div>
                  </div>

                  {/* Customer Data */}
                  <div className="space-y-1.5 border-b border-dashed border-slate-200 pb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Informações da Operação</span>
                    <div className="space-y-1 font-semibold text-slate-600">
                      <div className="flex justify-between">
                        <span>Cliente:</span>
                        <strong className="text-slate-900">{receiptListing.customerName || 'Consumidor Final'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Compra:</span>
                        <span>{new Date(receiptListing.saleDetails?.soldAt || '').toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Canal de Venda:</span>
                        <span className="uppercase">{receiptListing.saleDetails?.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Forma de Pagto:</span>
                        <span className="uppercase">{receiptListing.saleDetails?.paymentMethod || 'Pix'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Total pricing */}
                  <div className="flex justify-between items-center bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-xs font-extrabold text-slate-900">VALOR TOTAL DO PEDIDO:</span>
                    <strong className="text-sm font-black text-slate-900 font-mono">
                      R$ {receiptListing.saleDetails?.salePrice.toFixed(2)}
                    </strong>
                  </div>

                  <div className="text-center pt-2">
                    {receiptListing.saleDetails?.paymentStatus === 'pendente' ? (
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase inline-flex items-center gap-1">
                        ⏳ Pagamento Pendente / Em Aberto
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase inline-flex items-center gap-1">
                        ✅ Transação Paga & Confirmada
                      </span>
                    )}
                  </div>

                  <p className="text-[8px] text-slate-400 text-center font-medium leading-relaxed italic pt-1">
                    "Colecionar música é preservar os sentimentos de uma geração inteira em formato de microssulcos de plástico." • Obrigado pela parceria!
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptListing(null)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-100 text-xs font-bold rounded-xl text-slate-500 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => copyReceiptText(receiptListing)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-100 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Copy className="h-4 w-4" />
                  {receiptCopied ? 'Copiado!' : 'Copiar p/ Zap'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reserve Confirmation Modal */}
      <AnimatePresence>
        {reservingListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setReservingListing(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Bookmark className="h-4 w-4 text-amber-500" />
                  Reservar Disco
                </h3>
                <button onClick={() => setReservingListing(null)} className="p-1 hover:bg-slate-200 rounded-lg cursor-pointer">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Álbum a Reservar</span>
                  <p className="text-xs font-black text-slate-800 truncate">{reservingListing.release.title}</p>
                  <p className="text-[10px] font-bold text-slate-500">{reservingListing.release.artist}</p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Vincular Cliente:</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingReserveCustomer(!isAddingReserveCustomer)}
                      className="text-[9px] text-amber-700 font-bold hover:underline cursor-pointer"
                    >
                      {isAddingReserveCustomer ? 'Selecionar Existente' : '+ Criar Novo Rápido'}
                    </button>
                  </div>

                  {isAddingReserveCustomer ? (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <input
                        type="text"
                        placeholder="Nome Completo *"
                        value={newReserveCustomerName}
                        onChange={(e) => setNewReserveCustomerName(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="WhatsApp"
                          value={newReserveCustomerPhone}
                          onChange={(e) => setNewReserveCustomerPhone(e.target.value)}
                          className="col-span-1 w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Cidade"
                          value={newReserveCustomerCity}
                          onChange={(e) => setNewReserveCustomerCity(e.target.value)}
                          className="col-span-1.5 w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="UF"
                          maxLength={2}
                          value={newReserveCustomerState}
                          onChange={(e) => setNewReserveCustomerState(e.target.value)}
                          className="col-span-0.5 w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] outline-none uppercase font-bold"
                        />
                      </div>
                    </div>
                  ) : (
                    <select
                      value={selectedReserveCustomerId}
                      onChange={(e) => setSelectedReserveCustomerId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="">-- Sem cliente vinculado --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.city ? `(${c.city}-${c.state})` : ''}</option>
                      ))}
                    </select>
                  )}

                  <label className="text-[10px] font-bold text-slate-400 uppercase block mt-3">Observações da Reserva / Detalhes:</label>
                  <textarea
                    placeholder="Ex: Reservado para o Daniel de SP até sexta-feira."
                    rows={3}
                    value={reserveNote}
                    onChange={(e) => setReserveNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium text-slate-700"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReservingListing(null)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-100 text-xs font-bold rounded-xl text-slate-500 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submitReservation}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-100 cursor-pointer"
                >
                  Confirmar Reserva
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Batch QR Code Labels Modal */}
      <BatchQRCodeModal
        isOpen={isBatchQrModalOpen}
        onClose={() => setIsBatchQrModalOpen(false)}
        listings={listings}
      />

      {/* Dedicated Individual Product QR Code Modal */}
      <DiscQRCodeModal
        isOpen={!!qrModalListing}
        onClose={() => setQrModalListing(null)}
        listing={qrModalListing}
        onSaveLabel={(label) => {
          if (qrModalListing) {
            onUpdate({
              ...qrModalListing,
              customLabel: label
            });
          }
        }}
      />

      {/* Dedicated Thermal Print Modal */}
      <ThermalPrintModal
        isOpen={!!thermalPrintListing}
        onClose={() => setThermalPrintListing(null)}
        listing={thermalPrintListing}
        onSaveLabel={(label) => {
          if (thermalPrintListing) {
            onUpdate({
              ...thermalPrintListing,
              customLabel: label
            });
          }
        }}
      />
    </div>
  );
};

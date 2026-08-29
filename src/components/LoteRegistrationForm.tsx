/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Package, 
  Sparkles, 
  Disc, 
  Plus, 
  Trash2, 
  Download, 
  RefreshCw, 
  Search, 
  Check, 
  Tag, 
  Percent, 
  Gift, 
  Layers, 
  Eye, 
  ArrowRight,
  SlidersHorizontal,
  X,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { SavedListing, LoteItem, DiscogsRelease, ConditionSelection, PricingConfig } from '../types';
import { MAJOR_GENRE_GROUPS, getAllAvailableSubstyles, saveCustomSubstyle } from '../constants/musicGenres';

interface LoteRegistrationFormProps {
  catalogListings: SavedListing[];
  onSaveLote: (newListing: SavedListing) => void;
  onCancel?: () => void;
}

export const LoteRegistrationForm: React.FC<LoteRegistrationFormProps> = ({
  catalogListings,
  onSaveLote,
  onCancel
}) => {
  // Slots for the 4 items (up to 4 items)
  const [selectedItems, setSelectedItems] = useState<(LoteItem | null)[]>([null, null, null, null]);
  
  // Picker modal state
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');

  // Lote general configuration
  const [title, setTitle] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [format, setFormat] = useState('Vinil LP');
  const [drawer, setDrawer] = useState('LOTE-01');
  const [conditionSummary, setConditionSummary] = useState('VG+ / EX (Ótimo Estado)');

  // Pricing & Promotion
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(15); // default 15% OFF as requested
  const [promoActive, setPromoActive] = useState<boolean>(true);
  const [promoBadge, setPromoBadge] = useState<string>('15% OFF');
  const [bonusDescription, setBonusDescription] = useState<string>('Bônus: Plásticos protetores novos inclusos em todos os 4 discos + Embalagem reforçada');
  
  // Canvas image generation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string>('');
  const [badgeOverlayText, setBadgeOverlayText] = useState('LOTE 4 DISCOS');
  const [showBadgeOverlay, setShowBadgeOverlay] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Selected styles & tags
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [newSubstyleInput, setNewSubstyleInput] = useState('');

  // Available substyles from taxonomy and dynamic storage
  const [allSubstyles, setAllSubstyles] = useState<string[]>([]);

  useEffect(() => {
    setAllSubstyles(getAllAvailableSubstyles());
  }, []);

  // Filtered available inventory items for the picker modal
  const availableInventory = useMemo(() => {
    return catalogListings.filter(item => {
      if (item.status === 'sold') return false;
      if (item.isLote) return false; // Avoid nesting lotes inside lotes
      
      const q = searchFilter.toLowerCase().trim();
      if (!q && genreFilter === 'all') return true;

      const artist = (item.release?.artist || '').toLowerCase();
      const titleStr = (item.release?.title || '').toLowerCase();
      const catno = (item.release?.catno || '').toLowerCase();
      const barcode = (item.barcode || '').toLowerCase();
      const styles = (item.release?.styles || []).join(' ').toLowerCase();
      const genres = (item.release?.genres || []).join(' ').toLowerCase();

      const matchesText = !q || (
        artist.includes(q) || 
        titleStr.includes(q) || 
        catno.includes(q) || 
        barcode.includes(q) || 
        styles.includes(q) || 
        genres.includes(q)
      );

      const matchesGenre = genreFilter === 'all' || 
        styles.includes(genreFilter.toLowerCase()) || 
        genres.includes(genreFilter.toLowerCase());

      return matchesText && matchesGenre;
    });
  }, [catalogListings, searchFilter, genreFilter]);

  // Sum of individual items prices
  const sumOriginalPrices = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      if (!item) return acc;
      return acc + (item.price || 0);
    }, 0);
  }, [selectedItems]);

  // Calculated promotional price
  const finalPrice = useMemo(() => {
    if (customPrice !== null && customPrice > 0) return customPrice;
    if (promoActive && discountPercent > 0) {
      const discounted = sumOriginalPrices * (1 - discountPercent / 100);
      return Math.round(discounted);
    }
    return sumOriginalPrices;
  }, [sumOriginalPrices, customPrice, promoActive, discountPercent]);

  const savingsAmount = useMemo(() => {
    return Math.max(0, sumOriginalPrices - finalPrice);
  }, [sumOriginalPrices, finalPrice]);

  // Auto-generate title and styles when items change
  useEffect(() => {
    const validItems = selectedItems.filter((it): it is LoteItem => it !== null);
    if (validItems.length === 0) return;

    if (!title || title.startsWith('Lote ')) {
      const artistsList = Array.from(new Set(validItems.map(it => it.artist))).slice(0, 4).join(' / ');
      const newTitle = `Lote ${validItems.length} Discos Vinil LP - ${artistsList}`;
      setTitle(newTitle);
    }

    // Auto merge genres & styles
    const collectedStyles = new Set<string>();
    const collectedGenres = new Set<string>();
    
    validItems.forEach(it => {
      const match = catalogListings.find(l => l.id === it.id);
      if (match) {
        (match.release.genres || []).forEach(g => collectedGenres.add(g));
        (match.release.styles || []).forEach(s => collectedStyles.add(s));
      }
    });

    if (collectedGenres.size > 0 && selectedGenres.length === 0) {
      setSelectedGenres(Array.from(collectedGenres).slice(0, 3));
    }
    if (collectedStyles.size > 0 && selectedStyles.length === 0) {
      setSelectedStyles(Array.from(collectedStyles).slice(0, 6));
    }
  }, [selectedItems, catalogListings]);

  // Generate composite 2x2 grid image on HTML5 Canvas
  const generateCompositeImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGeneratingImage(true);

    const size = 1000;
    canvas.width = size;
    canvas.height = size;

    // Background fill
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    const half = size / 2;
    const padding = 6; // separator line width

    // Define positions for 2x2 grid
    const positions = [
      { x: 0, y: 0, w: half - padding / 2, h: half - padding / 2 },
      { x: half + padding / 2, y: 0, w: half - padding / 2, h: half - padding / 2 },
      { x: 0, y: half + padding / 2, w: half - padding / 2, h: half - padding / 2 },
      { x: half + padding / 2, y: half + padding / 2, w: half - padding / 2, h: half - padding / 2 }
    ];

    // Helper to load image safely
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          // If direct load fails and it wasn't already proxied, try via backend image proxy
          if (src.startsWith('http') && !src.includes('/api/image-proxy')) {
            const proxyImg = new Image();
            proxyImg.crossOrigin = 'anonymous';
            proxyImg.onload = () => resolve(proxyImg);
            proxyImg.onerror = () => reject(new Error('Failed to load image via proxy'));
            proxyImg.src = `/api/image-proxy?url=${encodeURIComponent(src)}`;
            return;
          }
          reject(new Error('Failed to load image'));
        };
        
        // If it's a remote URL, proactively use image-proxy to ensure CORS headers are present
        if (src.startsWith('http') && !src.startsWith(window.location.origin) && !src.includes('/api/image-proxy')) {
          img.src = `/api/image-proxy?url=${encodeURIComponent(src)}`;
        } else {
          img.src = src;
        }
      });
    };

    // Draw each item in its quadrant
    for (let i = 0; i < 4; i++) {
      const item = selectedItems[i];
      const pos = positions[i];

      if (item && item.coverImage) {
        try {
          const img = await loadImage(item.coverImage);
          // Draw image cropped to square
          ctx.save();
          ctx.beginPath();
          ctx.rect(pos.x, pos.y, pos.w, pos.h);
          ctx.clip();
          
          const imgAspect = img.width / img.height;
          let drawW = pos.w;
          let drawH = pos.h;
          let offX = pos.x;
          let offY = pos.y;

          if (imgAspect > 1) {
            drawW = pos.h * imgAspect;
            offX = pos.x - (drawW - pos.w) / 2;
          } else {
            drawH = pos.w / imgAspect;
            offY = pos.y - (drawH - pos.h) / 2;
          }

          ctx.drawImage(img, offX, offY, drawW, drawH);
          ctx.restore();

          // Subtle inner border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 2;
          ctx.strokeRect(pos.x, pos.y, pos.w, pos.h);

          // Subtle number badge (1, 2, 3, 4) in the corner
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(pos.x + 12, pos.y + 12, 32, 32, 8);
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${i + 1}`, pos.x + 28, pos.y + 28);
        } catch {
          // Fallback placeholder for slot
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 24px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Disco ${i + 1}`, pos.x + pos.w / 2, pos.y + pos.h / 2 - 10);
          ctx.font = '16px Inter, sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(item.title || 'Sem Capa', pos.x + pos.w / 2, pos.y + pos.h / 2 + 20);
        }
      } else {
        // Empty slot placeholder
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(pos.x + 20, pos.y + 20, pos.w - 40, pos.h - 40);
        ctx.setLineDash([]);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Disco ${i + 1}`, pos.x + pos.w / 2, pos.y + pos.h / 2 - 10);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('(Item não selecionado)', pos.x + pos.w / 2, pos.y + pos.h / 2 + 18);
      }
    }

    // Grid divider cross lines
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(half - padding / 2, 0, padding, size);
    ctx.fillRect(0, half - padding / 2, size, padding);

    // Center Badge Overlay if enabled
    if (showBadgeOverlay) {
      const badgeW = 380;
      const badgeH = 76;
      const badgeX = (size - badgeW) / 2;
      const badgeY = (size - badgeH) / 2;

      // Glow / Shadow behind badge
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 4;

      // Badge gradient background
      const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 16);
      ctx.fill();

      // Golden border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // Badge top label
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('VALDIR DISCOS • ESPECIAL', size / 2, badgeY + 14);

      // Badge main text
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px Inter, sans-serif';
      ctx.fillText(badgeOverlayText || 'LOTE 4 DISCOS', size / 2, badgeY + 36);
    }

    // Bottom banner bar: Valdir Discos Acervo
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(0, size - 44, size, 44);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VALDIR DISCOS • DISCOS DE VINIL HIGIENIZADOS • FOTOS ORIGINAIS', size / 2, size - 22);

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setGeneratedCoverUrl(dataUrl);
    } catch (err) {
      console.warn('Canvas export tainted, using fallback cover:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Re-generate photo whenever items or badge text change
  useEffect(() => {
    const validCount = selectedItems.filter(Boolean).length;
    if (validCount > 0) {
      const timer = setTimeout(() => {
        generateCompositeImage();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedItems, badgeOverlayText, showBadgeOverlay]);

  // Handle selecting an item from the catalog into a slot
  const handleSelectItemForSlot = (listing: SavedListing) => {
    if (activeSlotIdx === null) return;

    const itemPrice = listing.pricing?.directPrice || listing.pricing?.basePriceBrl || 0;
    const cover = (listing.customImages && listing.customImages[0]) || listing.release?.coverImage || '';

    const newLoteItem: LoteItem = {
      id: listing.id,
      title: listing.release?.title || 'Sem Título',
      artist: listing.release?.artist || 'Artista Desconhecido',
      year: listing.release?.year || '',
      label: listing.release?.label || '',
      coverImage: cover,
      price: itemPrice,
      condition: `${listing.condition?.mediaCondition || 'VG+'} / ${listing.condition?.sleeveCondition || 'VG+'}`,
      format: listing.release?.formats?.[0]?.name || 'Vinyl LP',
      tracklist: listing.release?.tracklist || []
    };

    const updated = [...selectedItems];
    updated[activeSlotIdx] = newLoteItem;
    setSelectedItems(updated);
    setActiveSlotIdx(null);
  };

  // Remove item from slot
  const handleRemoveSlot = (idx: number) => {
    const updated = [...selectedItems];
    updated[idx] = null;
    setSelectedItems(updated);
  };

  // Add custom sub-style
  const handleAddCustomSubstyle = () => {
    if (!newSubstyleInput.trim()) return;
    const clean = newSubstyleInput.trim();
    saveCustomSubstyle(clean);
    setAllSubstyles(getAllAvailableSubstyles());
    if (!selectedStyles.includes(clean)) {
      setSelectedStyles(prev => [...prev, clean]);
    }
    setNewSubstyleInput('');
  };

  // Download generated canvas image
  const handleDownloadImage = () => {
    if (!generatedCoverUrl) return;
    const link = document.createElement('a');
    link.download = `lote-valdir-discos-${Date.now()}.jpg`;
    link.href = generatedCoverUrl;
    link.click();
  };

  // Compile and Save Lote
  const handleSubmitLote = (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = selectedItems.filter((it): it is LoteItem => it !== null);
    if (validItems.length < 2) {
      alert('Selecione pelo menos 2 discos (idealmente 4 discos) para montar o lote.');
      return;
    }

    // Build consolidated tracklist
    const mergedTracklist = validItems.flatMap((item, idx) => {
      const discNum = idx + 1;
      return [
        { position: `D${discNum}`, title: `=== DISCO ${discNum}: ${item.artist} - "${item.title}" ===`, duration: '' },
        ...(item.tracklist || []).map(t => ({
          position: `${discNum}-${t.position || ''}`,
          title: t.title,
          duration: t.duration || ''
        }))
      ];
    });

    // Build rich description
    const descLines = [
      `📦 **LOTE ESPECIAL COMBO - ${validItems.length} DISCOS DE VINIL**`,
      `📍 **Localização:** ${drawer}`,
      `💰 **Valor Individual Somado:** R$ ${sumOriginalPrices.toFixed(2)}`,
      promoActive ? `🏷️ **Preço Promocional do Combo:** R$ ${finalPrice.toFixed(2)} (${discountPercent}% OFF - Economia de R$ ${savingsAmount.toFixed(2)})` : `💰 **Preço do Lote:** R$ ${finalPrice.toFixed(2)}`,
      bonusDescription ? `🎁 **${bonusDescription}**` : '',
      `\n📋 **DISCOS INCLUSOS NESTE LOTE:**`,
      ...validItems.map((item, idx) => 
        `• **Disco ${idx + 1}:** ${item.artist} - *${item.title}* (${item.year || 'N/A'})\n  - Estado de Conservação: ${item.condition || 'VG+'}\n  - Selo: ${item.label || 'Nacional'}`
      ),
      `\n🔍 **ESTADO GERAL DO LOTE:**`,
      `• Mídia e Capa: ${conditionSummary}`,
      `• Todos os discos foram testados e 100% higienizados profissionalmente.`,
      `• Embalagem reforçada anti-impacto própria para envio seguro de discos de vinil para todo o Brasil.`
    ].filter(Boolean).join('\n');

    const primaryArtist = validItems.map(it => it.artist).join(' / ');

    const newRelease: DiscogsRelease = {
      id: `lote_${Date.now()}`,
      title: title || `Lote ${validItems.length} Discos Vinil`,
      artist: primaryArtist.slice(0, 100),
      label: 'Valdir Discos Lote Especial',
      catno: `LOTE-${validItems.length}LP`,
      year: new Date().getFullYear(),
      country: 'Brasil',
      genres: selectedGenres.length > 0 ? selectedGenres : ['Música Brasileira', 'Rock', 'Lote'],
      styles: selectedStyles.length > 0 ? selectedStyles : ['Lote Promocional', 'Combo 4 Discos'],
      tracklist: mergedTracklist,
      formats: [{
        name: 'Vinyl',
        qty: `${validItems.length}`,
        descriptions: [`Lote ${validItems.length}xLP`, 'Combo Promocional']
      }],
      coverImage: generatedCoverUrl || validItems[0]?.coverImage || '',
      notes: descLines
    };

    const newCondition: ConditionSelection = {
      mediaCondition: 'VG+',
      mediaDetails: conditionSummary,
      sleeveCondition: 'VG+',
      sleeveDetails: 'Capas em bom estado de conservação conforme fotos originais do lote.',
      hasInsert: false
    };

    const newPricing: PricingConfig = {
      basePriceBrl: finalPrice,
      directPrice: finalPrice,
      costPrice: 0,
      exchangeRate: 5.6,
      useExchange: false,
      shopeeCommissionPercent: 14,
      shopeeFixedFee: 4,
      packagingCost: 6.0,
      profitMarginPercent: 25,
      mode: 'direct',
      promoActive: promoActive,
      discountPercent: discountPercent,
      originalPrice: sumOriginalPrices,
      promoPrice: finalPrice,
      promoBadge: promoBadge || `${discountPercent}% OFF`,
      bonusDescription: bonusDescription
    };

    const newListing: SavedListing = {
      id: `lote_${Date.now()}`,
      barcode: `VD-LOTE-${Math.floor(1000 + Math.random() * 9000)}`,
      release: newRelease,
      condition: newCondition,
      pricing: newPricing,
      shopee: {
        title: title.slice(0, 120),
        description: descLines,
        suggestedPrice: finalPrice,
        hashtags: ['#lotediscos', '#vinil', '#valdir_discos', '#promocao', '#combo']
      },
      mercadolivre: {
        title: `Lote ${validItems.length} Discos Vinil LP ${primaryArtist}`.slice(0, 60),
        description: descLines,
        suggestedPrice: finalPrice
      },
      salesChannels: ['online_store', 'physical_store'],
      createdAt: new Date().toISOString(),
      drawer: drawer,
      customImages: generatedCoverUrl ? [generatedCoverUrl, ...validItems.map(it => it.coverImage).filter(Boolean) as string[]] : [],
      quantity: 1,
      isLote: true,
      loteItems: validItems,
      loteItemCount: validItems.length,
      promoActive: promoActive,
      discountPercent: discountPercent,
      originalPrice: sumOriginalPrices,
      promoPrice: finalPrice,
      promoBadge: promoBadge,
      bonusDescription: bonusDescription
    };

    onSaveLote(newListing);
  };

  const filledCount = selectedItems.filter(Boolean).length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" id="lote-registration-section">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 text-white border-b border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-400 text-slate-950 rounded-xl font-black text-xs shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                <Package className="h-4 w-4" />
                Novo Recurso
              </span>
              <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-400/30">
                Cadastro de Lotes & Combos (4 Discos)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Montar e Cadastrar Lote para Venda no Site
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Selecione 4 itens do acervo para criar um anúncio de lote promocional. O sistema calcula a soma, aplica o desconto com porcentagem (ex: 15% OFF) e <strong>gera automaticamente a foto montada em grade 2x2 com a capa de todos os discos juntos</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={generateCompositeImage}
              disabled={filledCount === 0 || isGeneratingImage}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingImage ? 'animate-spin' : ''}`} />
              Atualizar Foto do Lote
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmitLote} className="p-6 space-y-8">
        {/* Step 1: 4 Item Slots Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-mono">1</span>
                Selecione os 4 Discos do Lote ({filledCount} de 4 selecionados)
              </h3>
              <p className="text-xs text-slate-500">
                Clique em cada espaço para escolher um disco do estoque existente ou preencher um item.
              </p>
            </div>
            {filledCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedItems([null, null, null, null])}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar Todos os Slots
              </button>
            )}
          </div>

          {/* The 4 Slot Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((slotIdx) => {
              const item = selectedItems[slotIdx];
              return (
                <div
                  key={slotIdx}
                  className={`rounded-2xl border-2 transition-all p-3.5 flex flex-col justify-between min-h-[260px] relative ${
                    item
                      ? 'border-indigo-200 bg-indigo-50/30 shadow-xs'
                      : 'border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-white'
                  }`}
                >
                  {/* Slot Header Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono">
                      Disco #{slotIdx + 1}
                    </span>
                    {item && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slotIdx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Remover este disco do lote"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Slot Content */}
                  {item ? (
                    <div className="space-y-2.5 flex-1 flex flex-col">
                      <div className="aspect-square bg-slate-900 rounded-xl overflow-hidden relative shadow-inner">
                        {item.coverImage ? (
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <Disc className="h-10 w-10" />
                          </div>
                        )}
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-amber-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                          R$ {(item.price || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex-1 space-y-0.5">
                        <h4 className="font-black text-xs text-slate-900 line-clamp-1" title={item.title}>
                          {item.title}
                        </h4>
                        <p className="text-[11px] font-bold text-indigo-700 truncate">
                          {item.artist}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
                          <span className="bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                            {item.condition || 'VG+'}
                          </span>
                          {item.year && <span>{item.year}</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveSlotIdx(slotIdx)}
                        className="w-full py-1.5 px-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Trocar Disco
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-3 space-y-3">
                      <div className="w-14 h-14 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-500">
                        <Disc className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Espaço Vazio</p>
                        <p className="text-[11px] text-slate-400">Adicione o disco #{slotIdx + 1}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSlotIdx(slotIdx)}
                        className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Escolher do Acervo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Automatic Composite Photo (A foto do lote gerada) */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-mono">2</span>
                Foto Gerada do Lote (Capas Combinadas em Grade 2x2)
              </h3>
              <p className="text-xs text-slate-500">
                O programa junta as fotos dos 4 itens selecionados em uma imagem quadrada profissional de alta definição para o anúncio.
              </p>
            </div>

            {generatedCoverUrl && (
              <button
                type="button"
                onClick={handleDownloadImage}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-300 shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                Baixar Imagem do Lote
              </button>
            )}
          </div>

          {/* Hidden Canvas used for high-res drawing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Live Preview Container */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950 rounded-3xl p-5 text-white">
            <div className="md:col-span-6 flex flex-col items-center justify-center">
              <div className="w-full max-w-sm aspect-square bg-slate-900 rounded-2xl overflow-hidden relative shadow-2xl border-2 border-amber-500/40">
                {generatedCoverUrl ? (
                  <img
                    src={generatedCoverUrl}
                    alt="Foto Gerada do Lote"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-2">
                    <Layers className="h-12 w-12 text-slate-600 animate-pulse" />
                    <p className="text-xs font-bold text-slate-300">Aguardando seleção dos discos...</p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Assim que você escolher os discos acima, a montagem 2x2 aparecerá aqui em tempo real.
                    </p>
                  </div>
                )}

                {isGeneratingImage && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-bold text-amber-300">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Montando imagem composta...
                  </div>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-2 font-mono">
                Dimensão: 1000 x 1000 px • Pronta para Site, Shopee e Mercado Livre
              </span>
            </div>

            {/* Customization Options for the Photo */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Personalização da Imagem
                </span>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Selo Central na Foto</span>
                    <input
                      type="checkbox"
                      checked={showBadgeOverlay}
                      onChange={(e) => setShowBadgeOverlay(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4"
                    />
                  </label>
                  <input
                    type="text"
                    value={badgeOverlayText}
                    onChange={(e) => setBadgeOverlayText(e.target.value)}
                    disabled={!showBadgeOverlay}
                    placeholder="Ex: LOTE 4 DISCOS ou COMBO ROCK 70"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold disabled:opacity-40 focus:border-amber-400 outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Texto dourado em destaque colocado no centro da montagem das 4 capas.
                  </p>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>Layout da Foto:</span>
                    <span>Grade 2x2 (Quadrada)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Cores do Fundo:</span>
                    <span>Moldura escura anti-reflexo</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Identificação:</span>
                    <span>Numeração discreta nos cantos (1 a 4)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                <div className="flex items-start gap-2 text-xs text-amber-200">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300">Dica de Venda:</strong> Anúncios com imagem composta de 4 capas vendem até 3x mais rápido em marketplaces porque o comprador visualiza todo o combo de uma só vez!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Pricing, Promotion & Bonus (Promoções, Bônus e Indicação de Porcentagem) */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-mono">3</span>
              Preço, Promoção & Bônus do Lote
            </h3>
            <p className="text-xs text-slate-500">
              Configure o valor total do combo, porcentagem de desconto promocional (ex: 15% OFF) e bônus inclusos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Soma dos itens */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Soma dos 4 Discos Separados
              </span>
              <div className="text-2xl font-black font-mono text-slate-900">
                R$ {sumOriginalPrices.toFixed(2)}
              </div>
              <p className="text-[10px] text-slate-400">
                Preço que o cliente pagaria comprando os 4 discos avulsos.
              </p>
            </div>

            {/* Seletor de Desconto % */}
            <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-rose-800 tracking-wider flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Desconto Promocional (% OFF)
                </span>
                <label className="flex items-center gap-1 text-[11px] font-bold text-rose-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoActive}
                    onChange={(e) => setPromoActive(e.target.checked)}
                    className="rounded text-rose-600 h-3.5 w-3.5"
                  />
                  Ativar Promoção
                </label>
              </div>

              {/* Quick % Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[10, 15, 20, 25, 30].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setDiscountPercent(pct);
                      setPromoBadge(`${pct}% OFF`);
                      setCustomPrice(null);
                    }}
                    className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      discountPercent === pct && customPrice === null
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {pct}% OFF
                  </button>
                ))}
              </div>

              {/* Custom discount input */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-600">Personalizado:</span>
                <div className="relative w-24">
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={discountPercent}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setDiscountPercent(val);
                      setPromoBadge(`${val}% OFF`);
                      setCustomPrice(null);
                    }}
                    className="w-full px-2 py-1 bg-white border border-rose-300 rounded-lg text-xs font-black text-rose-900 pr-6 text-right"
                  />
                  <span className="absolute right-2 top-1 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Preço Final do Combo */}
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-black text-emerald-800 tracking-wider block">
                Preço Final de Venda do Lote
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-emerald-800">
                  R$ {finalPrice.toFixed(2)}
                </span>
                {savingsAmount > 0 && (
                  <span className="text-xs font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-emerald-700">
                Economia de R$ {savingsAmount.toFixed(2)} para o cliente!
              </p>
            </div>
          </div>

          {/* Selo Promocional e Bônus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-rose-600" />
                  Selo de Promoção no Produto (Badge)
                </span>
                <span className="text-[10px] text-slate-400">exibido nos cards do site</span>
              </label>
              <input
                type="text"
                value={promoBadge}
                onChange={(e) => setPromoBadge(e.target.value)}
                placeholder="Ex: 15% OFF, COMBO PROMOCIONAL, QUEIMA DE ESTOQUE"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Gift className="h-3.5 w-3.5 text-amber-600" />
                  Bônus e Brindes da Promoção
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">destaque no site</span>
              </label>
              <input
                type="text"
                value={bonusDescription}
                onChange={(e) => setBonusDescription(e.target.value)}
                placeholder="Ex: Bônus: 4 Plásticos protetores novos inclusos + frete reduzido"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Title, Taxonomy & Details */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-mono">4</span>
              Título e Estilos Musicais do Lote
            </h3>
            <p className="text-xs text-slate-500">
              Ajuste o título do anúncio, localização física e estilos musicais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Título do Anúncio do Lote</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ex: Lote 4 Discos Vinil LP - Tim Maia / Jorge Ben / Secos & Molhados / Gilberto Gil"
              />
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Localização Física (Gaveta / Caixa)</label>
              <input
                type="text"
                value={drawer}
                onChange={(e) => setDrawer(e.target.value)}
                placeholder="Ex: LOTE-01 ou GAVETA-04"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Expanded Genre and Sub-style Selector for the Lote */}
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Disc className="h-3.5 w-3.5 text-indigo-600" />
              Grandes Grupos Musicais e Sub-estilos do Lote
            </span>

            {/* Major groups pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {MAJOR_GENRE_GROUPS.map((group) => {
                const isSelected = selectedGenres.includes(group.name);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedGenres(prev => prev.filter(g => g !== group.name));
                      } else {
                        setSelectedGenres(prev => [...prev, group.name]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <span>{group.emoji}</span>
                    <span>{group.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Substyles Chips */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">Sub-estilos Selecionados:</span>
                <span className="text-[10px] text-slate-400">Clique para remover</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedStyles.map((style) => (
                  <span
                    key={style}
                    onClick={() => setSelectedStyles(prev => prev.filter(s => s !== style))}
                    className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold text-xs rounded-md border border-indigo-200 flex items-center gap-1 cursor-pointer hover:bg-rose-100 hover:text-rose-800 hover:border-rose-200 transition-colors"
                  >
                    <span>{style}</span>
                    <X className="h-3 w-3" />
                  </span>
                ))}
                {selectedStyles.length === 0 && (
                  <span className="text-xs text-slate-400 italic">Nenhum sub-estilo selecionado</span>
                )}
              </div>
            </div>

            {/* Add Custom Sub-style Input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newSubstyleInput}
                onChange={(e) => setNewSubstyleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSubstyle();
                  }
                }}
                placeholder="Digitar novo sub-estilo (ex: Boom Bap, Trap, MPB 70, Hard Rock...)"
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomSubstyle}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                + Adicionar Estilo
              </button>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {filledCount < 2 ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Selecione pelo menos 2 discos para poder anunciar o lote.
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="h-4 w-4" />
                Pronto para anunciar lote de {filledCount} discos por R$ {finalPrice.toFixed(2)} {promoActive ? `(${discountPercent}% OFF)` : ''}!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 sm:flex-none px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={filledCount < 2}
              className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package className="h-4 w-4" />
              Publicar Lote no Site e Acervo ({filledCount} Discos)
            </button>
          </div>
        </div>
      </form>

      {/* Modal: Item Selector from Stock */}
      {activeSlotIdx !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Disc className="h-4 w-4 text-indigo-600" />
                  Escolher Disco para o Slot #{activeSlotIdx + 1}
                </h4>
                <p className="text-xs text-slate-500">
                  Pesquise e selecione um disco do acervo para adicionar a este lote.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlotIdx(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter inputs */}
            <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar por artista, título, gênero, gaveta ou código..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
              </div>

              {/* Fast genre tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setGenreFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                    genreFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({availableInventory.length})
                </button>
                {['Rock', 'MPB', 'Samba', 'Rap', 'Jazz', 'Soul', 'Eletronica', 'Reggae'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenreFilter(g)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                      genreFilter.toLowerCase() === g.toLowerCase()
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Discs list */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {availableInventory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Disc className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold">Nenhum disco encontrado com esse filtro.</p>
                </div>
              ) : (
                availableInventory.map((item) => {
                  const cover = (item.customImages && item.customImages[0]) || item.release?.coverImage || '';
                  const price = item.pricing?.directPrice || item.pricing?.basePriceBrl || 0;
                  const isAlreadyPicked = selectedItems.some(it => it?.id === item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!isAlreadyPicked) {
                          handleSelectItemForSlot(item);
                        }
                      }}
                      className={`py-2.5 px-3 flex items-center justify-between gap-3 rounded-xl transition-all cursor-pointer ${
                        isAlreadyPicked 
                          ? 'opacity-40 bg-slate-50 cursor-not-allowed' 
                          : 'hover:bg-indigo-50/70 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-slate-900 rounded-lg overflow-hidden shrink-0">
                          {cover ? (
                            <img
                              src={cover}
                              alt={item.release.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Disc className="h-6 w-6" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h5 className="font-black text-xs text-slate-900 truncate">
                            {item.release.title}
                          </h5>
                          <p className="text-[11px] font-bold text-indigo-700 truncate">
                            {item.release.artist}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {item.release.year && <span>{item.release.year}</span>}
                            {item.drawer && <span>• Gaveta: {item.drawer}</span>}
                            <span>• Mídia: {item.condition?.mediaCondition || 'VG+'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        <span className="font-mono font-black text-xs text-slate-900">
                          R$ {price.toFixed(2)}
                        </span>
                        {isAlreadyPicked ? (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded">
                            Já no Lote
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all"
                          >
                            Selecionar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

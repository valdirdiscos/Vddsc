import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  Plus, 
  Zap, 
  Info,
  Type,
  AlertTriangle,
  Globe,
  Tag,
  Users,
  Smartphone,
  MapPin,
  Disc,
  Music,
  Calendar,
  Layers,
  Package,
  ShieldCheck,
  DollarSign,
  Scale,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download
} from 'lucide-react';
import { DiscogsRelease, ConditionSelection, PricingConfig, ShopeeListing, MercadoLivreListing } from '../types';
import { isVariousArtistsAlbum, formatTrackWithArtist, getListingFormatInfo, detectReleaseParticularities, buildMercadoLivreOrderTxt } from '../utils/formatHelper';

interface DiscDescriptionEditorProps {
  release: DiscogsRelease | null;
  condition: ConditionSelection;
  pricing: PricingConfig;
  drawer?: string;
  onDrawerChange?: (drawer: string) => void;
  shopeeListing: ShopeeListing | null;
  mercadoLivreListing: MercadoLivreListing | null;
  activePlatform?: 'shopee' | 'mercadolivre';
  onPlatformChange?: (platform: 'shopee' | 'mercadolivre') => void;
  onChangeShopeeTitle: (title: string) => void;
  onChangeMlTitle: (title: string) => void;
  onChangeShopeeDescription: (desc: string) => void;
  onChangeMlDescription: (desc: string) => void;
  onRegenerateAi?: () => void;
  isGeneratingAi?: boolean;
  onPublishMarketplace?: (platforms: ('mercadolivre' | 'shopee')[]) => Promise<void> | void;
  isPublishingMarketplace?: boolean;
  publishSuccessMessage?: string | null;
}

const QUICK_SNIPPETS = [
  { label: '✨ Higienizado & Revisado', text: '🧼 **Higienização:** Disco 100% higienizado profissionalmente e criteriosamente revisado sob luz forte no padrão internacional Goldmine.' },
  { label: '📦 Plásticos Novos', text: '🛡️ **Proteção:** Acompanha plástico interno antiestático e plástico externo novos de alta densidade.' },
  { label: '🏛️ Prensagem Original', text: '⭐ **Edição:** Prensagem original de época de alta fidelidade sonora para colecionadores.' },
  { label: '📖 Encarte Original', text: '📄 **Encarte:** Acompanha encarte original com letras das músicas e ficha técnica completa.' },
  { label: '📂 Capa Gatefold', text: '📁 **Capa:** Capa dupla (Gatefold) original muito bem preservada.' },
  { label: '📷 Fotos Reais', text: '📷 **Fotos reais:** Fotos e detalhes originais tirados do exemplar exato que será enviado.' },
  { label: '🚚 Embalagem Segura', text: '📦 **Envio Seguro:** Embalado com reforço de papelão rígido e plástico bolha especial para discos de vinil.' }
];

export const DiscDescriptionEditor: React.FC<DiscDescriptionEditorProps> = ({
  release,
  condition,
  pricing,
  drawer = '',
  onDrawerChange,
  shopeeListing,
  mercadoLivreListing,
  activePlatform,
  onPlatformChange,
  onChangeShopeeTitle,
  onChangeMlTitle,
  onChangeShopeeDescription,
  onChangeMlDescription,
  onRegenerateAi,
  isGeneratingAi = false,
  onPublishMarketplace,
  isPublishingMarketplace = false,
  publishSuccessMessage = null
}) => {
  const [internalPlatformTab, setInternalPlatformTab] = useState<'shopee' | 'mercadolivre'>('shopee');
  const activePlatformTab = activePlatform !== undefined ? activePlatform : internalPlatformTab;
  const setPlatformTab = (p: 'shopee' | 'mercadolivre') => {
    setInternalPlatformTab(p);
    if (onPlatformChange) {
      onPlatformChange(p);
    }
  };

  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showMobileAssistant, setShowMobileAssistant] = useState(true);
  const [copiedMlTxt, setCopiedMlTxt] = useState(false);
  const [downloadedMlTxt, setDownloadedMlTxt] = useState(false);

  const currentTitle = activePlatformTab === 'shopee'
    ? (shopeeListing?.title || '')
    : (mercadoLivreListing?.title || '');

  const currentDesc = activePlatformTab === 'shopee'
    ? (shopeeListing?.description || '')
    : (mercadoLivreListing?.description || '');

  // Strip redundant 'loc:', 'loc -', 'loc ' prefixes and brackets so only clean location remains (e.g. '4', 'A1')
  const rawLoc = drawer ? drawer.trim() : '';
  const locClean = rawLoc.replace(/^\[?loc[\s:-]*/i, '').replace(/\]$/, '').trim();
  // Location tag: compact [4] instead of wasteful [Loc: 4], saving 6 characters
  const locTag = locClean ? ` [${locClean}]` : '';

  // Check if current title has location (clean or legacy)
  const hasLocationInTitle = Boolean(
    locClean && (
      currentTitle.toLowerCase().includes(`[${locClean.toLowerCase()}]`) ||
      currentTitle.toLowerCase().includes(`[loc: ${locClean.toLowerCase()}]`) ||
      currentTitle.toLowerCase().includes(`[loc:${locClean.toLowerCase()}]`) ||
      currentTitle.toLowerCase().includes(`[loc ${locClean.toLowerCase()}]`)
    )
  );

  const handleTitleChange = (val: string) => {
    if (activePlatformTab === 'shopee') {
      onChangeShopeeTitle(val);
    } else {
      onChangeMlTitle(val);
    }
  };

  const handleTextChange = (val: string) => {
    if (activePlatformTab === 'shopee') {
      onChangeShopeeDescription(val);
    } else {
      onChangeMlDescription(val);
    }
  };

  const copyText = (text: string, setStatus: (val: boolean) => void) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        setStatus(true);
        setTimeout(() => setStatus(false), 2000);
        return;
      }
    } catch {}
    
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    setStatus(true);
    setTimeout(() => setStatus(false), 2000);
  };

  const copyFieldValue = (fieldKey: string, text: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldKey);
        setTimeout(() => setCopiedField(null), 2000);
        return;
      }
    } catch {}
    
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleInsertSnippet = (snippetText: string) => {
    const newText = currentDesc.trim() 
      ? `${currentDesc.trim()}\n\n${snippetText}`
      : snippetText;
    handleTextChange(newText);
  };

  // Generate optimized title based on platform limits - ALWAYS PRESERVE LOCATION
  const handleAutoFormatTitle = () => {
    if (!release) return;

    const yearTag = release.year ? ` (${release.year})` : '';

    if (activePlatformTab === 'shopee') {
      // Shopee allows up to 120 chars - include format, artist, title, year, loc
      let formatted = `Disco Vinil LP ${release.artist} - ${release.title}${yearTag}${locTag}`;
      if (condition.mediaCondition === 'SEM_DISCO') {
        formatted = `[APENAS CAPA] ${release.artist} - ${release.title}${locTag}`;
      } else if (condition.sleeveCondition === 'SEM_CAPA') {
        formatted = `[APENAS DISCO/MÍDIA] ${release.artist} - ${release.title}${locTag}`;
      }
      onChangeShopeeTitle(formatted.slice(0, 120));
    } else {
      // Mercado Livre strict 60 chars - STRICT GUARANTEE OF LOCATION
      let base = `${release.artist} - ${release.title}`;
      let prefix = 'Vinil LP ';
      if (condition.mediaCondition === 'SEM_DISCO') {
        base = `[APENAS CAPA] ${release.artist} - ${release.title}`;
        prefix = '';
      } else if (condition.sleeveCondition === 'SEM_CAPA') {
        base = `[APENAS DISCO] ${release.artist} - ${release.title}`;
        prefix = '';
      }
      const maxMlLen = 60;
      const avail = maxMlLen - prefix.length - locTag.length;
      if (base.length > avail) {
        base = base.slice(0, Math.max(10, avail - 3)).trim() + '...';
      }
      const formatted = `${prefix}${base}${locTag}`.trim();
      onChangeMlTitle(formatted.slice(0, 60));
    }
  };

  // Dedicated one-click action to guarantee location in title without truncating location
  const handleEnsureLocationInTitle = () => {
    if (!locClean) return;

    if (activePlatformTab === 'mercadolivre') {
      let base = (mercadoLivreListing?.title || currentTitle || '').replace(/\s*\[\s*(?:Loc:?\s*)?[^\]]+\]\s*$/gi, '').trim();
      if (!base && release) {
        base = `Vinil LP ${release.artist} - ${release.title}`.trim();
      }
      const maxMlLen = 60;
      const avail = maxMlLen - locTag.length;
      if (base.length > avail) {
        base = base.slice(0, Math.max(10, avail - 3)).trim() + '...';
      }
      const fixedTitle = `${base}${locTag}`.slice(0, 60);
      onChangeMlTitle(fixedTitle);
    } else {
      let base = (shopeeListing?.title || currentTitle || '').replace(/\s*\[\s*(?:Loc:?\s*)?[^\]]+\]\s*$/gi, '').trim();
      if (!base && release) {
        base = `Disco De Vinil LP ${release.artist} - ${release.title}`.trim();
      }
      const maxShLen = 120;
      const avail = maxShLen - locTag.length;
      if (base.length > avail) {
        base = base.slice(0, Math.max(10, avail - 3)).trim() + '...';
      }
      const fixedTitle = `${base}${locTag}`.slice(0, 120);
      onChangeShopeeTitle(fixedTitle);
    }
  };

  // Generate full robust Valdir Discos standard description instantly
  const handleGenerateStandardTemplate = () => {
    if (!release) return;

    const lines: string[] = [];

    // Location line without redundant 'Loc:'
    if (locClean) {
      lines.push(`📍 **Localização no Acervo:** [${locClean}]`);
    }

    // High warning if item is sleeve only or media only
    if (condition.mediaCondition === 'SEM_DISCO') {
      lines.push('🚨 **ATENÇÃO COMPRADOR: ITEM INCOMPLETO - ANÚNCIO REFERENTE APENAS À CAPA E ENCARTE ORIGINAL (NÃO ACOMPANHA O DISCO / MÍDIA FÍSICA).**');
    } else if (condition.sleeveCondition === 'SEM_CAPA') {
      lines.push('🚨 **ATENÇÃO COMPRADOR: ITEM INCOMPLETO - ANÚNCIO REFERENTE APENAS AO DISCO / MÍDIA. NÃO POSSUI CAPA ORIGINAL (SERÁ ENVIADO EM CAPA GENÉRICA).**');
    }

    lines.push('📷 **Observação importante:** fotos originais do produto');
    lines.push('');
    lines.push(`🎵 **ÁLBUM:** ${release.title}`);
    lines.push(`🎤 **ARTISTA / BANDA:** ${release.artist}`);
    if (release.year) lines.push(`📅 **ANO DE LANÇAMENTO:** ${release.year}`);
    if (release.label) lines.push(`🏷️ **GRAVADORA / SELO:** ${release.label}${release.catno ? ` (${release.catno})` : ''}`);
    if (release.country) lines.push(`🌍 **ORIGEM / PAÍS:** ${release.country}`);

    lines.push('');
    lines.push('🔍 **ESTADO DE CONSERVAÇÃO (AVALIAÇÃO COLECIONADOR):**');
    lines.push(`• **Mídia / Disco:** ${condition.mediaCondition} - ${condition.mediaDetails || 'Mídia em bom estado de reprodução.'}`);
    lines.push(`• **Capa:** ${condition.sleeveCondition} - ${condition.sleeveDetails || 'Capa íntegra com sinais normais do tempo.'}`);
    if (condition.hasInsert) {
      lines.push(`• **Encarte:** ${condition.insertCondition || 'VG+'} - ${condition.insertDetails || 'Acompanha encarte original.'}`);
    }

    // Release specific notes or curiosities
    if (release.notes && release.notes.trim()) {
      lines.push('');
      lines.push('ℹ️ **DETALHES / OBSERVAÇÕES DO DISCO:**');
      lines.push(release.notes.trim());
    }

    // Tracklist
    if (release.tracklist && release.tracklist.length > 0) {
      lines.push('');
      const isVA = isVariousArtistsAlbum(release);
      lines.push(isVA ? '🎼 **FAIXAS / MÚSICAS (COLETÂNEA - ARTISTAS IDENTIFICADOS):**' : '🎼 **FAIXAS / MÚSICAS:**');
      release.tracklist.forEach((t, i) => {
        const { fullDisplay } = formatTrackWithArtist(t, isVA);
        lines.push(fullDisplay || `${t.position || i + 1}. ${t.title}`);
      });
    }

    lines.push('');
    lines.push('🧼 **HIGIENIZAÇÃO & ENVIO:**');
    lines.push('• Disco totalmente higienizado com produto especializado.');
    lines.push('• Acompanha plásticos de proteção novos (interno e externo).');
    lines.push('• Embalagem reforçada com placas duras de papelão para garantir a integridade no transporte.');
    lines.push('• Envio rápido e seguro.');

    const generated = lines.join('\n');
    onChangeShopeeDescription(generated);
    onChangeMlDescription(generated);
  };

  const isImported = release?.country && !['brazil', 'brasil'].includes(release.country.toLowerCase());
  const formatInfo = getListingFormatInfo(release);
  const particularities = detectReleaseParticularities(release);

  // Technical data calculations for Mercado Livre Mobile App
  const mlCategory = formatInfo.type === 'cd' 
    ? 'Música, Filmes e Seriados > Música > CDs e DVDs de Música'
    : formatInfo.type === 'dvd'
    ? 'Música, Filmes e Seriados > Música > DVDs de Música'
    : 'Música, Filmes e Seriados > Música > Vinil';

  const mlCondition = condition.mediaCondition === 'M' ? 'Novo' : 'Usado';
  const mlFormatAlbum = formatInfo.type === 'cd' ? 'CD' : formatInfo.type === 'dvd' ? 'DVD' : 'Vinil';
  
  const mlPhysicalFormat = particularities.isDoubleAlbum 
    ? 'Álbum Duplo (2 LPs 12")'
    : formatInfo.type === 'vinyl_12_single'
    ? 'Single / Maxi-Single / EP 12" (33/45 RPM)'
    : formatInfo.type === 'vinyl_single'
    ? 'Compacto / Single (7 polegadas, 33/45 RPM)'
    : formatInfo.type === 'vinyl_10'
    ? 'Vinil 10" Polegadas'
    : formatInfo.type === 'cd'
    ? 'CD Áudio Padrão'
    : formatInfo.type === 'dvd'
    ? 'DVD Vídeo/Áudio'
    : 'LP (12 polegadas, 33 ⅓ RPM)';

  const mlYear = release?.year ? String(release.year) : 'Não informado';
  const mlTrackCount = release?.tracklist?.length ? `${release.tracklist.length}` : 'Não informado';
  const mlGenre = release?.genres?.length ? release.genres.join(', ') : (release?.styles?.length ? release.styles.join(', ') : 'Rock / MPB');
  const mlLabel = release?.label || 'Independente';
  const mlCountry = release?.country || 'Brasil';
  const mlAlbumCount = particularities.isDoubleAlbum ? '2' : (particularities.isBoxSet ? '3' : '1');
  const mlPackaging = particularities.isGatefold 
    ? 'Capa dupla (Gatefold)' 
    : particularities.isBoxSet 
    ? 'Caixa rígida (Box Set)' 
    : formatInfo.type === 'cd' 
    ? 'Caixa acrílica padrão' 
    : 'Capa simples de papelão com plásticos novos';
  const mlEan = release?.catno ? `${release.catno} (Catálogo)` : 'Não tem / Não se aplica';

  // Derivações dos campos específicos da tela "Características secundárias" do ML
  let totalDurationMinutes = 0;
  if (release?.tracklist && Array.isArray(release.tracklist)) {
    for (const t of release.tracklist) {
      if (t.duration) {
        const parts = t.duration.split(':').map((p: string) => parseInt(p, 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          totalDurationMinutes += parts[0] + parts[1] / 60;
        } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          totalDurationMinutes += parts[0] * 60 + parts[1] + parts[2] / 60;
        }
      }
    }
  }
  const mlDurationFormatted = totalDurationMinutes > 0 ? `${Math.round(totalDurationMinutes)} m` : 'Não se aplica';
  const mlDiskFormatShort = formatInfo.type === 'vinyl_single' ? 'compacto' : formatInfo.type === 'vinyl_12_single' ? 'single' : formatInfo.type === 'cd' ? 'cd' : 'lp';
  const mlDiskSize = formatInfo.type === 'vinyl_single' ? '7' : formatInfo.type === 'vinyl_10' ? '10' : formatInfo.type === 'cd' ? '5' : '12';
  const mlDiskSpeed = formatInfo.type === 'vinyl_single' ? '45 rpm' : formatInfo.type === 'cd' ? 'Não se aplica' : (formatInfo.defaultSpeed || '33,3 rpm');

  const mlPriceValue = (mercadoLivreListing?.suggestedPrice || pricing.directPrice || pricing.basePriceBrl || 0).toFixed(2);
  const mlPriceNumber = parseFloat(mlPriceValue);
  
  // Commission estimates for ML
  const classicTake = (mlPriceNumber * 0.86) - (mlPriceNumber < 79 ? 6 : 0);
  const premiumTake = (mlPriceNumber * 0.81) - (mlPriceNumber < 79 ? 6 : 0);

  // Dimensions for Mercado Envios
  const shippingDims = formatInfo.type === 'vinyl_single'
    ? '20 cm x 20 cm x 2 cm | Peso: 150 g'
    : formatInfo.type === 'vinyl_10'
    ? '28 cm x 28 cm x 2 cm | Peso: 300 g'
    : formatInfo.type === 'cd' || formatInfo.type === 'dvd'
    ? '15 cm x 15 cm x 2 cm | Peso: 120 g'
    : formatInfo.type === 'cassette'
    ? '14 cm x 10 cm x 3 cm | Peso: 100 g'
    : '33 cm x 33 cm x 3 cm | Peso: 450 g';

  const copyAllFichaTecnica = () => {
    const fullFicha = [
      `=== FICHA TÉCNICA - MERCADO LIVRE (${mlFormatAlbum}) ===`,
      `Título (com Loc): ${currentTitle}`,
      `Categoria: ${mlCategory}`,
      `Condição: ${mlCondition}`,
      `Artista / Intérprete: ${release?.artist || 'Não informado'}`,
      `Nome do Álbum: ${release?.title || 'Não informado'}`,
      `Formato do Álbum: ${mlFormatAlbum}`,
      `Formato Físico / Tipo: ${mlPhysicalFormat}`,
      `Ano de Lançamento: ${mlYear}`,
      `Quantidade de Canções: ${mlTrackCount} faixas`,
      `Gênero Musical: ${mlGenre}`,
      `Companhia Produtora / Selo: ${mlLabel}`,
      `Origem / País: ${mlCountry}`,
      `Quantidade de Álbuns / Discos: ${mlAlbumCount}`,
      `Tipo de Embalagem: ${mlPackaging}`,
      `Código Universal / EAN: Não tem / Não se aplica`,
      `É kit?: Não`,
      `Com faixas adicionais?: Não`,
      `Preço: R$ ${mlPriceValue}`,
      `Garantia: Garantia do vendedor (30 dias)`,
      `Dimensões de Envio: ${shippingDims}`,
      `Localização no Estoque: [${locClean || 'Não informada'}]`
    ].join('\n');

    copyFieldValue('full-ficha', fullFicha);
  };

  const handleDownloadMlTxt = () => {
    const txtContent = buildMercadoLivreOrderTxt({
      release,
      condition,
      title: mercadoLivreListing?.title || currentTitle,
      description: mercadoLivreListing?.description || currentDesc,
      price: mlPriceValue,
      drawer: locClean
    });

    const safeArtist = (release?.artist || 'Artista').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeTitle = (release?.title || 'Album').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `ML_${safeArtist}_${safeTitle}.txt`;

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedMlTxt(true);
    setTimeout(() => setDownloadedMlTxt(false), 3000);
  };

  const handleCopyMlTxt = () => {
    const txtContent = buildMercadoLivreOrderTxt({
      release,
      condition,
      title: mercadoLivreListing?.title || currentTitle,
      description: mercadoLivreListing?.description || currentDesc,
      price: mlPriceValue,
      drawer: locClean
    });

    copyText(txtContent, setCopiedMlTxt);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5" id="disc-description-editor">
      {/* Header with Platform Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
              Título, Ficha Técnica e Descrição
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% Editável
              </span>
              {release && isVariousArtistsAlbum(release) && (
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Coletânea VA (Artistas Identificados)
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Formate anúncios para Shopee e Mercado Livre com roteiro completo em .TXT ordenado para recorte.
            </p>
          </div>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setPlatformTab('shopee')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activePlatformTab === 'shopee'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Shopee</span>
            <span className="text-[10px] opacity-80">(120c)</span>
          </button>
          <button
            type="button"
            onClick={() => setPlatformTab('mercadolivre')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activePlatformTab === 'mercadolivre'
                ? 'bg-amber-400 text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Mercado Livre</span>
            <span className="text-[10px] font-mono opacity-80">(Ordem Real ML)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA MERCADO LIVRE: ORDEM EXATA DAS TELAS DO APP (ARTISTA -> ÁLBUM -> FICHA -> TÍTULO -> PREÇO -> DESCRIÇÃO) */}
      {/* ========================================================================= */}
      {activePlatformTab === 'mercadolivre' ? (
        <div className="space-y-4" id="mercadolivre-flow">
          {/* Card de Exportação / Download do Roteiro TXT */}
          <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  📁 Roteiro Mercado Livre (.TXT)
                </span>
                <h4 className="text-sm font-black text-slate-900">
                  Cadastrar no Mercado Livre (Ordem Exata das Telas)
                </h4>
              </div>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                O Mercado Livre solicita primeiro o <strong>Artista</strong>, depois o <strong>Álbum</strong>, em seguida a <strong>Ficha Técnica</strong>, e só depois o <strong>Título (60c)</strong>. Baixe o arquivo .TXT pronto para recortar ou copie campo por campo abaixo!
              </p>
            </div>

            {/* Ações de Download e Cópia do TXT */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadMlTxt}
                className="px-3.5 py-2.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Gera e faz o download de um arquivo .txt com todas as etapas na ordem do Mercado Livre para você recortar e colar"
              >
                <Download className="h-4 w-4 text-slate-950" />
                <span>{downloadedMlTxt ? 'Baixando Arquivo...' : 'Baixar Roteiro em .TXT'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMlTxt}
                className="px-3.5 py-2.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Copia todo o texto do roteiro formatado para a área de transferência"
              >
                {copiedMlTxt ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>TXT Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-amber-400" />
                    <span>Copiar TXT Completo</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={copyAllFichaTecnica}
                className="px-3 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Copia apenas a ficha técnica detalhada com os 14 tópicos"
              >
                {copiedField === 'full-ficha' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span>Copiar Ficha Técnica</span>
              </button>
            </div>
          </div>

          {/* Feedback de Download / Cópia */}
          {downloadedMlTxt && (
            <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Arquivo .TXT baixado com sucesso! Abra no bloco de notas para ir recortando e colando no Mercado Livre.</span>
            </div>
          )}

          {/* PAINEL DA LOCALIZAÇÃO NO ESTOQUE */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            hasLocationInTitle
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : locClean
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${
                  hasLocationInTitle ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider">
                      Localização Física no Acervo
                    </span>
                    {locClean ? (
                      hasLocationInTitle ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          [{locClean}] incluso no título
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          [{locClean}] ausente no título
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        Sem localização
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {locClean 
                      ? `Identificador de acervo: "[${locClean}]". Sem "Loc:" redundante para economizar espaço nos 60 caracteres.`
                      : 'Digite a identificação (ex: 4, A1, CX-02) para fixar na ficha e no título.'}
                  </p>
                </div>
              </div>

              {/* Quick Loc Input & Fix Button */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {onDrawerChange && (
                  <input
                    type="text"
                    value={drawer}
                    onChange={(e) => onDrawerChange(e.target.value)}
                    placeholder="Ex: 4 ou A1"
                    className="w-32 sm:w-36 px-2.5 py-1.5 text-xs font-bold font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    title="Editar localização física do disco (ex: 4)"
                  />
                )}

                {locClean && !hasLocationInTitle && (
                  <button
                    type="button"
                    onClick={handleEnsureLocationInTitle}
                    className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
                    title="Fixa a localização no fim do título ajustando o tamanho para não estourar os 60 caracteres"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Fixar [{locClean}] no Título</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Avisos especiais */}
          {(condition.mediaCondition === 'SEM_DISCO' || condition.sleeveCondition === 'SEM_CAPA') && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2.5 text-purple-950 text-xs font-bold shadow-xs">
              <AlertTriangle className="h-4 w-4 text-purple-700 shrink-0" />
              <span>
                {condition.mediaCondition === 'SEM_DISCO' 
                  ? '🚨 ATENÇÃO: Item configurado como APENAS CAPA (Sem Disco).' 
                  : '🚨 ATENÇÃO: Item configurado como APENAS DISCO (Sem Capa Original).'}
              </span>
            </div>
          )}

          {isImported && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-900 text-xs font-semibold">
              <Globe className="h-4 w-4 text-amber-600 shrink-0" />
              <span>✈️ Item Importado ({release?.country}) — A ficha técnica e o roteiro destacam a prensagem estrangeira.</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASSO 1 DO MERCADO LIVRE: O QUE VOCÊ QUER ANUNCIAR? (ARTISTA E ÁLBUM) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                  1
                </span>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Tela 1: O Que Você Quer Anunciar? (Identificação Inicial)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                Primeira tela do Mercado Livre
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Artista */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Nome do Artista / Banda / Intérprete
                  </span>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {release?.artist || 'Não informado'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyFieldValue('ml-art', release?.artist || '')}
                  className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  {copiedField === 'ml-art' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'ml-art' ? 'Copiado!' : 'Copiar Artista'}</span>
                </button>
              </div>

              {/* Álbum */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Nome do Álbum / Título
                  </span>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {release?.title || 'Não informado'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyFieldValue('ml-alb', release?.title || '')}
                  className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  {copiedField === 'ml-alb' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'ml-alb' ? 'Copiado!' : 'Copiar Álbum'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PASSO 2 DO MERCADO LIVRE: CONDIÇÃO E CATEGORIA */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                  2
                </span>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Tela 2: Condição e Categoria
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                Segunda tela do Mercado Livre
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Condição */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Condição do Produto
                  </span>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      mlCondition === 'Novo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {mlCondition}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      (Mídia: {condition.mediaCondition} / Capa: {condition.sleeveCondition})
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyFieldValue('ml-cond', mlCondition)}
                  className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  {copiedField === 'ml-cond' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'ml-cond' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              {/* Categoria */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Categoria Sugerida
                  </span>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {mlCategory}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyFieldValue('ml-cat', mlCategory)}
                  className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  {copiedField === 'ml-cat' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'ml-cat' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PASSO 3 DO MERCADO LIVRE: TÍTULO DO ANÚNCIO (MÁXIMO 60 CARACTERES) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                  3
                </span>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Tela 3: Título do Anúncio (Máximo 60 Caracteres)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  currentTitle.length <= 60 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                }`}>
                  {currentTitle.length}/60 caracteres
                </span>

                <button
                  type="button"
                  onClick={handleAutoFormatTitle}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all border border-indigo-200/60"
                  title="Formatar título otimizado respeitando estritamente o limite de 60 letras com a localização"
                >
                  <Zap className="h-3 w-3" />
                  <span>Formatar Título</span>
                </button>

                <button
                  type="button"
                  onClick={() => copyText(currentTitle, setCopiedTitle)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all border ${
                    copiedTitle 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {copiedTitle ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedTitle ? 'Copiado!' : 'Copiar Título'}</span>
                </button>
              </div>
            </div>

            <input
              type="text"
              value={currentTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Digite o título para o Mercado Livre (máx 60 caracteres)..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
            />

            {currentTitle.length > 60 && (
              <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                O Mercado Livre rejeita anúncios com mais de 60 caracteres! Clique em "Formatar Título" para ajustar automaticamente.
              </p>
            )}

            {locClean && !hasLocationInTitle && (
              <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                <span className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  Localização "[{locClean}]" ausente no título!
                </span>
                <button
                  type="button"
                  onClick={handleEnsureLocationInTitle}
                  className="text-[11px] font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer transition-all"
                >
                  Fixar [{locClean}] Agora
                </button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* PASSO 4 DO MERCADO LIVRE: FOTOS DO PRODUTO (SEQUÊNCIA RECOMENDADA) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                  4
                </span>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Tela 4: Fotos do Produto (Sequência Recomendada)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                6 Fotos Ideais
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
              {[
                { n: '1', name: 'Capa Frontal', sub: 'Fundo limpo' },
                { n: '2', name: 'Contracapa', sub: 'Verso do disco' },
                { n: '3', name: 'Selo Lado A', sub: 'Rótulo central' },
                { n: '4', name: 'Selo Lado B', sub: 'Rótulo central' },
                { n: '5', name: 'Encarte / Letras', sub: 'Se houver' },
                { n: '6', name: 'Mídia / Vinil', sub: 'Reflexo e brilho' }
              ].map((photo) => (
                <div key={photo.n} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                  <div className="font-bold text-slate-800 flex items-center justify-center gap-1">
                    <Camera className="h-3 w-3 text-slate-500" />
                    Foto {photo.n}
                  </div>
                  <div className="text-slate-600 font-semibold">{photo.name}</div>
                  <div className="text-[9px] text-slate-400">{photo.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PASSO 5 DO MERCADO LIVRE: CARACTERÍSTICAS SECUNDÁRIAS / FICHA TÉCNICA */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                  5
                </span>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Tela 5: Características Secundárias / Ficha Técnica
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">
                  Ordem exata do app
                </span>
                <button
                  type="button"
                  onClick={copyAllFichaTecnica}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copiar Ficha Inteira</span>
                </button>
              </div>
            </div>

            {/* Destaque dos 7 campos da tela "Características secundárias" do ML */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 pb-1">
                <span>Campos da Tela "Características secundárias"</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'sec_can', label: '1. Quantidade de canções', val: mlTrackCount },
                  { key: 'sec_fmt', label: '2. Formato do disco', val: mlDiskFormatShort },
                  { key: 'sec_gen', label: '3. Gêneros musicais', val: mlGenre },
                  { key: 'sec_dur', label: '4. Duração total do álbum', val: mlDurationFormatted },
                  { key: 'sec_tam', label: '5. Tamanho', val: `${mlDiskSize} "` },
                  { key: 'sec_ano', label: '6. Ano de lançamento', val: mlYear },
                  { key: 'sec_vel', label: '7. Velocidade de rotação', val: mlDiskSpeed }
                ].map((field) => (
                  <div key={field.key} className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200/70 flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block truncate">
                        {field.label}
                      </span>
                      <p className="font-bold text-slate-900 truncate">{field.val}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyFieldValue(field.key, field.val)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-amber-100 text-slate-800 border border-amber-200 rounded-md transition-all cursor-pointer shrink-0 flex items-center gap-1"
                      title={`Copiar ${field.label}`}
                    >
                      {copiedField === field.key ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Atributos adicionais da Ficha Técnica / Características Principais */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1">
                Outros Atributos da Ficha Técnica / Características Gerais
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'fmt', label: 'Formato do Álbum', val: mlFormatAlbum },
                  { key: 'phy', label: 'Formato Físico / Tipo', val: mlPhysicalFormat },
                  { key: 'qtd', label: 'Quantidade de Álbuns / Discos', val: mlAlbumCount },
                  { key: 'sel', label: 'Companhia Produtora / Selo', val: mlLabel },
                  { key: 'pai', label: 'Origem / País de Prensagem', val: mlCountry },
                  { key: 'emb', label: 'Tipo de Embalagem', val: mlPackaging },
                  { key: 'ean', label: 'Código Universal (EAN)', val: 'Não tem / Não se aplica' },
                  { key: 'kit', label: 'É kit?', val: 'Não' },
                  { key: 'bon', label: 'Com faixas adicionais?', val: 'Não' }
                ].map((field) => (
                  <div key={field.key} className="p-2.5 bg-slate-50 rounded-lg border border-slate-150 flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                        {field.label}
                      </span>
                      <p className="font-bold text-slate-800 truncate">{field.val}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyFieldValue(field.key, field.val)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md transition-all cursor-pointer shrink-0 flex items-center gap-1"
                      title={`Copiar ${field.label}`}
                    >
                      {copiedField === field.key ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PASSO 6 DO MERCADO LIVRE: PREÇO E ESTOQUE */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                  6
                </span>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Tela 6: Preço de Venda e Estoque
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                Estoque: 1 unidade
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Preço Sugerido para o Mercado Livre
                </span>
                <p className="text-2xl font-black font-mono text-emerald-700">R$ {mlPriceValue}</p>
              </div>

              <button
                type="button"
                onClick={() => copyFieldValue('ml-price', mlPriceValue)}
                className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                {copiedField === 'ml-price' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedField === 'ml-price' ? 'Preço Copiado!' : 'Copiar Preço'}</span>
              </button>
            </div>

            {/* Simulações de Taxas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-150">
                <span className="font-bold text-slate-700 block">Anúncio Clássico (~14% taxa ML):</span>
                <span className="text-slate-500">Você recebe aprox. </span>
                <strong className="text-emerald-700 font-mono">R$ {Math.max(0, classicTake).toFixed(2)}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-150">
                <span className="font-bold text-slate-700 block">Anúncio Premium (~19% taxa + sem juros):</span>
                <span className="text-slate-500">Você recebe aprox. </span>
                <strong className="text-emerald-700 font-mono">R$ {Math.max(0, premiumTake).toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PASSO 7 DO MERCADO LIVRE: ENVIO E GARANTIA (MERCADO ENVIOS) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                  7
                </span>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Tela 7: Envio e Garantia (Mercado Envios)
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dimensões */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dimensões e Peso do Pacote
                  </span>
                  <p className="text-xs font-bold text-slate-800 font-mono">{shippingDims}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyFieldValue('ml-ship', shippingDims)}
                  className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  {copiedField === 'ml-ship' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'ml-ship' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              {/* Garantia */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Garantia do Vendedor
                  </span>
                  <p className="text-xs font-bold text-slate-800">Garantia do vendedor: 30 dias</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyFieldValue('ml-war', 'Garantia do vendedor: 30 dias')}
                  className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  {copiedField === 'ml-war' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'ml-war' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PASSO 8 DO MERCADO LIVRE: DESCRIÇÃO COMPLETA DO ANÚNCIO */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                  8
                </span>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Tela 8: Descrição Completa do Anúncio
                </h4>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleGenerateStandardTemplate}
                  disabled={!release}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-50 text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer border border-indigo-200/60"
                  title="Preenche a descrição estruturada completa da Valdir Discos"
                >
                  <Zap className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Modelo Padrão</span>
                </button>

                {onRegenerateAi && (
                  <button
                    type="button"
                    onClick={onRegenerateAi}
                    disabled={!release || isGeneratingAi}
                    className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 disabled:opacity-50 text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer border border-purple-200/60"
                  >
                    <Sparkles className={`h-3.5 w-3.5 text-purple-600 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAi ? 'IA...' : 'Gerar com IA'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleTextChange('')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                  title="Limpar campo"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => copyText(currentDesc, setCopiedDesc)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border ${
                    copiedDesc
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 shadow-xs'
                  }`}
                >
                  {copiedDesc ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedDesc ? 'Descrição Copiada!' : 'Copiar Descrição'}</span>
                </button>
              </div>
            </div>

            {/* Quick Snippets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Plus className="h-3 w-3 text-indigo-600" />
                Inserir Frases Rápidas na Descrição:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SNIPPETS.map((snip, idx) => (
                  <button
                    key={`ml-snip-${idx}`}
                    type="button"
                    onClick={() => handleInsertSnippet(snip.text)}
                    className="text-[11px] font-medium px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer"
                  >
                    {snip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <textarea
                rows={10}
                value={currentDesc}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Escreva ou edite a descrição completa do disco..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800 font-sans focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder-slate-400"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>{currentDesc.length} caracteres</span>
                <span>Preço: <strong className="text-emerald-700 font-bold font-mono">R$ {mlPriceValue}</strong></span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* ABA SHOPEE: FLUXO DA SHOPEE (MANTIDO CONFORME O USUÁRIO APROVOU) */
        /* ========================================================================= */
        <div className="space-y-4" id="shopee-flow">
          {/* PAINEL DA LOCALIZAÇÃO NO ESTOQUE */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            hasLocationInTitle
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : locClean
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${
                  hasLocationInTitle ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider">
                      Localização no Estoque
                    </span>
                    {locClean ? (
                      hasLocationInTitle ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          [{locClean}] incluso no título
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          [{locClean}] ausente no título
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        Sem localização
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {locClean 
                      ? `Identificador de acervo: "[${locClean}]". Sem redundância de "Loc:".`
                      : 'Digite a identificação (ex: 4, A1, CX-02) para adicionar ao título e descrição.'}
                  </p>
                </div>
              </div>

              {/* Quick Loc Input & Fix Button */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {onDrawerChange && (
                  <input
                    type="text"
                    value={drawer}
                    onChange={(e) => onDrawerChange(e.target.value)}
                    placeholder="Ex: 4 ou A1"
                    className="w-32 sm:w-36 px-2.5 py-1.5 text-xs font-bold font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    title="Editar localização física do disco (ex: 4)"
                  />
                )}

                {locClean && !hasLocationInTitle && (
                  <button
                    type="button"
                    onClick={handleEnsureLocationInTitle}
                    className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
                    title="Fixa a localização no fim do título da Shopee"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Fixar [{locClean}] no Título</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Avisos especiais */}
          {(condition.mediaCondition === 'SEM_DISCO' || condition.sleeveCondition === 'SEM_CAPA') && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2.5 text-purple-950 text-xs font-bold shadow-xs">
              <AlertTriangle className="h-4 w-4 text-purple-700 shrink-0" />
              <span>
                {condition.mediaCondition === 'SEM_DISCO' 
                  ? '🚨 ATENÇÃO: Item configurado como APENAS CAPA (Sem Disco).' 
                  : '🚨 ATENÇÃO: Item configurado como APENAS DISCO (Sem Capa Original).'}
              </span>
            </div>
          )}

          {isImported && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-900 text-xs font-semibold">
              <Globe className="h-4 w-4 text-amber-600 shrink-0" />
              <span>✈️ Item Importado ({release?.country}) — O título e a ficha destacam a prensagem estrangeira.</span>
            </div>
          )}

          {/* TÍTULO DO ANÚNCIO (SHOPEE MÁX 120 LETRAS) */}
          <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="h-4 w-4 text-orange-600" />
                <span>Título do Anúncio (Shopee)</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  currentTitle.length <= 120 ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                }`}>
                  {currentTitle.length}/120 caracteres
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFormatTitle}
                  className="text-[11px] font-bold text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all border border-orange-200/60"
                  title="Gerar título otimizado para a Shopee com até 120 letras e localização"
                >
                  <Zap className="h-3 w-3" />
                  Formatar Título
                </button>

                <button
                  type="button"
                  onClick={() => copyText(currentTitle, setCopiedTitle)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all border ${
                    copiedTitle 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {copiedTitle ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copiar Título
                    </>
                  )}
                </button>
              </div>
            </div>

            <input
              type="text"
              value={currentTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Digite o título para a Shopee (máx 120 letras)..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono"
            />
          </div>

          {/* DESCRIÇÃO DO ANÚNCIO SHOPEE */}
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleGenerateStandardTemplate}
                  disabled={!release}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 disabled:opacity-50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-orange-200/60"
                  title="Preenche a descrição estruturada completa para a Shopee"
                >
                  <Zap className="h-3.5 w-3.5 text-orange-600" />
                  Gerar Modelo Padrão
                </button>

                {onRegenerateAi && (
                  <button
                    type="button"
                    onClick={onRegenerateAi}
                    disabled={!release || isGeneratingAi}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 disabled:opacity-50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-purple-200/60"
                    title="Aprimorar descrição com Inteligência Artificial"
                  >
                    <Sparkles className={`h-3.5 w-3.5 text-purple-600 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                    {isGeneratingAi ? 'Gerando com IA...' : 'Gerar com IA'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleTextChange('')}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  title="Limpar campo de texto"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => copyText(currentDesc, setCopiedDesc)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border ${
                  copiedDesc
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-orange-500 text-white hover:bg-orange-600 border-orange-500 shadow-xs'
                }`}
              >
                {copiedDesc ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Descrição Copiada!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar Descrição Completa
                  </>
                )}
              </button>
            </div>

            {/* Quick Snippets Pills */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Plus className="h-3 w-3 text-orange-600" />
                Inserir Frases Rápidas na Descrição:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SNIPPETS.map((snip, idx) => (
                  <button
                    key={`sh-snip-${idx}`}
                    type="button"
                    onClick={() => handleInsertSnippet(snip.text)}
                    className="text-[11px] font-medium px-2.5 py-1 bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-700 rounded-lg border border-slate-200 hover:border-orange-200 transition-all cursor-pointer"
                  >
                    {snip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <textarea
                rows={10}
                value={currentDesc}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Escreva ou edite aqui a descrição detalhada para a Shopee..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800 font-sans focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder-slate-400"
              />
              
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>{currentDesc.length} caracteres</span>
                <span>Preço Sugerido: <strong className="text-emerald-700 font-bold font-mono">R$ {pricing.directPrice?.toFixed(2) || pricing.basePriceBrl?.toFixed(2) || '0.00'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

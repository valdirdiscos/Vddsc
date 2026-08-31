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
  ExternalLink
} from 'lucide-react';
import { DiscogsRelease, ConditionSelection, PricingConfig, ShopeeListing, MercadoLivreListing } from '../types';
import { isVariousArtistsAlbum, formatTrackWithArtist, getListingFormatInfo, detectReleaseParticularities } from '../utils/formatHelper';

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
  { label: '✨ Higienizado & Testado', text: '🧼 **Higienização:** Disco 100% higienizado profissionalmente e testado antes do envio. Toca limpo e sem pulos.' },
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
  const [showAutoPublishModal, setShowAutoPublishModal] = useState(false);

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
    : formatInfo.type === 'vinyl_single'
    ? 'Compacto / Single (7 polegadas, 33/45 RPM)'
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
  const mlPriceValue = (mercadoLivreListing?.suggestedPrice || pricing.directPrice || pricing.basePriceBrl || 0).toFixed(2);
  const mlPriceNumber = parseFloat(mlPriceValue);
  
  // Commission estimates for ML
  const classicTake = (mlPriceNumber * 0.86) - (mlPriceNumber < 79 ? 6 : 0);
  const premiumTake = (mlPriceNumber * 0.81) - (mlPriceNumber < 79 ? 6 : 0);

  // Dimensions for Mercado Envios
  const shippingDims = formatInfo.type === 'vinyl_single'
    ? '20 cm x 20 cm x 2 cm | Peso: 150 g'
    : formatInfo.type === 'cd'
    ? '15 cm x 15 cm x 2 cm | Peso: 120 g'
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
              Cadastre automaticamente com 1 clique via API ou copie campo por campo para o app do celular.
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
            <span className="text-[10px] font-mono opacity-80">(60c)</span>
          </button>
        </div>
      </div>

      {/* CARD DE CADASTRO AUTOMÁTICO VIA API / PROGRAMA (1 CLIQUE) */}
      <div className={`p-4 rounded-2xl border transition-all shadow-xs ${
        activePlatformTab === 'mercadolivre'
          ? 'bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-amber-500/5 border-amber-300/80'
          : 'bg-gradient-to-r from-orange-500/10 via-orange-100/40 to-orange-500/5 border-orange-300/80'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                activePlatformTab === 'mercadolivre' ? 'bg-amber-400 text-slate-950' : 'bg-orange-500 text-white'
              }`}>
                {activePlatformTab === 'mercadolivre' ? '⚡ Mercado Livre API' : '⚡ Shopee Open API'}
              </span>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>Cadastrar Disco Automaticamente (1 Clique)</span>
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              {activePlatformTab === 'mercadolivre'
                ? 'O programa envia o título com a localização limpa, fotos, todas as 14 características da ficha técnica, preço e estoque direto para sua conta sem precisar preencher nada no celular!'
                : 'Publica fotos reais, descrição e dados técnicos instantaneamente na sua loja da Shopee via API.'}
            </p>
          </div>

          {/* Botões de Ação de 1 Clique */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onPublishMarketplace && onPublishMarketplace([activePlatformTab])}
              disabled={isPublishingMarketplace}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                activePlatformTab === 'mercadolivre'
                  ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-amber-200 active:scale-95 disabled:opacity-50'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 active:scale-95 disabled:opacity-50'
              }`}
              title={`Cadastrar este disco automaticamente no ${activePlatformTab === 'mercadolivre' ? 'Mercado Livre' : 'Shopee'}`}
            >
              {isPublishingMarketplace ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  <span>Cadastrando na API...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>
                    {activePlatformTab === 'mercadolivre'
                      ? 'Cadastrar no Mercado Livre Agora'
                      : 'Cadastrar na Shopee Agora'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onPublishMarketplace && onPublishMarketplace(['mercadolivre', 'shopee'])}
              disabled={isPublishingMarketplace}
              className="px-3 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Cadastrar disco simultaneamente em ambos os marketplaces"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-600" />
              <span>Publicar nos 2 (ML + Shopee)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAutoPublishModal(!showAutoPublishModal)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-all cursor-pointer"
              title="Como funciona o cadastro automático?"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>

        {publishSuccessMessage && (
          <div className="mt-3 p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>{publishSuccessMessage}</span>
          </div>
        )}

        {showAutoPublishModal && (
          <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs text-slate-700 space-y-2 leading-relaxed bg-white/80 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <strong className="text-slate-900 text-xs flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-600" />
                Como funciona o cadastro automático por programa:
              </strong>
              <button
                type="button"
                onClick={() => setShowAutoPublishModal(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                Fechar ✕
              </button>
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-600 font-medium">
              <li><strong>1 Clique via API Oficial:</strong> O programa empacota o título, as fotos originais, todas as 14 características da ficha técnica de vinil, preço de venda e quantidade de estoque e envia diretamente para os servidores do Mercado Livre e Shopee.</li>
              <li><strong>Chaves de API da sua Loja:</strong> Se você conectou seu App ID / Chave na aba <em>Marketplaces</em>, o anúncio é publicado ao vivo instantaneamente na sua conta real.</li>
              <li><strong>Assistente para Celular (Sem Chave de API):</strong> Se preferir anunciar pelo app do celular sem cadastrar chave de desenvolvedor, use os botões de cópia rápida abaixo — eles já vêm na ordem exata que o app do celular solicita!</li>
            </ol>
          </div>
        )}
      </div>

      {/* PAINEL DA LOCALIZAÇÃO NO ESTOQUE (LIMPO, SEM 'LOC:' REDUNDANTE) */}
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
                  ? `Identificador de acervo: "[${locClean}]". Sem redundância de "Loc:", economizando 6 caracteres no limite do título.`
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
                className="w-32 sm:w-36 px-2.5 py-1.5 text-xs font-bold font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Special Warnings */}
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

      {/* TÍTULO DO ANÚNCIO (COM LOCALIZAÇÃO SEMPRE INCLUSA) */}
      <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Type className="h-4 w-4 text-indigo-600" />
            <span>Título do Anúncio ({activePlatformTab === 'shopee' ? 'Shopee' : 'Mercado Livre'})</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
              activePlatformTab === 'shopee'
                ? currentTitle.length <= 120 ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                : currentTitle.length <= 60 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
            }`}>
              {currentTitle.length}/{activePlatformTab === 'shopee' ? 120 : 60} caracteres
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoFormatTitle}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all border border-indigo-200/60"
              title="Gerar título padronizado otimizado respeitando o limite estrito e garantindo a localização"
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
          placeholder={`Digite o título para ${activePlatformTab === 'shopee' ? 'Shopee (máx 120 letras)' : 'Mercado Livre (máx 60 letras)'}...`}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
        />

        {activePlatformTab === 'mercadolivre' && currentTitle.length > 60 && (
          <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            O Mercado Livre rejeita anúncios com mais de 60 caracteres! Reduza o título ou clique em "Formatar Título".
          </p>
        )}

        {locClean && !hasLocationInTitle && (
          <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
            <span className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              Atenção: A localização "[{locClean}]" não está no título deste anúncio!
            </span>
            <button
              type="button"
              onClick={handleEnsureLocationInTitle}
              className="text-[11px] font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer transition-all"
            >
              Incluir [{locClean}] Agora
            </button>
          </div>
        )}
      </div>

      {/* ROTEIRO DE CADASTRO NO CELULAR (MERCADO LIVRE MOBILE ASSISTANT) */}
      {activePlatformTab === 'mercadolivre' && (
        <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs" id="ml-mobile-guide">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-bold shadow-xs">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  Ficha do App Mercado Livre no Celular
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                    Passo a Passo Oficial
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600">
                  Cadastrando pelo celular? Copie campo por campo com 1 toque ou copie tudo de uma vez.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyAllFichaTecnica}
                className="px-3 py-1.5 text-xs font-black bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Copia todos os tópicos e campos para colar no WhatsApp ou bloco de notas"
              >
                {copiedField === 'full-ficha' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Ficha Inteira Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-amber-400" />
                    <span>📋 Copiar Ficha Técnica Completa</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowMobileAssistant(!showMobileAssistant)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-amber-100 transition-all cursor-pointer"
                title={showMobileAssistant ? 'Recolher roteiro' : 'Expandir roteiro'}
              >
                {showMobileAssistant ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {showMobileAssistant && (
            <div className="space-y-4 pt-1">
              {/* TÓPICO 1: TÍTULO */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">1</span>
                    <span>Título do Anúncio (Máx 60 caracteres)</span>
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-900 break-all">{currentTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyFieldValue('ml-title', currentTitle)}
                  className="self-end sm:self-center px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  {copiedField === 'ml-title' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'ml-title' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              {/* TÓPICO 2: CATEGORIA */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">2</span>
                    <span>Categoria Sugerida</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{mlCategory}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyFieldValue('ml-cat', mlCategory)}
                  className="self-end sm:self-center px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  {copiedField === 'ml-cat' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'ml-cat' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              {/* TÓPICO 3: GUIA DE FOTOS PARA CELULAR */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">3</span>
                    <span>Fotos do Produto (Ordem Ideal no Celular)</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                    6 Fotos Recomendadas
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1 text-center">
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

              {/* TÓPICO 4: CONDIÇÃO */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">4</span>
                    <span>Condição do Produto</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
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
                  className="self-end sm:self-center px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  {copiedField === 'ml-cond' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'ml-cond' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              {/* TÓPICO 5: FICHA TÉCNICA (O QUE MAIS PEDE NO CELULAR) */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">5</span>
                    <span>Ficha Técnica (Características do Produto)</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    14 campos do app celular
                  </span>
                </div>

                {/* Grid of technical fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'art', label: 'Nome do Artista / Banda', val: release?.artist || 'Não informado' },
                    { key: 'alb', label: 'Nome do Álbum', val: release?.title || 'Não informado' },
                    { key: 'fmt', label: 'Formato do Álbum', val: mlFormatAlbum },
                    { key: 'phy', label: 'Formato Físico / Tipo', val: mlPhysicalFormat },
                    { key: 'ano', label: 'Ano de Lançamento', val: mlYear },
                    { key: 'fai', label: 'Quantidade de Canções / Músicas', val: `${mlTrackCount} faixas` },
                    { key: 'gen', label: 'Gênero Musical', val: mlGenre },
                    { key: 'sel', label: 'Companhia Produtora / Selo', val: mlLabel },
                    { key: 'pai', label: 'Origem / País de Prensagem', val: mlCountry },
                    { key: 'qtd', label: 'Quantidade de Álbuns / Discos no Pacote', val: mlAlbumCount },
                    { key: 'emb', label: 'Tipo de Embalagem', val: mlPackaging },
                    { key: 'ean', label: 'Código Universal de Produto (EAN)', val: 'Não tem / Não se aplica' },
                    { key: 'kit', label: 'É kit?', val: 'Não' },
                    { key: 'bon', label: 'Com faixas adicionais / bônus?', val: 'Não' }
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

              {/* TÓPICO 6: PREÇO DE VENDA */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">6</span>
                      <span>Preço de Venda Sugerido</span>
                    </div>
                    <p className="text-lg font-black font-mono text-emerald-700">R$ {mlPriceValue}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyFieldValue('ml-price', mlPriceValue)}
                    className="self-end sm:self-center px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  >
                    {copiedField === 'ml-price' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedField === 'ml-price' ? 'Copiado!' : 'Copiar Preço'}</span>
                  </button>
                </div>

                {/* Estimation Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-150">
                    <span className="font-bold text-slate-700 block">Anúncio Clássico (~14% taxa):</span>
                    <span className="text-slate-500">Você recebe aprox. </span>
                    <strong className="text-emerald-700 font-mono">R$ {Math.max(0, classicTake).toFixed(2)}</strong>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-150">
                    <span className="font-bold text-slate-700 block">Anúncio Premium (~19% taxa + sem juros):</span>
                    <span className="text-slate-500">Você recebe aprox. </span>
                    <strong className="text-emerald-700 font-mono">R$ {Math.max(0, premiumTake).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* TÓPICO 7: ENVIO / MERCADO ENVIOS */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">7</span>
                    <span>Dimensões e Peso do Pacote (Mercado Envios)</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 font-mono">{shippingDims}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyFieldValue('ml-ship', shippingDims)}
                  className="self-end sm:self-center px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  {copiedField === 'ml-ship' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'ml-ship' ? 'Copiado!' : 'Copiar Dimensões'}</span>
                </button>
              </div>

              {/* TÓPICO 8: GARANTIA */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">8</span>
                    <span>Garantia do Vendedor</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">Garantia do vendedor: 30 dias</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyFieldValue('ml-war', 'Garantia do vendedor: 30 dias')}
                  className="self-end sm:self-center px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  {copiedField === 'ml-war' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'ml-war' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              {/* TÓPICO 9: NOTA DA DESCRIÇÃO */}
              <div className="p-3 bg-amber-100/60 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shrink-0">9</span>
                  <span><strong>Descrição Completa:</strong> A descrição formatada abaixo já inicia com a localização "[{locClean || 'Estoque'}]" e inclui o estado físico detalhado.</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyText(currentDesc, setCopiedDesc)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-300 hover:bg-amber-400 text-slate-950 rounded-lg transition-all cursor-pointer shrink-0"
                >
                  Copiar Descrição
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DESCRIÇÃO DO ANÚNCIO */}
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleGenerateStandardTemplate}
              disabled={!release}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-200/60"
              title="Preenche a descrição completa estruturada com base nos dados do disco"
            >
              <Zap className="h-3.5 w-3.5 text-indigo-600" />
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
                : 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 shadow-xs'
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
            <Plus className="h-3 w-3 text-indigo-600" />
            Inserir Frases Rápidas na Descrição:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SNIPPETS.map((snip, idx) => (
              <button
                key={`snip-${idx}`}
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
            placeholder="Escreva ou edite aqui a descrição detalhada do disco, estado de conservação, faixas, etc..."
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800 font-sans focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-slate-400"
          />
          
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>{currentDesc.length} caracteres</span>
            <span>Preço Sugerido: <strong className="text-emerald-700 font-bold font-mono">R$ {pricing.directPrice?.toFixed(2) || pricing.basePriceBrl?.toFixed(2) || '0.00'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

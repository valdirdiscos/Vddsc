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
  Users
} from 'lucide-react';
import { DiscogsRelease, ConditionSelection, PricingConfig, ShopeeListing, MercadoLivreListing } from '../types';
import { isVariousArtistsAlbum, formatTrackWithArtist } from '../utils/formatHelper';

interface DiscDescriptionEditorProps {
  release: DiscogsRelease | null;
  condition: ConditionSelection;
  pricing: PricingConfig;
  drawer?: string;
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
  shopeeListing,
  mercadoLivreListing,
  activePlatform,
  onPlatformChange,
  onChangeShopeeTitle,
  onChangeMlTitle,
  onChangeShopeeDescription,
  onChangeMlDescription,
  onRegenerateAi,
  isGeneratingAi = false
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

  const currentTitle = activePlatformTab === 'shopee'
    ? (shopeeListing?.title || '')
    : (mercadoLivreListing?.title || '');

  const currentDesc = activePlatformTab === 'shopee'
    ? (shopeeListing?.description || '')
    : (mercadoLivreListing?.description || '');

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

  const handleInsertSnippet = (snippetText: string) => {
    const newText = currentDesc.trim() 
      ? `${currentDesc.trim()}\n\n${snippetText}`
      : snippetText;
    handleTextChange(newText);
  };

  // Generate optimized title based on platform limits
  const handleAutoFormatTitle = () => {
    if (!release) return;

    const locTag = drawer.trim() ? ` [Loc: ${drawer.trim()}]` : '';
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
      // Mercado Livre strict 60 chars
      const drawerSuffix = drawer.trim() ? ` [${drawer.trim()}]` : '';
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
      const avail = maxMlLen - prefix.length - drawerSuffix.length;
      if (base.length > avail) {
        base = base.slice(0, Math.max(10, avail - 3)) + '...';
      }
      const formatted = `${prefix}${base}${drawerSuffix}`;
      onChangeMlTitle(formatted.slice(0, 60));
    }
  };

  // Generate full robust Valdir Discos standard description instantly
  const handleGenerateStandardTemplate = () => {
    if (!release) return;

    const lines: string[] = [];

    // Location / Loc
    if (drawer.trim()) {
      lines.push(`📍 **Loc:** ${drawer.trim()}`);
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
              Título e Descrição do Anúncio
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
              Ajuste o título e texto para Shopee e Mercado Livre com cópia em 1 clique.
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

      {/* TÍTULO DO ANÚNCIO */}
      <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Type className="h-4 w-4 text-indigo-600" />
            <span>Título do Anúncio ({activePlatformTab === 'shopee' ? 'Shopee' : 'Mercado Livre'})</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
              title="Gerar título padronizado otimizado"
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
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />

        {activePlatformTab === 'mercadolivre' && currentTitle.length > 60 && (
          <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            O Mercado Livre rejeita anúncios com mais de 60 caracteres. Reduza o título!
          </p>
        )}
      </div>

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

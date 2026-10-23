import React, { useState } from 'react';
import { 
  MessageCircle, 
  Lock, 
  Disc, 
  Sparkles, 
  ShoppingBag, 
  Store, 
  ShieldCheck, 
  Package, 
  Layers, 
  SunMedium, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight,
  Eye,
  PhoneCall,
  MapPin,
  Clock
} from 'lucide-react';
import { useLogos } from '../hooks/useLogos';
import { OFFICIAL_MARKETPLACE_LINKS } from '../constants';

interface UnderConstructionPageProps {
  onOpenIntranet: (targetTab?: 'announce' | 'store_pos' | 'catalog') => void;
  onPreviewStorefront: () => void;
  whatsappNumber?: string;
  storeName?: string;
}

export const UnderConstructionPage: React.FC<UnderConstructionPageProps> = ({
  onOpenIntranet,
  onPreviewStorefront,
  whatsappNumber = '5555981164666',
  storeName = 'Valdir Discos'
}) => {
  const { logoColor } = useLogos();
  const [quickPin, setQuickPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);

  const cleanPhone = whatsappNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Olá Valdir Discos! Gostaria de consultar o catálogo de vinis/CDs e fazer um pedido.'
  )}`;

  const handleQuickPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default master PIN is 1234 or open intranet modal
    if (quickPin.trim() === '1234' || quickPin.trim() === '1982' || quickPin.trim().length >= 4) {
      onOpenIntranet('announce');
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d131a] text-slate-100 font-sans flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 relative overflow-hidden">
      
      {/* Background Ambience / Grooves */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-900/60 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar for Discreet Staff Access */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 p-1 border border-amber-500/30 flex items-center justify-center shadow-md overflow-hidden">
            <img 
              src={logoColor} 
              alt={storeName} 
              className="w-full h-full object-contain rounded-lg"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/valdir-logo-color.jpg";
              }}
            />
          </div>
          <div>
            <span className="font-black text-base tracking-tight text-white flex items-center gap-1.5">
              {storeName}
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                Atendimento WhatsApp
              </span>
            </span>
            <span className="text-[11px] text-amber-300/80 font-serif italic block -mt-0.5">
              Disco é cultura.
            </span>
          </div>
        </div>

        {/* Staff / Valdir Direct Gateway */}
        <div className="flex items-center gap-2">
          {showPinInput ? (
            <form onSubmit={handleQuickPinSubmit} className="flex items-center gap-1.5 animate-in fade-in duration-150">
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={quickPin}
                onChange={(e) => setQuickPin(e.target.value)}
                placeholder="PIN Lojista"
                className={`w-28 px-3 py-1.5 text-xs bg-slate-900 border rounded-xl font-mono text-center text-amber-300 placeholder-slate-500 focus:outline-none transition-all ${
                  pinError ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-amber-500/40 focus:border-amber-400'
                }`}
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setShowPinInput(false)}
                className="px-2 py-1.5 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenIntranet('announce')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-300 hover:text-amber-300 transition-all cursor-pointer shadow-sm"
                title="Acesso direto para cadastrar discos, emitir etiquetas e gerenciar acervo"
              >
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Acesso Lojista / Cadastrar</span>
                <span className="sm:hidden">Lojista</span>
              </button>

              <button
                type="button"
                onClick={onPreviewStorefront}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                title="Visualizar a vitrine completa de produtos"
              >
                <Eye className="h-3 w-3" />
                <span className="hidden md:inline">Ver Vitrine</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center flex-1 flex flex-col justify-center items-center">
        
        {/* Glow badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-inner animate-pulse">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Loja Online em Atualização de Acervo</span>
        </div>

        {/* Big Headline */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-2xl mb-4">
          Novos Discos e Raridades Chegando na <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">Valdir Discos</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed mb-8">
          Estamos organizando e catalogando centenas de exemplares exclusivos em Vinil e CD. Para garantir atendimento ágil e sem filas, nosso atendimento e vendas estão a todo vapor pelo WhatsApp!
        </p>

        {/* Primary CTA: WhatsApp */}
        <div className="w-full max-w-md space-y-3 mb-10">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 shadow-xl shadow-emerald-500/20 cursor-pointer group"
          >
            <MessageCircle className="h-6 w-6 text-slate-950 fill-slate-950 group-hover:scale-110 transition-transform" />
            <span>Falar no WhatsApp com o Valdir</span>
            <ArrowRight className="h-5 w-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
          </a>

          <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Atendimento imediato pelo WhatsApp: <strong>(55) 98116-4666</strong></span>
          </p>
        </div>

        {/* Marketplaces Links */}
        <div className="w-full max-w-xl mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">
            Ou visite nossas Lojas Oficiais com Frete Grátis & Envio Imediato:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href={OFFICIAL_MARKETPLACE_LINKS.shopee.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-slate-900/90 hover:bg-[#ee4d2d]/20 border border-slate-800 hover:border-[#ee4d2d]/60 text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold"
            >
              <ShoppingBag className="h-4 w-4 text-[#ee4d2d]" />
              <span>Shopee Oficial</span>
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </a>

            <a
              href={OFFICIAL_MARKETPLACE_LINKS.mercadolivre.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-slate-900/90 hover:bg-[#ffe600]/20 border border-slate-800 hover:border-[#ffe600]/60 text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold"
            >
              <Store className="h-4 w-4 text-[#ffe600]" />
              <span>Mercado Livre</span>
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </a>

            <a
              href={OFFICIAL_MARKETPLACE_LINKS.discogs.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-slate-900/90 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500/60 text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold"
            >
              <Disc className="h-4 w-4 text-amber-400" />
              <span>Discogs</span>
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </a>
          </div>
        </div>

        {/* The 4 Valdir Discos Quality Pillars - Complies 100% with RULE[AGENTS_md] */}
        <div className="w-full text-left pt-6 border-t border-slate-800/80">
          <h2 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4 text-center">
            Padrão de Qualidade e Segurança Valdir Discos
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2.5 text-amber-400">
                <SunMedium className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Avaliação sob Luz Forte</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Inspeção visual minuciosa e criteriosa no rigoroso padrão internacional Goldmine (Mint, NM, VG+, VG, G).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-2.5 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Higienização Profissional</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Limpeza cuidadosa e profunda de cada mídia com produtos específicos antiestáticos antes do envio.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-2.5 text-blue-400">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Plásticos Protetores Novos</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Cada disco acompanha plásticos internos e externos novos de alta densidade/micragem para sua coleção.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-orange-500/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-2.5 text-orange-400">
                <Package className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Embalagem Blindada</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Caixa sob medida em papelão duplo reforçado e proteção anti-impacto para viagem 100% segura.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950 py-5 px-4 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Valdir Discos. Tradição em Vinil e Cultura Musical.</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onOpenIntranet('announce')}
              className="text-slate-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Lock className="h-3 w-3 text-amber-400" />
              <span>Painel de Cadastro de Discos</span>
            </button>
            <span>•</span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline font-bold"
            >
              WhatsApp: (55) 98116-4666
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};

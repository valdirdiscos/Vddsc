import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shirt, 
  ShoppingBag, 
  Ruler, 
  Check, 
  MessageCircle, 
  Sparkles,
  ArrowRight,
  Plus,
  Info
} from 'lucide-react';
import { TShirtProduct, TShirtSize, TShirtColor, TShirtModel } from '../types';
import { TSHIRT_PRODUCTS, SIZE_CHART_UNISSEX, SIZE_CHART_BABYLOOK } from '../data/tshirtsData';
import { TShirtDetailModal } from './TShirtDetailModal';
import { useLogos } from '../hooks/useLogos';

interface TShirtsSectionProps {
  onAddToCart: (tshirt: TShirtProduct, size: TShirtSize, color: TShirtColor, model: TShirtModel, quantity: number) => void;
  whatsappNumber?: string;
}

export function TShirtsSection({
  onAddToCart,
  whatsappNumber = '5555981164666'
}: TShirtsSectionProps) {
  const { logoBadge, logoColor, logoBw } = useLogos();

  const getProductImage = (p: TShirtProduct) => {
    const pId = p.id.toLowerCase();
    if (pId.includes('selo') || p.category === 'selo_oficial') return logoBadge;
    if (pId.includes('color') || pId.includes('mascote')) return logoColor;
    if (pId.includes('bw') || pId.includes('mono')) return logoBw;
    return p.image;
  };
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<TShirtProduct | null>(null);
  const [showSizeGuideModal, setShowSizeGuideModal] = useState<boolean>(false);
  const [sizeGuideTab, setSizeGuideTab] = useState<'unissex' | 'babylook'>('unissex');
  const [addedToastId, setAddedToastId] = useState<string | null>(null);

  // Quick card configuration
  const [cardConfigs, setCardConfigs] = useState<{
    [id: string]: {
      selectedColor: TShirtColor;
      selectedSize: TShirtSize;
      selectedModel: TShirtModel;
    }
  }>(() => {
    const initial: { [id: string]: { selectedColor: TShirtColor; selectedSize: TShirtSize; selectedModel: TShirtModel } } = {};
    TSHIRT_PRODUCTS.forEach(p => {
      initial[p.id] = {
        selectedColor: p.colors[0],
        selectedSize: 'G',
        selectedModel: p.models[0]
      };
    });
    return initial;
  });

  const handleUpdateConfig = (
    id: string, 
    key: 'selectedColor' | 'selectedSize' | 'selectedModel', 
    val: any
  ) => {
    setCardConfigs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: val
      }
    }));
  };

  const handleQuickAdd = (p: TShirtProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cfg = cardConfigs[p.id] || {
      selectedColor: p.colors[0],
      selectedSize: 'G',
      selectedModel: p.models[0]
    };
    onAddToCart(p, cfg.selectedSize, cfg.selectedColor, cfg.selectedModel, 1);
    setAddedToastId(p.id);
    setTimeout(() => {
      setAddedToastId(null);
    }, 1500);
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return TSHIRT_PRODUCTS;
    return TSHIRT_PRODUCTS.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const categories = [
    { id: 'all', label: '🔥 Todas as Camisetas' },
    { id: 'selo_oficial', label: '★ Selos Oficiais' },
    { id: 'mpb_brasil', label: '🇧🇷 MPB & Samba' },
    { id: 'retro_dj', label: '🎧 Retrô & Hi-Fi DJ' }
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Direct, Compact Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-2xl p-3.5 sm:p-4 border border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Shirt className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white">
                Camisetas Oficiais Valdir Discos
              </h2>
              <span className="px-1.5 py-0.5 bg-amber-500 text-amber-950 font-black text-[9px] uppercase rounded tracking-wider">
                Estampa DTF
              </span>
            </div>
            <p className="text-[11px] text-stone-300 font-medium">
              100% Algodão nobre 30.1 • Estampas em alta resolução DTF • Não racha nem desbota
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowSizeGuideModal(true)}
            className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-stone-200 rounded-xl border border-white/15 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Ruler className="h-3.5 w-3.5 text-amber-400" />
            <span>Guia de Medidas</span>
          </button>

          <a
            href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Olá Valdir! Gostaria de tirar uma dúvida sobre as camisetas oficiais!')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-amber-950 text-amber-100 border-amber-950 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-semibold text-slate-500 shrink-0 hidden sm:inline">
          {filteredProducts.length} modelos
        </span>
      </div>

      {/* Products Grid - Proportioned exactly like Disc Cards (5 cols) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
        {filteredProducts.map((p) => {
          const cfg = cardConfigs[p.id] || {
            selectedColor: p.colors[0],
            selectedSize: 'G',
            selectedModel: p.models[0]
          };
          const isToastActive = addedToastId === p.id;

          return (
            <div 
              key={p.id}
              className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group hover:border-amber-400/60"
            >
              {/* Top: Compact Mockup Display matching disc aspect-square */}
              <div 
                className="aspect-square relative flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer overflow-hidden"
                style={{ backgroundColor: cfg.selectedColor.hex }}
                onClick={() => setSelectedProduct(p)}
              >
                {/* Subtle silhouette watermark */}
                <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                  <Shirt className="w-16 h-16 stroke-[1] text-white" />
                </div>

                {/* Stamp Circle */}
                <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-white shadow-md border-2 border-amber-400/80 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-200">
                  <img 
                    src={getProductImage(p)} 
                    alt={p.name} 
                    className="w-full h-full object-contain rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* DTF Badge */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                  <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-xs text-amber-300 font-black text-[9px] uppercase rounded shadow-xs border border-amber-400/30">
                    Estampa DTF
                  </span>
                </div>

                <span className="absolute bottom-1.5 right-2 text-[9px] font-bold text-white/90 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver detalhes
                </span>
              </div>

              {/* Body: Direct & Focused */}
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                
                {/* Title & Price */}
                <div className="space-y-0.5">
                  <h3 
                    onClick={() => setSelectedProduct(p)}
                    className="font-black text-slate-900 text-xs sm:text-sm leading-snug cursor-pointer hover:text-amber-700 transition-colors line-clamp-1"
                    title={p.name}
                  >
                    {p.name}
                  </h3>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs sm:text-sm font-black text-amber-950 font-mono">
                        R$ {p.price.toFixed(2).replace('.', ',')}
                      </span>
                      {p.originalPrice && (
                        <span className="text-[9px] text-slate-400 line-through">
                          R$ {p.originalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                    <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                      PIX
                    </span>
                  </div>
                </div>

                {/* Color Selector Dots */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-[9.5px] font-semibold text-slate-500">
                    <span>Cor:</span>
                    <span className="text-slate-800 font-bold truncate max-w-[80px]">{cfg.selectedColor.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {p.colors.map((c) => {
                      const isSelected = cfg.selectedColor.id === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleUpdateConfig(p.id, 'selectedColor', c)}
                          className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? 'ring-2 ring-amber-600 scale-110'
                              : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {isSelected && (
                            <Check className={`h-1.5 w-1.5 ${c.id === 'offwhite' || c.id === 'sand' ? 'text-black' : 'text-white'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selector Pills */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-[9.5px] font-semibold text-slate-500">
                    <span>Tamanho:</span>
                    <span className="text-amber-800 font-black">{cfg.selectedSize}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-0.5">
                    {p.sizes.map((sz) => {
                      const isSelected = cfg.selectedSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleUpdateConfig(p.id, 'selectedSize', sz)}
                          className={`py-0.5 rounded text-[8.5px] font-black transition-all cursor-pointer border text-center ${
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(p, e)}
                    className={`py-1 px-1 rounded-xl font-bold text-[10.5px] transition-all flex items-center justify-center gap-0.5 cursor-pointer border ${
                      isToastActive
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-600 active:scale-95 shadow-xs'
                    }`}
                  >
                    {isToastActive ? (
                      <>
                        <Check className="h-2.5 w-2.5 font-bold" />
                        <span>Adicionado</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-2.5 w-2.5 font-bold" />
                        <span>+ Carrinho</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className="py-1 px-1 rounded-xl font-bold text-[10.5px] bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center justify-center gap-0.5 cursor-pointer shadow-xs"
                  >
                    <span>Comprar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuideModal && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white max-w-lg w-full rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 text-amber-800 rounded-xl">
                    <Ruler className="h-4 w-4" />
                  </div>
                  <h3 className="font-black text-slate-900 text-base">Tabela de Medidas (cm)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSizeGuideModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Tabs Unissex / Babylook */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSizeGuideTab('unissex')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    sizeGuideTab === 'unissex'
                      ? 'bg-amber-950 text-white border-amber-950'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Unissex Tradicional
                </button>
                <button
                  type="button"
                  onClick={() => setSizeGuideTab('babylook')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    sizeGuideTab === 'babylook'
                      ? 'bg-amber-950 text-white border-amber-950'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Baby Look Feminina
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2 px-3">Tam.</th>
                      <th className="py-2 px-3">Largura (Tórax)</th>
                      <th className="py-2 px-3">Comprimento</th>
                      <th className="py-2 px-3">Manga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sizeGuideTab === 'unissex' ? SIZE_CHART_UNISSEX : SIZE_CHART_BABYLOOK).map((row, idx) => (
                      <tr key={row.size} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="py-2 px-3 font-black text-amber-950">{row.size}</td>
                        <td className="py-2 px-3 text-slate-600">{row.chest} cm</td>
                        <td className="py-2 px-3 text-slate-600">{row.length} cm</td>
                        <td className="py-2 px-3 text-slate-600">{row.sleeve} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                * Medidas aproximadas com tolerância de até 1,5 cm. 100% Algodão Penteado pré-encolhido.
              </p>

              <button
                type="button"
                onClick={() => setShowSizeGuideModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      {selectedProduct && (
        <TShirtDetailModal
          tshirt={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={onAddToCart}
          whatsappNumber={whatsappNumber}
        />
      )}

    </div>
  );
}

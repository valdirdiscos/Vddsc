import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShoppingBag, 
  MessageCircle, 
  Check, 
  Sparkles, 
  Ruler, 
  Shirt,
  Plus,
  Minus
} from 'lucide-react';
import { TShirtProduct, TShirtSize, TShirtModel, TShirtColor } from '../types';
import { SIZE_CHART_UNISSEX, SIZE_CHART_BABYLOOK } from '../data/tshirtsData';
import { useLogos } from '../hooks/useLogos';

interface TShirtDetailModalProps {
  tshirt: TShirtProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (tshirt: TShirtProduct, size: TShirtSize, color: TShirtColor, model: TShirtModel, quantity: number) => void;
  whatsappNumber?: string;
}

export function TShirtDetailModal({
  tshirt,
  isOpen,
  onClose,
  onAddToCart,
  whatsappNumber = '5555981164666'
}: TShirtDetailModalProps) {
  const { logoBadge, logoColor, logoBw } = useLogos();
  if (!isOpen || !tshirt) return null;

  const getProductImage = (p: TShirtProduct) => {
    if (p.id.includes('selo') || p.category === 'selo_oficial') return logoBadge;
    if (p.id.includes('color') || p.id.includes('mascote') || p.category === 'mascote_color') return logoColor;
    if (p.id.includes('bw') || p.category === 'monocromatico') return logoBw;
    return p.image;
  };

  const [selectedColor, setSelectedColor] = useState<TShirtColor>(tshirt.colors[0] || {
    id: 'black',
    name: 'Preto Vintage',
    hex: '#18181b',
    bgClass: 'bg-zinc-900'
  });
  const [selectedSize, setSelectedSize] = useState<TShirtSize>('G');
  const [selectedModel, setSelectedModel] = useState<TShirtModel>(tshirt.models[0] || 'Unissex Tradicional');
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);
  const [isAddedToast, setIsAddedToast] = useState<boolean>(false);

  const activeSizeChart = selectedModel.includes('Baby') ? SIZE_CHART_BABYLOOK : SIZE_CHART_UNISSEX;

  const handleAdd = () => {
    onAddToCart(tshirt, selectedSize, selectedColor, selectedModel, quantity);
    setIsAddedToast(true);
    setTimeout(() => {
      setIsAddedToast(false);
      onClose();
    }, 1000);
  };

  const handleDirectWhatsApp = () => {
    const msg = `👕 *PEDIDO DE CAMISETA - VALDIR DISCOS*\n` +
      `------------------------------------\n` +
      `• *Modelo:* ${tshirt.name}\n` +
      `• *Estampa:* DTF de Alta Resolução\n` +
      `• *Modelagem:* ${selectedModel}\n` +
      `• *Tamanho:* ${selectedSize}\n` +
      `• *Cor:* ${selectedColor.name}\n` +
      `• *Quantidade:* ${quantity}x\n` +
      `• *Valor Unitário:* R$ ${tshirt.price.toFixed(2).replace('.', ',')}\n` +
      `• *Total:* R$ ${(tshirt.price * quantity).toFixed(2).replace('.', ',')}\n` +
      `------------------------------------\n` +
      `Olá Valdir! Gostaria de encomendar essa camiseta oficial da loja!`;

    const url = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto text-slate-900 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg">
                <Shirt className="h-4 w-4" />
              </span>
              <span className="text-xs font-black text-white truncate max-w-xs sm:max-w-md">
                {tshirt.name}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              
              {/* Left Column: Visual Mockup */}
              <div className="md:col-span-5 space-y-2.5">
                <div 
                  className="rounded-2xl p-4 relative flex flex-col items-center justify-center border border-slate-200 shadow-inner overflow-hidden min-h-[220px] transition-colors duration-200"
                  style={{ backgroundColor: selectedColor.hex }}
                >
                  <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                    <Shirt className="w-56 h-56 stroke-[0.8] text-white" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1.5 bg-white/95 shadow-md border-2 border-amber-400/80 flex items-center justify-center overflow-hidden">
                      <img 
                        src={getProductImage(tshirt)} 
                        alt={tshirt.name}
                        className="w-full h-full object-contain rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="mt-2.5 px-2.5 py-0.5 rounded-full bg-black/60 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                      Estampa DTF Alta Definição
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-2.5 text-[11px] text-amber-950 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>100% Algodão Penteado Fio 30.1 • Não encolhe</span>
                </div>
              </div>

              {/* Right Column: Customization & Direct Action */}
              <div className="md:col-span-7 space-y-3.5">
                
                {/* Title & Price */}
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {tshirt.name}
                  </h2>
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-xl font-black text-amber-950 font-mono">
                      R$ {tshirt.price.toFixed(2).replace('.', ',')}
                    </span>
                    {tshirt.originalPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        R$ {tshirt.originalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      PIX / Cartão
                    </span>
                  </div>
                </div>

                {/* Model Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Modelagem:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {tshirt.models.map((mod) => (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => setSelectedModel(mod)}
                        className={`p-2 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer flex items-center justify-between ${
                          selectedModel === mod
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{mod}</span>
                        {selectedModel === mod && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>Cor: <strong className="text-slate-900 font-black">{selectedColor.name}</strong></span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {tshirt.colors.map((c) => {
                      const isSelected = selectedColor.id === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-950 text-white border-amber-950 ring-1 ring-amber-500/50'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span 
                            className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Tamanho: <strong className="text-amber-800 font-black">{selectedSize}</strong>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSizeGuide(!showSizeGuide)}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                    >
                      <Ruler className="h-3 w-3 text-amber-600" />
                      <span>{showSizeGuide ? 'Ocultar Medidas' : 'Guia de Medidas'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {tshirt.sizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border text-center ${
                          selectedSize === sz
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        <span>{sz}</span>
                      </button>
                    ))}
                  </div>

                  {/* Size Guide Inline */}
                  {showSizeGuide && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] space-y-1">
                      <div className="font-bold text-slate-800">Tabela de Medidas ({selectedModel})</div>
                      <div className="grid grid-cols-4 text-center font-mono py-1 border-t border-slate-200 text-slate-600">
                        {activeSizeChart.map((m) => (
                          <div key={m.size} className="p-1">
                            <strong className="text-amber-900 block">{m.size}</strong>
                            <span>{m.chest}x{m.length}cm</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantity Control & Actions */}
                <div className="pt-2 space-y-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Quantidade:</span>
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-slate-900 font-mono">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleAdd}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        isAddedToast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
                      }`}
                    >
                      {isAddedToast ? (
                        <>
                          <Check className="h-3.5 w-3.5 font-bold" />
                          <span>Adicionado!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>+ Adicionar ao Carrinho</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDirectWhatsApp}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Pedir no WhatsApp</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

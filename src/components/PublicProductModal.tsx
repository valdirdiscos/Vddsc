import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Disc, 
  ShoppingBag, 
  MessageCircle, 
  Check, 
  ShieldCheck, 
  MapPin, 
  Tag, 
  Music, 
  Calendar, 
  Layers, 
  Info,
  ExternalLink,
  ChevronRight,
  Share2,
  Heart,
  Flame
} from 'lucide-react';
import { SavedListing } from '../types';
import { GOLDMINE_VINYL_MEDIA, GOLDMINE_VINYL_SLEEVE } from '../constants';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { getListingFormatInfo, getItemConditionInfo, isGarimpoItem, getGarimpoReason } from '../utils/formatHelper';

interface PublicProductModalProps {
  listing: SavedListing | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (listing: SavedListing) => void;
  isInCart: boolean;
  whatsappNumber?: string;
  onOpenAuthModal?: () => void;
}

export function PublicProductModal({
  listing,
  isOpen,
  onClose,
  onAddToCart,
  isInCart,
  whatsappNumber = '5555981164666',
  onOpenAuthModal
}: PublicProductModalProps) {
  const { isCustomerLoggedIn, isInWishlist, toggleWishlist } = useCustomerAuth();

  if (!isOpen || !listing) return null;

  const isFavorited = isInWishlist(listing.id);

  const handleFavoriteClick = () => {
    if (!isCustomerLoggedIn) {
      onOpenAuthModal?.();
      return;
    }
    toggleWishlist(listing.id);
  };

  const { release, condition, pricing, drawer, customImages } = listing;
  const formatInfo = getListingFormatInfo(listing);
  const conditionInfo = getItemConditionInfo(listing);

  const mediaCondObj = GOLDMINE_VINYL_MEDIA.find(c => c.code === condition?.mediaCondition);
  const sleeveCondObj = GOLDMINE_VINYL_SLEEVE.find(c => c.code === condition?.sleeveCondition);

  // Price calculation
  const salePrice = pricing?.directPrice || pricing?.basePriceBrl || 0;

  // Format Whatsapp direct enquiry
  const handleWhatsappEnquiry = () => {
    const isSold = listing.status === 'sold';
    const text = isSold 
      ? encodeURIComponent(
          `Olá Valdir! Vi no site o item que consta como *VENDIDO*:\n\n` +
          `🎵 *${release.artist} - ${release.title}*\n` +
          `📀 Formato: ${formatInfo.fullLabel}\n` +
          `🏷️ Último Preço: R$ ${salePrice.toFixed(2)}\n` +
          `📍 Código do acervo: ${listing.barcode || listing.id}\n\n` +
          `Gostaria de saber se você tem ou consegue encomendar outra cópia desse título para mim?`
        )
      : encodeURIComponent(
          `Olá Valdir! Gostaria de saber mais informações sobre o item:\n\n` +
          `🎵 *${release.artist} - ${release.title}*\n` +
          `📀 Formato: ${formatInfo.fullLabel}\n` +
          `✨ Condição: ${conditionInfo.label}\n` +
          `🏷️ Preço: R$ ${salePrice.toFixed(2)}\n` +
          `📊 Estado: Mídia ${condition?.mediaCondition || 'N/A'} | Capa ${condition?.sleeveCondition || 'N/A'}\n` +
          `📍 Código no acervo: ${listing.barcode || listing.id}\n\n` +
          `Ainda está disponível para compra/envio?`
        );
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${release.artist} - ${release.title} | Valdir Discos`,
        text: `Confira este item (${formatInfo.badgeLabel} • ${conditionInfo.label}) no acervo do Valdir Discos: ${release.artist} - ${release.title} (R$ ${salePrice.toFixed(2)})`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const imagesToShow = [
    ...(customImages && customImages.length > 0 ? customImages : []),
    ...(release.coverImage ? [release.coverImage] : [])
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 text-xs font-black rounded-lg uppercase tracking-wider ${
                formatInfo.type === 'cd' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                formatInfo.type === 'dvd' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                formatInfo.type === 'cassette' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                'bg-amber-500/10 text-amber-800 border border-amber-500/20'
              }`}>
                {formatInfo.fullLabel}
              </span>

              {/* Novo / Usado Badge */}
              <span className={`px-2.5 py-1 text-xs font-black rounded-lg uppercase tracking-wider ${
                conditionInfo.isNew
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-800 border border-slate-300'
              }`}>
                {conditionInfo.isNew ? '✨ Novo / Lacrado' : '📻 Usado / Garimpo'}
              </span>

              {listing.barcode && (
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                  #{listing.barcode}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFavoriteClick}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isFavorited
                    ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                    : 'text-slate-500 hover:text-rose-600 hover:bg-slate-200/50'
                }`}
                title={isFavorited ? 'Remover dos Favoritos' : 'Adicionar à Lista de Desejos'}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? 'fill-rose-600' : ''}`} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
                title="Compartilhar"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Image & Details */}
              <div className="md:col-span-5 space-y-4">
                <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-lg relative group">
                  {imagesToShow.length > 0 ? (
                    <img
                      src={imagesToShow[0]}
                      alt={`${release.artist} - ${release.title}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                      <Disc className="h-16 w-16 mb-2 animate-spin text-slate-700" style={{ animationDuration: '20s' }} />
                      <span className="text-xs font-medium">Capa não disponível</span>
                    </div>
                  )}
                  
                  {/* Subtle Vinyl Groove Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 pointer-events-none" />
                </div>

                {/* Additional Photos if available */}
                {imagesToShow.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {imagesToShow.map((img, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                        <img src={img} alt="Foto adicional" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Fast Facts Badge Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500">Gravadora:</span>
                    <span className="font-bold text-slate-800">{release.label || 'Nacional'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500">Ano de Lançamento:</span>
                    <span className="font-bold text-slate-800">{release.year || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500">Prensagem:</span>
                    <span className="font-bold text-slate-800">{release.country || 'Brasil'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Gênero / Estilo:</span>
                    <span className="font-bold text-slate-800 text-right truncate max-w-[150px]">
                      {[...(release.genres || []), ...(release.styles || [])].slice(0, 2).join(', ') || 'MPB / Música'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Title, Condition, Tracklist, Price & Actions */}
              <div className="md:col-span-7 space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
                    {release.title}
                  </h3>
                  <p className="text-base sm:text-lg font-bold text-amber-700">
                    {release.artist}
                  </p>
                </div>

                {/* Sold Alert Banner if applicable */}
                {listing.status === 'sold' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-rose-600 text-white rounded-xl font-black text-xs shrink-0 uppercase tracking-wider">
                      Vendido
                    </div>
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-rose-900 text-sm">Item Esgotado / Acervo Histórico</h4>
                      <p className="text-rose-700 leading-relaxed">
                        Este exemplar já foi vendido. Mantemos o registro para fins de pesquisa e consulta ao acervo. Você pode solicitar um item similar diretamente no WhatsApp do Valdir.
                      </p>
                    </div>
                  </div>
                )}

                {/* Garimpo Alert Banner if applicable */}
                {isGarimpoItem(listing) && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-black text-xs shrink-0 uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <Flame className="h-3.5 w-3.5 fill-white" />
                      <span>Garimpo</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-orange-950 text-sm flex items-center gap-1.5">
                        <span>Item da Sessão Garimpo & Oportunidades</span>
                      </h4>
                      <p className="text-orange-900/85 leading-relaxed">
                        {getGarimpoReason(listing)} — Excelente custo-benefício para sua coleção! Item disponibilizado por menor valor de mercado ou com marcas de época descritas.
                      </p>
                    </div>
                  </div>
                )}

                {/* Pricing Display */}
                <div className={`border rounded-2xl p-4 flex items-center justify-between ${
                  listing.status === 'sold' 
                    ? 'bg-slate-100 border-slate-200 text-slate-500' 
                    : 'bg-amber-50/60 border-amber-200/80'
                }`}>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500">
                      {listing.status === 'sold' ? 'Último Preço Registrado' : 'Preço de Venda'}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-3xl font-black ${listing.status === 'sold' ? 'text-slate-600 line-through' : 'text-amber-950'}`}>
                        R$ {salePrice.toFixed(2)}
                      </span>
                      {listing.status !== 'sold' && (
                        <span className="text-xs text-amber-800 font-semibold">à vista / PIX</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {listing.status === 'sold' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-black rounded-lg">
                        Esgotado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Pronta Entrega
                      </span>
                    )}
                  </div>
                </div>

                {/* Goldmine Condition Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Disc className="h-4 w-4 text-amber-700" />
                      Avaliação do Estado de Conservação
                    </span>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded ${conditionInfo.badgeClass}`}>
                      {conditionInfo.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Media Condition */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {formatInfo.type === 'cd' ? 'Estado do CD (Mídia):' : formatInfo.type === 'dvd' ? 'Estado do DVD (Mídia):' : formatInfo.type === 'cassette' ? 'Estado da Fita K7:' : 'Estado do Vinil (Mídia):'}
                        </span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${mediaCondObj?.vibe || 'bg-slate-200 text-slate-800'}`}>
                          {condition?.mediaCondition || (conditionInfo.isNew ? 'M' : 'VG+')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {condition?.mediaDetails || (conditionInfo.isNew ? 'Item novo, nunca tocado, sem qualquer marca de uso.' : mediaCondObj?.description || 'Testado e higienizado, toca com excelente fidelidade.')}
                      </p>
                    </div>

                    {/* Sleeve Condition */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium">Estado da Capa / Encarte:</span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${sleeveCondObj?.vibe || 'bg-slate-200 text-slate-800'}`}>
                          {condition?.sleeveCondition || (conditionInfo.isNew ? 'M' : 'VG+')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {condition?.sleeveDetails || (conditionInfo.isNew ? 'Capa perfeita, lacre original ou impecável.' : sleeveCondObj?.description || 'Capa íntegra em ótimo estado de conservação.')}
                      </p>
                    </div>
                  </div>

                  {condition?.hasInsert && (
                    <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Acompanha Encarte Original:</strong> {condition.insertDetails || 'Encarte completo incluso.'}</span>
                    </div>
                  )}
                </div>

                {/* Tracklist Section if available */}
                {release.tracklist && release.tracklist.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Music className="h-4 w-4 text-amber-700" />
                      Faixas do Álbum ({release.tracklist.length})
                    </span>

                    <div className="max-h-48 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2.5 divide-y divide-slate-200/60">
                      {release.tracklist.map((tr, idx) => (
                        <div key={idx} className="py-1.5 px-2 flex items-center justify-between text-xs hover:bg-slate-100/70 rounded transition-colors">
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="font-mono text-slate-400 font-bold text-[10px] w-6 shrink-0">
                              {tr.position || `${idx + 1}`}
                            </span>
                            <span className="font-semibold text-slate-800 truncate">
                              {tr.title}
                            </span>
                          </div>
                          {tr.duration && (
                            <span className="text-[11px] font-mono text-slate-400 shrink-0">
                              {tr.duration}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Guarantee & Shipping Note */}
                <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
                  <MapPin className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Embalagem Profissional de Vinil:</strong> Enviamos com plástico protetor novo interno e externo em caixa de papelão reforçada à prova de impactos.
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  {listing.status === 'sold' ? (
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-3.5 px-5 rounded-2xl font-black text-sm bg-slate-200 text-slate-500 flex items-center justify-center gap-2 cursor-not-allowed border border-slate-300"
                    >
                      <ShoppingBag className="h-4 w-4 text-slate-400" />
                      <span>Item Vendido / Esgotado</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart(listing);
                      }}
                      className={`flex-1 py-3.5 px-5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                        isInCart
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                          : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20 active:scale-95'
                      }`}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>{isInCart ? 'No Carrinho (Adicionar Mais 1)' : 'Adicionar ao Carrinho'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleWhatsappEnquiry}
                    className={`py-3.5 px-5 font-black text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                      listing.status === 'sold'
                        ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    }`}
                  >
                    <MessageCircle className={`h-4 w-4 ${listing.status === 'sold' ? 'text-emerald-400' : 'text-slate-950'}`} />
                    <span>{listing.status === 'sold' ? 'Pedir Similar no WhatsApp' : 'Comprar no WhatsApp'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

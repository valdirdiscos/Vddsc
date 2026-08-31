import React, { useState } from 'react';
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
  Flame,
  Star,
  Package,
  Percent,
  Gift,
  Sparkles,
  Truck,
  Store
} from 'lucide-react';
import { SavedListing } from '../types';
import { GOLDMINE_VINYL_MEDIA, GOLDMINE_VINYL_SLEEVE, OFFICIAL_MARKETPLACE_LINKS } from '../constants';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { getListingFormatInfo, getItemConditionInfo, isNativistaGauchoItem, getNativistaInfo, isOnlineExclusiveItem, getOnlineExclusiveReason, getAlbumParticularities, formatTrackWithArtist, isVariousArtistsAlbum } from '../utils/formatHelper';
import { ShippingCalculatorWidget } from './ShippingCalculatorWidget';

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
  const [activeImageIdx, setActiveImageIdx] = useState(0);

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
  const particularities = getAlbumParticularities(listing);

  const mediaCondObj = GOLDMINE_VINYL_MEDIA.find(c => c.code === condition?.mediaCondition);
  const sleeveCondObj = GOLDMINE_VINYL_SLEEVE.find(c => c.code === condition?.sleeveCondition);

  // Price & Promotion calculations
  const isOutOfStockOrNone = !listing.salesChannels || listing.salesChannels.length === 0 || (listing.salesChannels.length === 1 && listing.salesChannels[0] === 'none');
  const isSold = listing.status === 'sold' || isOutOfStockOrNone;
  const salePrice = pricing?.directPrice || pricing?.basePriceBrl || 0;
  const isPromo = !!(listing.promoActive || pricing?.promoActive);
  const discountPercent = listing.discountPercent || pricing?.discountPercent || 15;
  const originalPrice = listing.originalPrice || pricing?.originalPrice || (isPromo && discountPercent > 0 ? Math.round(salePrice / (1 - discountPercent / 100)) : salePrice);
  const promoBadge = listing.promoBadge || pricing?.promoBadge || `${discountPercent}% OFF`;
  const bonusDescription = listing.bonusDescription || pricing?.bonusDescription;

  // Format Whatsapp direct enquiry
  const handleWhatsappEnquiry = () => {
    const isLote = listing.isLote;
    const promoHeader = isPromo ? `🔥 *PROMOÇÃO ATIVA: ${promoBadge}*\n` : '';
    const loteHeader = isLote ? `📦 *LOTE / COMBO PROMOCIONAL (${listing.loteItemCount || 4} DISCOS)*\n` : '';
    const bonusHeader = bonusDescription ? `🎁 *${bonusDescription}*\n` : '';

    const text = isSold 
      ? encodeURIComponent(
          `Olá Valdir! Vi no site o item que consta como *ESGOTADO/VENDIDO*:\n\n` +
          `${loteHeader}` +
          `🎵 *${release.artist} - ${release.title}*\n` +
          `📀 Formato: ${formatInfo.fullLabel}\n` +
          `🏷️ Último Preço: R$ ${salePrice.toFixed(2)}\n` +
          `📍 Código do acervo: ${listing.barcode || listing.id}\n\n` +
          `Gostaria de saber se você tem ou consegue encomendar outro similar para mim?`
        )
      : encodeURIComponent(
          `Olá Valdir! Gostaria de comprar o item anunciado no site:\n\n` +
          `${loteHeader}${promoHeader}${bonusHeader}` +
          `🎵 *${release.artist} - ${release.title}*\n` +
          `📀 Formato: ${formatInfo.fullLabel}\n` +
          `✨ Condição: ${conditionInfo.label}\n` +
          `🏷️ Preço: R$ ${salePrice.toFixed(2)} ${isPromo ? `(${discountPercent}% OFF)` : ''}\n` +
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
    ...(customImages && customImages.length > 0 ? customImages.filter(Boolean) : []),
    ...(release.coverImage ? [release.coverImage] : [])
  ];

  const currentCover = imagesToShow[activeImageIdx] || imagesToShow[0];

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
                {conditionInfo.isNew ? '✨ Novo / Lacrado' : condition?.mediaCondition ? `Usado (${condition.mediaCondition})` : 'Usado'}
              </span>

              {/* Nativista / Música Gaúcha Badge */}
              {isNativistaGauchoItem(listing) && (
                <span className="px-2.5 py-1 text-xs font-black rounded-lg uppercase tracking-wider bg-emerald-800 text-white shadow-xs flex items-center gap-1 border border-emerald-600/40">
                  <span>🧉</span>
                  Música Gaúcha (Nativista)
                </span>
              )}

              {/* Exclusivo Loja Online Badge */}
              {isOnlineExclusiveItem(listing) && (
                <span className="px-2.5 py-1 text-xs font-black rounded-lg uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-xs flex items-center gap-1 border border-yellow-300">
                  <Star className="h-3 w-3 fill-slate-950 text-slate-950" />
                  ⭐ Exclusivo do Site
                </span>
              )}

              {/* Particularities Badges in Modal Header */}
              {particularities.map((part) => (
                <span
                  key={part.id}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-xs border ${part.badgeClass}`}
                >
                  <span>{part.icon}</span>
                  <span>{part.label}</span>
                </span>
              ))}

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
                  {currentCover ? (
                    <img
                      src={currentCover}
                      alt={`${release.artist} - ${release.title}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                      <Disc className="h-16 w-16 mb-2 animate-spin text-slate-700" style={{ animationDuration: '20s' }} />
                      <span className="text-xs font-medium">Capa não disponível</span>
                    </div>
                  )}
                  
                  {/* Subtle Vinyl Groove Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 pointer-events-none" />

                  {/* Badges on Modal Photo */}
                  {particularities.length > 0 && (
                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 pointer-events-none z-10">
                      {particularities.map((part) => (
                        <span
                          key={part.id}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg border backdrop-blur-xs ${part.badgeClass}`}
                        >
                          <span>{part.icon}</span>
                          <span>{part.label}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Photos if available */}
                {imagesToShow.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {imagesToShow.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          activeImageIdx === idx ? 'border-amber-500 ring-2 ring-amber-500/20 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={img} 
                          alt={`Foto ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      </button>
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

                {/* Música Gaúcha & Nativista Alert Banner if applicable */}
                {isNativistaGauchoItem(listing) && (
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-300/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                    <div className="p-2 bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-xl font-black text-xs shrink-0 uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <span>🧉</span>
                      <span>Nativista</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                        <span>Música Gaúcha & Nativismo (Rio Grande do Sul)</span>
                      </h4>
                      <p className="text-emerald-900/85 leading-relaxed">
                        Álbum clássico do regionalismo e tradicionalismo gaúcho (milongas, chamamés, vanerões e poesia pampeana).
                      </p>
                    </div>
                  </div>
                )}

                {/* Exclusivo da Loja Online Alert Banner if applicable */}
                {isOnlineExclusiveItem(listing) && (
                  <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/60 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                    <div className="p-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-xl font-black text-xs shrink-0 uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <Star className="h-3.5 w-3.5 fill-slate-950 text-slate-950" />
                      <span>Exclusivo</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                        <span>⭐ Disco Raro — Venda Exclusiva pelo Site</span>
                      </h4>
                      <p className="text-amber-900/90 leading-relaxed font-medium">
                        {getOnlineExclusiveReason(listing)} Este exemplar é reservado exclusivamente para os clientes da nossa loja online oficial (não disponível em balcão ou marketplaces).
                      </p>
                    </div>
                  </div>
                )}

                {/* Particularidades da Edição (Álbum Duplo, Box Set, Capa Dupla, Edição Especial) */}
                {particularities.length > 0 && (
                  <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-amber-50/50 border border-indigo-200/80 rounded-2xl p-4 space-y-2.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-indigo-600" />
                        Particularidades desta Edição
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {particularities.map((part) => (
                        <div
                          key={part.id}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-indigo-200/60 text-slate-800 shadow-2xs flex items-center gap-2"
                        >
                          <span className="text-base">{part.icon}</span>
                          <div>
                            <div className="text-[11px] font-black text-slate-900 leading-none">{part.label}</div>
                            {part.id === 'special_edition' && listing.specialEditionDetails && (
                              <div className="text-[10px] text-slate-500 font-medium mt-0.5">{listing.specialEditionDetails}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing Display */}
                <div className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  listing.status === 'sold' 
                    ? 'bg-slate-100 border-slate-200 text-slate-500' 
                    : isPromo
                    ? 'bg-gradient-to-r from-rose-50 via-amber-50/50 to-orange-50/50 border-rose-300 shadow-xs'
                    : 'bg-amber-50/60 border-amber-200/80'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500">
                        {listing.status === 'sold' ? 'Último Preço Registrado' : isPromo ? 'Preço Promocional Especial' : 'Preço de Venda'}
                      </span>
                      {isPromo && (
                        <span className="px-2 py-0.5 bg-rose-600 text-white font-black text-[10px] rounded-md uppercase tracking-wider shadow-2xs flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          {promoBadge}
                        </span>
                      )}
                      {listing.isLote && (
                        <span className="px-2 py-0.5 bg-slate-900 text-amber-400 font-black text-[10px] rounded-md uppercase tracking-wider font-mono">
                          LOTE {listing.loteItemCount || 4} DISCOS
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 flex-wrap">
                      {isPromo && originalPrice > salePrice && (
                        <span className="text-sm line-through text-slate-400 font-mono font-bold">
                          R$ {originalPrice.toFixed(2)}
                        </span>
                      )}
                      <span className={`text-3xl font-black ${
                        listing.status === 'sold' 
                          ? 'text-slate-600 line-through' 
                          : isPromo 
                          ? 'text-rose-600' 
                          : 'text-amber-950'
                      }`}>
                        R$ {salePrice.toFixed(2)}
                      </span>
                      {listing.status !== 'sold' && (
                        <span className="text-xs text-amber-800 font-semibold">à vista / PIX</span>
                      )}
                    </div>

                    {isPromo && originalPrice > salePrice && (
                      <span className="text-[11px] font-bold text-emerald-700 block mt-1">
                        Economia de R$ {(originalPrice - salePrice).toFixed(2)} ({discountPercent}% de desconto neste produto)!
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
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

                {/* Bonus Description Banner */}
                {bonusDescription && (
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-2xl flex items-start gap-3 shadow-2xs">
                    <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shrink-0 mt-0.5">
                      <Gift className="h-4 w-4" />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <span className="font-black text-amber-950 uppercase tracking-wider text-[11px] block">
                        🎁 Brinde / Bônus Especial Incluso:
                      </span>
                      <p className="text-amber-900 font-bold leading-relaxed">{bonusDescription}</p>
                    </div>
                  </div>
                )}

                {/* Lote Item Cards Grid (4 Discos do Lote) */}
                {listing.isLote && listing.loteItems && listing.loteItems.length > 0 && (
                  <div className="space-y-3 p-4 bg-slate-50 border border-indigo-200 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-indigo-600" />
                        Discos Inclusos Neste Lote ({listing.loteItems.length} Discos)
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        Fotos & Dados dos Itens Originais
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {listing.loteItems.map((item, idx) => (
                        <div key={item.id || idx} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-3 shadow-2xs hover:border-indigo-300 transition-colors">
                          <div className="w-14 h-14 bg-slate-900 rounded-lg overflow-hidden shrink-0 relative">
                            {item.coverImage ? (
                              <img
                                src={item.coverImage}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <Disc className="h-6 w-6" />
                              </div>
                            )}
                            <span className="absolute top-0 left-0 bg-slate-950/80 text-amber-400 font-mono text-[9px] font-black px-1 rounded-br">
                              #{idx + 1}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h5 className="font-black text-xs text-slate-900 truncate" title={item.title}>
                              {item.title}
                            </h5>
                            <p className="text-[11px] font-bold text-indigo-700 truncate">
                              {item.artist}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              {item.condition && <span className="font-semibold">{item.condition}</span>}
                              {item.year && <span>• {item.year}</span>}
                              {item.price > 0 && <span className="font-mono font-bold text-slate-700">• R$ {item.price.toFixed(2)}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                {release.tracklist && release.tracklist.length > 0 && (() => {
                  const isVA = isVariousArtistsAlbum(release);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Music className="h-4 w-4 text-amber-700" />
                          Faixas do Álbum ({release.tracklist.length})
                        </span>
                        {isVA && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                            ✨ Coletânea V.A. (Artistas Identificados)
                          </span>
                        )}
                      </div>

                      <div className="max-h-56 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2.5 divide-y divide-slate-200/60">
                        {release.tracklist.map((tr, idx) => {
                          const trInfo = formatTrackWithArtist(tr, isVA);
                          return (
                            <div key={idx} className="py-2 px-2 flex items-center justify-between text-xs hover:bg-slate-100/70 rounded transition-colors gap-2">
                              <div className="flex items-center gap-2 min-w-0 pr-2 flex-1">
                                <span className="font-mono text-slate-400 font-bold text-[10px] w-6 shrink-0">
                                  {trInfo.position || `${idx + 1}`}
                                </span>
                                {trInfo.artist && (
                                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50/90 border border-indigo-200/80 px-1.5 py-0.5 rounded shrink-0">
                                    {trInfo.artist}
                                  </span>
                                )}
                                <span className="font-semibold text-slate-800 truncate">
                                  {trInfo.title}
                                </span>
                              </div>
                              {tr.duration && (
                                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                                  {tr.duration}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Correios Shipping Calculator Widget */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-[#003882]" />
                    Simulador de Frete Correios (Origem: Santa Maria - RS)
                  </span>
                  <ShippingCalculatorWidget 
                    compact
                    itemsCount={listing.isLote && listing.loteItems?.length ? listing.loteItems.length : 1}
                    format={formatInfo.type === 'cd' ? 'cd' : formatInfo.type === 'cassette' ? 'cassette' : 'vinyl'}
                    declaredValue={pricing?.directPrice || pricing?.basePriceBrl || 0}
                  />
                </div>

                {/* Guarantee & Shipping Note */}
                <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
                  <MapPin className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Embalagem Profissional de Vinil:</strong> Enviamos com plástico protetor novo interno e externo em caixa de papelão reforçada à prova de impactos.
                  </div>
                </div>

                {/* Official Marketplaces Strip */}
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <span className="text-amber-950 font-bold flex items-center gap-1.5 text-[11px]">
                    <Store className="h-3.5 w-3.5 text-amber-800" />
                    Lojas Oficiais:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <a
                      href={OFFICIAL_MARKETPLACE_LINKS.shopee.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded-md bg-[#ee4d2d]/15 hover:bg-[#ee4d2d] text-[#ee4d2d] hover:text-white font-black text-[10.5px] border border-[#ee4d2d]/30 transition-all flex items-center gap-1"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      Shopee
                    </a>
                    <a
                      href={OFFICIAL_MARKETPLACE_LINKS.mercadolivre.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded-md bg-[#ffe600]/30 hover:bg-[#ffe600] text-slate-950 font-black text-[10.5px] border border-[#ffe600]/50 transition-all flex items-center gap-1"
                    >
                      <Store className="h-3 w-3" />
                      Mercado Livre
                    </a>
                    <a
                      href={OFFICIAL_MARKETPLACE_LINKS.discogs.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-900 text-slate-200 hover:text-white font-black text-[10.5px] border border-slate-700 transition-all flex items-center gap-1"
                    >
                      <Disc className="h-3 w-3" />
                      Discogs
                    </a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  {isSold ? (
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
                      isSold
                        ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    }`}
                  >
                    <MessageCircle className={`h-4 w-4 ${isSold ? 'text-emerald-400' : 'text-slate-950'}`} />
                    <span>{isSold ? 'Pedir Similar no WhatsApp' : 'Comprar no WhatsApp'}</span>
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

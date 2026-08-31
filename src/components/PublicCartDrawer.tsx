import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Check, 
  Copy, 
  MessageCircle, 
  QrCode, 
  Truck, 
  Store, 
  ShieldCheck, 
  AlertCircle,
  LogIn,
  CheckCircle2,
  PackageCheck,
  Disc,
  ArrowRight,
  UserCheck,
  Shirt,
  Music,
  Download,
  FileAudio,
  MapPin
} from 'lucide-react';
import { SavedListing, CustomerOnlineOrder, OnlineOrderItem, TShirtSize, TShirtModel, TShirtColor, AudioFormat } from '../types';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { ShippingCalculatorWidget } from './ShippingCalculatorWidget';
import { ShippingOption } from '../utils/shippingCalculator';

export interface PublicCartTShirt {
  id: string;
  name: string;
  size: TShirtSize;
  color: TShirtColor;
  model: TShirtModel;
  price: number;
  image: string;
}

export interface PublicCartDigitalItem {
  id: string;
  title: string;
  artist: string;
  price: number;
  coverImage: string;
  format: AudioFormat;
  isFullAlbum: boolean;
  albumId: string;
  trackId?: string;
}

export interface PublicCartItem {
  id: string;
  itemType?: 'vinyl' | 'tshirt' | 'digital';
  listing?: SavedListing;
  tshirt?: PublicCartTShirt;
  digital?: PublicCartDigitalItem;
  quantity: number;
}

interface PublicCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: PublicCartItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQty: (itemId: string, qty: number) => void;
  onClearCart: () => void;
  whatsappNumber?: string;
  pixKey?: string;
  onOpenAuthModal?: () => void;
}

export function PublicCartDrawer({
  isOpen,
  onClose,
  cart,
  onRemoveItem,
  onUpdateQty,
  onClearCart,
  whatsappNumber = '5555981164666',
  pixKey = 'valdirdiscos@gmail.com',
  onOpenAuthModal
}: PublicCartDrawerProps) {
  const { currentCustomer, isCustomerLoggedIn, createOnlineOrder } = useCustomerAuth();

  const [deliveryType, setDeliveryType] = useState<'shipping' | 'pickup' | 'digital'>('shipping');
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerState, setCustomerState] = useState('RS');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCep, setCustomerCep] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  const [showPixModal, setShowPixModal] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CustomerOnlineOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasPhysicalItems = cart.some(item => !item.digital);
  const isOnlyDigital = cart.length > 0 && !hasPhysicalItems;

  // Auto-fill from logged-in customer profile
  useEffect(() => {
    if (currentCustomer) {
      if (!customerName) setCustomerName(currentCustomer.name || '');
      if (!customerEmail) setCustomerEmail(currentCustomer.email || '');
      if (!customerPhone && currentCustomer.phone) setCustomerPhone(currentCustomer.phone);
      if (currentCustomer.address) {
        if (!customerCep && currentCustomer.address.cep) setCustomerCep(currentCustomer.address.cep);
        if (!customerCity && currentCustomer.address.city) setCustomerCity(currentCustomer.address.city);
        if (!customerState && currentCustomer.address.state) setCustomerState(currentCustomer.address.state);
        if (!customerAddress && currentCustomer.address.street) {
          setCustomerAddress(`${currentCustomer.address.street}, ${currentCustomer.address.number || 'S/N'}${currentCustomer.address.neighborhood ? ' - ' + currentCustomer.address.neighborhood : ''}`);
        }
      }
    }
  }, [currentCustomer]);

  useEffect(() => {
    if (isOnlyDigital) {
      setDeliveryType('digital');
    } else if (deliveryType === 'digital') {
      setDeliveryType('shipping');
    }
  }, [isOnlyDigital]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => {
    let price = 0;
    if (item.digital) {
      price = item.digital.price;
    } else if (item.tshirt) {
      price = item.tshirt.price;
    } else {
      price = item.listing?.pricing?.directPrice || item.listing?.pricing?.basePriceBrl || 0;
    }
    return acc + price * item.quantity;
  }, 0);

  const shippingCost = isOnlyDigital 
    ? 0 
    : (deliveryType === 'pickup' ? 0 : (selectedShipping?.price || 0));

  const finalTotal = subtotal + shippingCost;
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const physicalItemsCount = cart.reduce((acc, item) => item.digital ? acc : acc + item.quantity, 0);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleCreateAndCheckout = async (viaWhatsapp: boolean = true) => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    const orderItems: OnlineOrderItem[] = cart.map(item => {
      if (item.digital) {
        return {
          listingId: item.id,
          barcode: `DIGITAL-${item.digital.format}-${item.id}`.toUpperCase(),
          artist: item.digital.artist,
          title: `${item.digital.title} [Formato ${item.digital.format}]`,
          price: item.digital.price,
          coverImage: item.digital.coverImage,
          mediaCondition: 'Digital Master Lossless',
          sleeveCondition: 'Arte Digital HD'
        };
      }
      if (item.tshirt) {
        return {
          listingId: item.id,
          barcode: `TSHIRT-${item.tshirt.size}-${item.tshirt.color.id}`.toUpperCase(),
          artist: 'Camisetas Valdir Discos',
          title: `${item.tshirt.name} (${item.tshirt.model} • Tam ${item.tshirt.size} • Cor: ${item.tshirt.color.name})`,
          price: item.tshirt.price,
          coverImage: item.tshirt.image,
          mediaCondition: 'Nova / 100% Algodão',
          sleeveCondition: 'Embalagem Selada'
        };
      }
      return {
        listingId: item.listing?.id || item.id,
        barcode: item.listing?.barcode || '',
        artist: item.listing?.release.artist || '',
        title: item.listing?.release.title || '',
        price: item.listing?.pricing?.directPrice || item.listing?.pricing?.basePriceBrl || 0,
        coverImage: item.listing?.release.coverImage,
        mediaCondition: item.listing?.condition?.mediaCondition || 'VG+',
        sleeveCondition: item.listing?.condition?.sleeveCondition || 'VG+',
        drawer: item.listing?.drawer
      };
    });

    try {
      const order = await createOnlineOrder({
        customerId: currentCustomer ? currentCustomer.id : `guest_${Date.now()}`,
        customerName: customerName.trim() || (currentCustomer ? currentCustomer.name : 'Cliente'),
        customerEmail: customerEmail.trim() || (currentCustomer ? currentCustomer.email : 'cliente@valdirdiscos.com'),
        customerPhone: customerPhone.trim(),
        items: orderItems,
        subtotal,
        shippingCost,
        discount: 0,
        totalAmount: finalTotal,
        deliveryType: deliveryType === 'digital' ? 'pickup' : deliveryType,
        shippingAddress: deliveryType === 'shipping' ? {
          cep: customerCep,
          street: customerAddress,
          number: '',
          neighborhood: '',
          city: customerCity || 'Santa Maria',
          state: customerState || 'RS'
        } : undefined,
        paymentMethod: 'PIX',
        paymentStatus: 'pendente',
        fulfillmentStatus: 'aguardando_pagamento',
        notes: `${orderNotes ? orderNotes + ' | ' : ''}Frete: ${selectedShipping ? selectedShipping.name : (deliveryType === 'pickup' ? 'Retirada no Balcão em Santa Maria RS' : 'Música Digital')}`
      });

      setCompletedOrder(order);
      onClearCart();

      if (viaWhatsapp) {
        let msg = `🎵 *NOVO PEDIDO ${order.orderNumber} - VALDIR DISCOS*\n`;
        msg += `📍 *Origem da Loja:* Santa Maria - Rio Grande do Sul (RS)\n`;
        msg += `------------------------------------\n`;
        msg += `👤 *Cliente:* ${order.customerName}\n`;
        msg += `📱 *WhatsApp:* ${order.customerPhone || 'Não informado'}\n`;
        msg += `📧 *E-mail:* ${order.customerEmail}\n`;
        
        if (deliveryType === 'digital') {
          msg += `📦 *Modalidade:* ⚡ Download Digital Imediato\n`;
        } else if (deliveryType === 'pickup') {
          msg += `📦 *Modalidade:* 📍 Retirada Grátis no Balcão (Santa Maria - RS)\n`;
        } else {
          msg += `📦 *Modalidade:* 🚚 ${selectedShipping?.name || 'Envio Correios/Transportadora'}\n`;
          if (customerCep) msg += `📮 *CEP Destino:* ${customerCep}\n`;
          if (customerAddress) msg += `🏠 *Endereço:* ${customerAddress} - ${customerCity}/${customerState}\n`;
        }

        msg += `------------------------------------\n`;
        msg += `🛍️ *ITENS DO PEDIDO (${totalItemsCount}):*\n\n`;

        cart.forEach((item, idx) => {
          if (item.digital) {
            msg += `${idx + 1}. 🎧 *${item.digital.title}*\n`;
            msg += `   Artista: ${item.digital.artist} | Formato: ${item.digital.format} | Qtd: ${item.quantity}x (R$ ${(item.digital.price * item.quantity).toFixed(2)})\n\n`;
          } else if (item.tshirt) {
            msg += `${idx + 1}. 👕 *${item.tshirt.name}*\n`;
            msg += `   Modelagem: ${item.tshirt.model} | Tam: ${item.tshirt.size} | Cor: ${item.tshirt.color.name} | Qtd: ${item.quantity}x (R$ ${(item.tshirt.price * item.quantity).toFixed(2)})\n\n`;
          } else if (item.listing) {
            const price = item.listing.pricing?.directPrice || item.listing.pricing?.basePriceBrl || 0;
            const media = item.listing.condition?.mediaCondition || 'VG+';
            const sleeve = item.listing.condition?.sleeveCondition || 'VG+';
            msg += `${idx + 1}. 📀 *${item.listing.release.artist} - ${item.listing.release.title}*\n`;
            msg += `   Mídia ${media} / Capa ${sleeve} | Qtd: ${item.quantity}x (R$ ${(price * item.quantity).toFixed(2)})\n\n`;
          }
        });

        msg += `------------------------------------\n`;
        msg += `💵 *Subtotal dos Itens:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
        if (shippingCost > 0) {
          msg += `🚚 *Frete (${selectedShipping?.name || 'Envio'}):* R$ ${shippingCost.toFixed(2).replace('.', ',')}\n`;
        } else if (deliveryType === 'pickup') {
          msg += `📍 *Frete:* Grátis (Retirada no Balcão em Santa Maria RS)\n`;
        } else if (deliveryType === 'digital') {
          msg += `⚡ *Envio Digital:* Grátis por Download\n`;
        }
        msg += `💰 *VALOR TOTAL: R$ ${finalTotal.toFixed(2).replace('.', ',')} (PIX)*\n`;
        if (orderNotes.trim()) msg += `📝 *Obs:* ${orderNotes.trim()}\n`;
        msg += `\nOlá Valdir! Registrei o pedido *${order.orderNumber}* no site e gostaria de confirmar os dados para pagamento via PIX e envio de Santa Maria - RS!`;

        const url = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      }
    } catch (e) {
      console.warn('Error creating online order:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-900 border border-amber-500/30 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Carrinho de Compras</h3>
                <span className="text-xs text-slate-500 font-medium">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item selecionado' : 'itens selecionados'} • Santa Maria - RS
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCompletedOrder(null);
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* If an order was just confirmed */}
          {completedOrder ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200">
                <PackageCheck className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pedido Registrado com Sucesso!</span>
                <h3 className="text-2xl font-black text-slate-900 font-mono">{completedOrder.orderNumber}</h3>
                <p className="text-xs text-slate-500">
                  Obrigado, <strong>{completedOrder.customerName}</strong>! Seu pedido foi registrado direto com a loja física em <strong>Santa Maria - RS</strong>.
                </p>
              </div>

              {/* PIX instructions box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <QrCode className="h-4 w-4 text-emerald-600" />
                    Chave PIX Oficial da Loja:
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-700">
                    R$ {completedOrder.totalAmount.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800">
                  <span className="truncate">{pixKey}</span>
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="ml-2 p-1.5 text-amber-700 hover:text-amber-800 cursor-pointer"
                  >
                    {copiedPix ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {copiedPix && <span className="text-[11px] font-bold text-emerald-600 block">Chave PIX copiada! ✓</span>}
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá Valdir! Acabei de registrar o pedido *${completedOrder.orderNumber}* no site e gostaria de enviar o comprovante PIX.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Enviar Comprovante pelo WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setCompletedOrder(null);
                    onClose();
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Continuar Navegando
                </button>
              </div>
            </div>
          ) : (
            /* Standard Cart Drawer Flow */
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* Customer Account Prompt or Logged-In Badge */}
              {isCustomerLoggedIn && currentCustomer ? (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-700" />
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block">Conectado como {currentCustomer.name.split(' ')[0]}</span>
                      <span className="text-[10px] text-emerald-800">Endereço e histórico sincronizados</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200/60 text-emerald-900 rounded-full">
                    Minha Conta
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-amber-950 block">Tem conta de cliente?</span>
                    <span className="text-[11px] text-amber-800">Faça login para salvar seus pedidos e endereços.</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Entrar</span>
                  </button>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Seu carrinho está vazio</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Explore nosso acervo de vinis, música digital em alta resolução e camisetas exclusivas.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm"
                  >
                    Explorar Catálogo
                  </button>
                </div>
              ) : (
                <>
                  {/* List of Items */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <span>Itens Selecionados</span>
                      <button
                        type="button"
                        onClick={onClearCart}
                        className="text-rose-600 hover:underline cursor-pointer font-semibold lowercase"
                      >
                        esvaziar carrinho
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                      {cart.map((item) => {
                        const isDigital = Boolean(item.digital);
                        const isTshirt = Boolean(item.tshirt);
                        
                        let price = 0;
                        if (isDigital) price = item.digital!.price;
                        else if (isTshirt) price = item.tshirt!.price;
                        else price = item.listing?.pricing?.directPrice || item.listing?.pricing?.basePriceBrl || 0;

                        return (
                          <div key={item.id} className="p-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">
                            {/* Visual Thumbnail */}
                            <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-200 shadow-xs flex items-center justify-center">
                              {isDigital ? (
                                <img 
                                  src={item.digital!.coverImage} 
                                  alt={item.digital!.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : isTshirt ? (
                                <div 
                                  className="w-full h-full p-1 flex items-center justify-center relative"
                                  style={{ backgroundColor: item.tshirt!.color.hex }}
                                >
                                  <img 
                                    src={item.tshirt!.image} 
                                    alt={item.tshirt!.name} 
                                    className="w-full h-full object-contain rounded-full bg-white/90 p-0.5" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              ) : item.listing?.release.coverImage ? (
                                <img 
                                  src={item.listing.release.coverImage} 
                                  alt={item.listing.release.title} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">LP</div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs text-slate-900 truncate">
                                {isDigital 
                                  ? item.digital!.title 
                                  : isTshirt 
                                    ? item.tshirt!.name 
                                    : item.listing?.release.title}
                              </h4>
                              <p className="text-[11px] text-amber-800 font-semibold truncate">
                                {isDigital 
                                  ? `${item.digital!.artist} • ${item.digital!.format}`
                                  : isTshirt 
                                    ? `${item.tshirt!.model} • Tam: ${item.tshirt!.size}` 
                                    : item.listing?.release.artist}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {isDigital ? (
                                  <span className="text-[9px] font-bold bg-cyan-50 text-cyan-900 px-1.5 py-0.2 rounded border border-cyan-200">
                                    Download {item.digital!.format}
                                  </span>
                                ) : isTshirt ? (
                                  <span className="text-[9px] font-bold bg-amber-50 text-amber-900 px-1.5 py-0.2 rounded border border-amber-200">
                                    {item.tshirt!.color.name}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                                    Mídia: {item.listing?.condition?.mediaCondition || 'VG+'}
                                  </span>
                                )}
                                <span className="text-xs font-black text-slate-950 font-mono">
                                  R$ {price.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remover do carrinho"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delivery / Shipping Options & Calculator */}
                  {hasPhysicalItems ? (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Opção de Frete & Entrega (Origem: Santa Maria - RS)
                      </span>

                      {/* Integrated Shipping Calculator */}
                      <ShippingCalculatorWidget 
                        selectedOptionId={selectedShipping?.id || (deliveryType === 'pickup' ? 'pickup' : undefined)}
                        itemsCount={Math.max(1, physicalItemsCount)}
                        declaredValue={subtotal}
                        initialCep={customerCep}
                        onSelectOption={(opt) => {
                          setSelectedShipping(opt);
                          if (opt.id === 'pickup') {
                            setDeliveryType('pickup');
                          } else {
                            setDeliveryType('shipping');
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-center gap-3">
                      <Download className="h-5 w-5 text-cyan-700 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold text-cyan-950 block">Música Digital • Download Imediato</span>
                        <span className="text-cyan-800 text-[11px]">Links de alta velocidade enviados por e-mail e WhatsApp após confirmação PIX.</span>
                      </div>
                    </div>
                  )}

                  {/* Customer Details Form */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Dados para Emissão e Envio
                    </span>

                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Seu Nome Completo *"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          placeholder="WhatsApp / Celular *"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                        <input
                          type="email"
                          placeholder="E-mail *"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>

                      {deliveryType === 'shipping' && (
                        <div className="space-y-2 pt-1">
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="CEP *"
                              value={customerCep}
                              onChange={(e) => setCustomerCep(e.target.value)}
                              className="col-span-1 text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                            />
                            <input
                              type="text"
                              placeholder="Cidade *"
                              value={customerCity}
                              onChange={(e) => setCustomerCity(e.target.value)}
                              className="col-span-2 text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                            />
                          </div>

                          <input
                            type="text"
                            placeholder="Endereço Completo (Rua, Número, Bairro, Complemento)"
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                        </div>
                      )}

                      <textarea
                        rows={2}
                        placeholder="Observações do pedido (opcional)..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden resize-none"
                      />
                    </div>
                  </div>

                  {/* Summary & Checkout CTA */}
                  <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Subtotal dos Itens:</span>
                      <span className="font-bold text-slate-900 font-mono">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Frete (Santa Maria - RS):</span>
                      <span className="font-bold text-emerald-800 font-mono">
                        {shippingCost === 0 ? (
                          <span className="text-emerald-700 font-bold uppercase text-[11px]">
                            {isOnlyDigital ? 'Grátis (Download)' : 'Grátis (Balcão)'}
                          </span>
                        ) : (
                          `+ R$ ${shippingCost.toFixed(2).replace('.', ',')} (${selectedShipping?.name || 'Envio'})`
                        )}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-sm font-black text-slate-900">
                      <span>Total Final do Pedido:</span>
                      <span className="text-lg font-black text-amber-950 font-mono">
                        R$ {finalTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="space-y-2 pt-1.5">
                      <button
                        type="button"
                        onClick={() => handleCreateAndCheckout(true)}
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Fechar Pedido no WhatsApp • R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCreateAndCheckout(false)}
                        disabled={isSubmitting}
                        className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <QrCode className="h-4 w-4 text-emerald-600" />
                        <span>Pagar Direto via Chave PIX</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

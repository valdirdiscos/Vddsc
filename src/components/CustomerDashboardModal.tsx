import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Package, 
  Heart, 
  MapPin, 
  Lock, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ShoppingBag, 
  ExternalLink, 
  MessageCircle, 
  Disc, 
  AlertCircle, 
  Trash2,
  Sparkles,
  Search,
  Save,
  KeyRound,
  DollarSign
} from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { SavedListing, CustomerOnlineOrder, CustomerAddress } from '../types';

interface CustomerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: SavedListing[];
  onAddToCart: (listing: SavedListing) => void;
  onOpenProductModal?: (listing: SavedListing) => void;
}

export const CustomerDashboardModal: React.FC<CustomerDashboardModalProps> = ({
  isOpen,
  onClose,
  listings,
  onAddToCart,
  onOpenProductModal
}) => {
  const { 
    currentCustomer, 
    customerOrders, 
    updateCustomerProfile, 
    logoutCustomer, 
    toggleWishlist 
  } = useCustomerAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'address' | 'security'>('orders');

  // Address edit state
  const [name, setName] = useState(currentCustomer?.name || '');
  const [phone, setPhone] = useState(currentCustomer?.phone || '');
  const [cpf, setCpf] = useState(currentCustomer?.cpf || '');
  const [cep, setCep] = useState(currentCustomer?.address?.cep || '');
  const [street, setStreet] = useState(currentCustomer?.address?.street || '');
  const [number, setNumber] = useState(currentCustomer?.address?.number || '');
  const [complement, setComplement] = useState(currentCustomer?.address?.complement || '');
  const [neighborhood, setNeighborhood] = useState(currentCustomer?.address?.neighborhood || '');
  const [city, setCity] = useState(currentCustomer?.address?.city || '');
  const [state, setState] = useState(currentCustomer?.address?.state || 'SP');
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Security password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !currentCustomer) return null;

  // Find wishlist items in listings
  const wishlistItems = listings.filter(l => (currentCustomer.wishlist || []).includes(l.id));

  // Auto-fetch address via ViaCEP
  const handleCepLookup = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setState(data.uf || 'SP');
        }
      } catch (err) {
        console.warn('ViaCEP lookup error:', err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    const addressData: CustomerAddress = {
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state
    };

    const res = await updateCustomerProfile({
      name,
      phone,
      cpf,
      address: addressData
    });

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: 'Seus dados de entrega foram salvos com sucesso!' });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (newPassword.length < 5) {
      setFeedbackMsg({ type: 'error', text: 'A nova senha deve ter pelo menos 5 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedbackMsg({ type: 'error', text: 'As senhas digitadas não coincidem.' });
      return;
    }

    const res = await updateCustomerProfile({
      password: newPassword
    });

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: 'Sua senha foi alterada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setFeedbackMsg(null), 3500);
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const getFulfillmentBadge = (status: CustomerOnlineOrder['fulfillmentStatus']) => {
    switch (status) {
      case 'aguardando_pagamento':
        return {
          label: 'Aguardando Pagamento PIX',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <Clock className="h-3.5 w-3.5 text-amber-600" />
        };
      case 'em_separacao':
        return {
          label: 'Embalando com Proteção Dupla',
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: <Package className="h-3.5 w-3.5 text-blue-600" />
        };
      case 'enviado':
        return {
          label: 'Enviado via Correios',
          bg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          icon: <Truck className="h-3.5 w-3.5 text-indigo-600" />
        };
      case 'pronto_retirada':
        return {
          label: 'Pronto p/ Retirada no Balcão',
          bg: 'bg-purple-100 text-purple-900 border-purple-300',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
        };
      case 'entregue':
        return {
          label: 'Entregue com Sucesso',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        };
      default:
        return {
          label: 'Processando',
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: <Clock className="h-3.5 w-3.5 text-slate-600" />
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Profile Bar */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl shadow-inner">
              {currentCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Olá, {currentCustomer.name.split(' ')[0]}!
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Cliente Valdir Discos
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span>{currentCustomer.email}</span>
                {currentCustomer.phone && <span>• {currentCustomer.phone}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                logoutCustomer();
                onClose();
              }}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair da Conta</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/90 px-4 pt-2 gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package className="h-4 w-4 text-amber-700" />
            <span>Meus Pedidos ({customerOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`pb-3 px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'wishlist'
                ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Heart className="h-4 w-4 text-rose-600" />
            <span>Lista de Desejos ({wishlistItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={`pb-3 px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'address'
                ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="h-4 w-4 text-emerald-600" />
            <span>Dados & Endereço de Entrega</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="h-4 w-4 text-indigo-600" />
            <span>Alterar Senha</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {feedbackMsg && (
            <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}>
              {feedbackMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* TAB 1: MEUS PEDIDOS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {customerOrders.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Você ainda não realizou compras</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Navegue pelo nosso acervo de vinis, adicione ao carrinho e finalize seu pedido com frete seguro ou retirada no balcão!
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                  >
                    <Disc className="h-4 w-4" />
                    <span>Explorar o Acervo de Discos</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerOrders.map((order) => {
                    const statusMeta = getFulfillmentBadge(order.fulfillmentStatus);
                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-amber-300 transition-all space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-slate-900 font-mono">
                                {order.orderNumber}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusMeta.bg}`}>
                                {statusMeta.icon}
                                <span>{statusMeta.label}</span>
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Realizado em: {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-slate-400 block">Total do Pedido</span>
                            <span className="text-base font-black text-emerald-950 font-mono">
                              R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>

                        {/* Items in this order */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="w-10 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                                {item.coverImage ? (
                                  <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                  <Disc className="w-full h-full p-2 text-slate-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-slate-900 truncate">{item.title}</h5>
                                <p className="text-[11px] text-slate-500 truncate">{item.artist}</p>
                              </div>
                              <span className="text-xs font-black text-slate-800 font-mono shrink-0">
                                R$ {item.price.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery & Tracking Info */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-600 bg-slate-50/60 p-3 rounded-xl">
                          <div>
                            <span className="font-bold text-slate-900">Entrega: </span>
                            {order.deliveryType === 'shipping' ? (
                              <span>Envio para: {order.shippingAddress?.street}, {order.shippingAddress?.number} - {order.shippingAddress?.city}/{order.shippingAddress?.state}</span>
                            ) : (
                              <span>Retirada pessoal no balcão da loja do Valdir</span>
                            )}
                          </div>

                          {order.trackingCode && (
                            <div className="flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                              <Truck className="h-3.5 w-3.5" />
                              <span>Rastreio: {order.trackingCode}</span>
                            </div>
                          )}

                          <a
                            href={`https://wa.me/5511999999999?text=${encodeURIComponent(`Olá Valdir! Gostaria de falar sobre o meu pedido *${order.orderNumber}* no valor de R$ ${order.totalAmount.toFixed(2)}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold ml-auto cursor-pointer"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>Falar no WhatsApp sobre este pedido</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LISTA DE DESEJOS (WISHLIST) */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              {wishlistItems.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <Heart className="h-7 w-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Sua Lista de Desejos está vazia</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Clique no ícone de coração nos discos da vitrine para salvá-los e acompanhar o estoque ou comprar depois.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {wishlistItems.map((item) => {
                    const price = item.pricing.directPrice || item.pricing.basePriceBrl;
                    const isAvailable = item.status !== 'sold';

                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          <div 
                            className="aspect-square bg-slate-900 rounded-xl overflow-hidden relative group cursor-pointer"
                            onClick={() => onOpenProductModal?.(item)}
                          >
                            {item.release.coverImage ? (
                              <img src={item.release.coverImage} alt={item.release.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <Disc className="w-full h-full p-8 text-slate-600" />
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(item.id);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors"
                              title="Remover dos Favoritos"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div>
                            <h5 className="text-xs font-bold text-slate-900 truncate">{item.release.title}</h5>
                            <p className="text-[11px] text-slate-500 truncate">{item.release.artist}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs font-black text-slate-900 font-mono">
                                R$ {price.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {item.condition.mediaCondition}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 mt-2 border-t border-slate-100">
                          {isAvailable ? (
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(item);
                              }}
                              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                              <span>Mover pro Carrinho</span>
                            </button>
                          ) : (
                            <span className="block text-center text-xs font-bold text-slate-400 py-1.5 bg-slate-100 rounded-xl">
                              Item Esgotado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DADOS & ENDEREÇO */}
          {activeTab === 'address' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CPF (Opcional p/ Envio)</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    Endereço de Entrega Padrão (Agiliza Checkout)
                  </h4>
                  <span className="text-[10px] text-slate-400">Preenchimento automático por CEP</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">CEP</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="00000-000"
                        maxLength={9}
                        value={cep}
                        onChange={(e) => {
                          setCep(e.target.value);
                          handleCepLookup(e.target.value);
                        }}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                      />
                      {isSearchingCep && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-700">
                          Buscando...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Rua / Logradouro</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Número</label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Complemento / Apto</label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Estado (UF)</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Salvar Dados e Endereço</span>
              </button>
            </form>
          )}

          {/* TAB 4: SEGURANÇA & SENHA */}
          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} className="space-y-4 max-w-md mx-auto py-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Alterar Minha Senha de Acesso</h4>
                <p className="text-xs text-slate-500">Defina uma nova senha para entrar na sua conta da loja.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nova Senha * (mínimo 5 caracteres)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Nova Senha *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Lock className="h-4 w-4 text-amber-400" />
                <span>Atualizar Minha Senha</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

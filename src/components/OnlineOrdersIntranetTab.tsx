import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Store, 
  QrCode, 
  MessageCircle, 
  User, 
  Printer, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  Disc
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { CustomerOnlineOrder } from '../types';

interface OnlineOrdersIntranetTabProps {
  onPrintThermal?: (order: CustomerOnlineOrder) => void;
}

export function OnlineOrdersIntranetTab({ onPrintThermal }: OnlineOrdersIntranetTabProps) {
  const { allOnlineOrders, updateOrderStatus } = useCustomerAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aguardando_pagamento' | 'em_separacao' | 'pronto_retirada' | 'enviado' | 'entregue' | 'cancelado'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const filteredOrders = allOnlineOrders.filter(order => {
    const matchesSearch = 
      (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerPhone || '').includes(searchTerm) ||
      (order.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.fulfillmentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getFulfillmentBadge = (status: string) => {
    switch (status) {
      case 'aguardando_pagamento':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1"><Clock className="h-3 w-3" /> Aguardando PIX</span>;
      case 'em_separacao':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1"><Package className="h-3 w-3" /> Em Separação</span>;
      case 'pronto_retirada':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1"><Store className="h-3 w-3" /> Pronto no Balcão</span>;
      case 'enviado':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1"><Truck className="h-3 w-3" /> Enviado Correios</span>;
      case 'entregue':
        return <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Check className="h-3 w-3" /> Finalizado / Entregue</span>;
      case 'cancelado':
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold">Cancelado</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">{status}</span>;
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: CustomerOnlineOrder['fulfillmentStatus']) => {
    const isPaid = newStatus === 'em_separacao' || newStatus === 'pronto_retirada' || newStatus === 'enviado' || newStatus === 'entregue';
    await updateOrderStatus(orderId, {
      fulfillmentStatus: newStatus,
      paymentStatus: isPaid ? 'pago' : 'pendente'
    });
  };

  const handlePrintCorreiosDeclaration = async (order: CustomerOnlineOrder) => {
    try {
      const res = await fetch('/api/shipping/correios/declaracao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatario: {
            nome: order.customerName,
            endereco: order.shippingAddress ? `${order.shippingAddress.street}` : '',
            cidade: order.shippingAddress?.city || '',
            uf: order.shippingAddress?.state || '',
            cep: order.shippingAddress?.cep || '',
            telefone: order.customerPhone || ''
          },
          itens: order.items.map(it => ({
            title: it.title,
            artist: it.artist,
            quantity: 1,
            price: it.price
          })),
          orderNumber: order.orderNumber,
          observacoes: order.notes || ''
        })
      });
      if (res.ok) {
        const html = await res.text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
        }
      }
    } catch (err) {
      console.error('Erro ao abrir declaração Correios:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900">Pedidos da Loja Online</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie os pedidos feitos pelos clientes no site e sincronize separação e despacho.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Total de Pedidos</span>
            <span className="text-lg font-black text-slate-900">{allOnlineOrders.length}</span>
          </div>
          <div className="px-4 py-2 bg-amber-50 rounded-2xl border border-amber-200 text-center">
            <span className="text-[10px] text-amber-800 font-bold uppercase block">Aguardando PIX</span>
            <span className="text-lg font-black text-amber-900">
              {allOnlineOrders.filter(o => o.fulfillmentStatus === 'aguardando_pagamento').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por #pedido, cliente, whatsapp, e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-hidden"
        >
          <option value="all">Todos os Status</option>
          <option value="aguardando_pagamento">Aguardando PIX</option>
          <option value="em_separacao">Em Separação</option>
          <option value="pronto_retirada">Pronto para Retirada</option>
          <option value="enviado">Enviado Correios</option>
          <option value="entregue">Entregue / Concluído</option>
        </select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Package className="h-7 w-7" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">Nenhum pedido online encontrado</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Quando os clientes finalizarem pedidos no site público, eles aparecerão aqui instantaneamente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const isExpanded = expandedOrderId === order.id;

            return (
              <div 
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs transition-all hover:border-slate-300"
              >
                {/* Order Summary Row */}
                <div 
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-mono font-black text-xs shrink-0">
                      <ShoppingBag className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900">{order.orderNumber}</span>
                        {getFulfillmentBadge(order.fulfillmentStatus)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-bold text-slate-800">{order.customerName}</span>
                        {order.customerPhone && (
                          <>
                            <span>•</span>
                            <span>{order.customerPhone}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{order.items.length} {order.items.length === 1 ? 'disco' : 'discos'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Valor Total</span>
                      <span className="text-base font-black text-slate-900 font-mono">
                        R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.customerPhone && (
                        <a
                          href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors"
                          title="Falar no WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/70 p-5 space-y-4"
                    >
                      {/* Customer & Delivery Data */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                          <span className="font-bold text-slate-700 uppercase text-[10px] block">Dados do Cliente</span>
                          <p><strong>Nome:</strong> {order.customerName}</p>
                          <p><strong>WhatsApp:</strong> {order.customerPhone || 'Não informado'}</p>
                          <p><strong>E-mail:</strong> {order.customerEmail}</p>
                          {order.notes && <p className="text-amber-800"><strong>Observação:</strong> {order.notes}</p>}
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                          <span className="font-bold text-slate-700 uppercase text-[10px] block">Modalidade de Envio</span>
                          <p><strong>Tipo:</strong> {order.deliveryType === 'shipping' ? '🚚 Envio Correios' : '📍 Retirada no Balcão'}</p>
                          {order.shippingAddress && (
                            <p><strong>Endereço:</strong> {order.shippingAddress.street}, {order.shippingAddress.city}/{order.shippingAddress.state} - CEP {order.shippingAddress.cep}</p>
                          )}
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                                {item.coverImage ? (
                                  <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                  <Disc className="w-full h-full p-2 text-slate-600" />
                                )}
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-900">{item.title}</h5>
                                <span className="text-slate-500">{item.artist}</span>
                                {item.drawer && (
                                  <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                    Gaveta: {item.drawer}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="font-mono font-black text-slate-900">
                              R$ {item.price.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-600">Atualizar Status:</span>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order.id, 'em_separacao')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Confirmar PIX / Em Separação
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order.id, 'pronto_retirada')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Pronto no Balcão
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order.id, 'enviado')}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Enviado Correios
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order.id, 'entregue')}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Concluir / Entregue
                          </button>
                        </div>

                        {order.deliveryType === 'shipping' && (
                          <button
                            type="button"
                            onClick={() => handlePrintCorreiosDeclaration(order)}
                            className="px-3 py-1.5 bg-[#003882] hover:bg-[#002860] text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                            title="Imprimir Declaração de Conteúdo Oficial dos Correios"
                          >
                            <Printer className="h-3.5 w-3.5 text-[#FED100]" />
                            <span>Declaração Correios</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

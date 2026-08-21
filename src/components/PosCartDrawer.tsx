/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  DollarSign, 
  Check, 
  User, 
  CreditCard, 
  QrCode, 
  Printer, 
  FileText, 
  X, 
  Tag, 
  ArrowRight, 
  Percent, 
  AlertCircle,
  CheckCircle2,
  Receipt,
  Scan,
  Upload,
  Image as ImageIcon,
  Eye,
  ExternalLink
} from 'lucide-react';
import { CartItem, Customer, PhysicalSaleOrder, SavedListing, SalesChannel } from '../types';
import { exportSaleReceiptToPdf } from '../utils/pdfExport';
import { getSalesChannelMeta } from '../utils/qrcode';

interface PosCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  customers: Customer[];
  onRemoveItem: (itemId: string) => void;
  onUpdateDiscount: (itemId: string, discount: number) => void;
  onClearCart: () => void;
  onCompleteSale: (order: PhysicalSaleOrder) => Promise<void>;
  onOpenScanner: () => void;
}

export const PosCartDrawer: React.FC<PosCartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems = [],
  customers = [],
  onRemoveItem,
  onUpdateDiscount,
  onClearCart,
  onCompleteSale,
  onOpenScanner
}) => {
  // Checkout form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Dinheiro' | 'Cartao_Debito' | 'Cartao_Credito' | 'Parcelado' | 'Shopee' | 'MercadoLivre' | 'Outro'>('PIX');
  const [saleChannel, setSaleChannel] = useState<SalesChannel>('physical_store');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [generalDiscount, setGeneralDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [marketplaceOrderId, setMarketplaceOrderId] = useState<string>('');
  const [proofScreenshots, setProofScreenshots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<PhysicalSaleOrder | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Auto switch payment method when marketplace channel is selected
  const handleChannelChange = (ch: SalesChannel) => {
    setSaleChannel(ch);
    if (ch === 'shopee') {
      setPaymentMethod('Shopee');
    } else if (ch === 'mercadolivre') {
      setPaymentMethod('MercadoLivre');
    }
  };

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.originalPrice, 0);
  const itemDiscountsTotal = cartItems.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalDiscount = itemDiscountsTotal + Number(generalDiscount || 0);
  const totalAmount = Math.max(0, subtotal - totalDiscount);

  const cashAmountNum = parseFloat(cashReceived) || 0;
  const changeAmount = paymentMethod === 'Dinheiro' && cashAmountNum > totalAmount ? cashAmountNum - totalAmount : 0;

  // Selected customer meta
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Handle uploading screenshot / print of the sale
  const handleAddScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProofScreenshots(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Paste screenshot support
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setProofScreenshots(prev => [...prev, event.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleFinalizeSale = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const now = new Date();
      const orderId = `ord_${Date.now()}`;
      const orderNumber = `VD-PED-${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      const order: PhysicalSaleOrder = {
        id: orderId,
        orderNumber,
        items: cartItems.map(item => ({
          listingId: item.listingId,
          barcode: item.barcode,
          artist: item.artist,
          title: item.title,
          originalPrice: item.originalPrice,
          discount: item.discount,
          finalPrice: item.finalPrice,
          drawer: item.drawer,
          condition: `${item.mediaCondition}/${item.sleeveCondition}`,
          coverImage: item.coverImage
        })),
        subtotal,
        totalDiscount,
        totalAmount,
        customerId: selectedCustomerId || undefined,
        customerName: selectedCustomer ? selectedCustomer.name : 'Cliente Avulso (Balcão)',
        customerPhone: selectedCustomer?.phone,
        paymentMethod,
        amountPaid: paymentMethod === 'Dinheiro' ? cashAmountNum : totalAmount,
        changeAmount: changeAmount > 0 ? changeAmount : undefined,
        notes: notes.trim() || undefined,
        channel: saleChannel,
        marketplaceOrderId: marketplaceOrderId.trim() || undefined,
        proofScreenshots: proofScreenshots.length > 0 ? proofScreenshots : undefined,
        soldAt: now.toISOString()
      };

      await onCompleteSale(order);
      setCompletedOrder(order);
    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = (format: 'thermal-80mm' | 'a4') => {
    if (!completedOrder) return;
    exportSaleReceiptToPdf(completedOrder, {
      format,
      filename: `recibo-valdir-${completedOrder.orderNumber}.pdf`
    });
  };

  const handleCloseCompleted = () => {
    setCompletedOrder(null);
    setProofScreenshots([]);
    setMarketplaceOrderId('');
    setNotes('');
    setCashReceived('');
    setGeneralDiscount(0);
    onClearCart();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  Carrinho & Caixa de Vendas
                  <span className="text-xs bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                    {cartItems.length} {cartItems.length === 1 ? 'disco' : 'discos'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  PDV Balcão & Marketplaces • Bipou, guardou o print da venda, baixou estoque
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Success Overlay if Order Finished */}
          {completedOrder ? (
            <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900">Venda Realizada com Sucesso!</h4>
                <p className="text-sm font-semibold text-slate-600">
                  Pedido <strong>{completedOrder.orderNumber}</strong> registrado e estoque atualizado.
                </p>
                <p className="text-xs text-slate-500">
                  Total: <strong className="text-emerald-600 text-sm">R$ {completedOrder.totalAmount.toFixed(2)}</strong> ({completedOrder.items.length} itens) • {getSalesChannelMeta(completedOrder.channel || 'physical_store').name} • {completedOrder.paymentMethod}
                </p>
                {completedOrder.marketplaceOrderId && (
                  <p className="text-xs text-indigo-700 font-mono font-bold bg-indigo-50 px-3 py-1 rounded-full inline-block mt-1">
                    Cód. Marketplace: {completedOrder.marketplaceOrderId}
                  </p>
                )}
              </div>

              {/* Saved Screenshots Display */}
              {completedOrder.proofScreenshots && completedOrder.proofScreenshots.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-md space-y-2 text-left">
                  <span className="text-xs font-black uppercase text-slate-600 flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-indigo-600" />
                    Prints da Venda Salvos ({completedOrder.proofScreenshots.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {completedOrder.proofScreenshots.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => setPreviewImageModal(img)}
                        className="w-20 h-20 rounded-xl overflow-hidden border border-slate-300 relative cursor-pointer hover:opacity-90 group"
                      >
                        <img src={img} alt={`Comprovante ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                          <Eye className="h-4 w-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Receipt Options */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-md space-y-3 text-left">
                <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-indigo-600" />
                  Comprovante / Cupom da Venda:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownloadReceipt('thermal-80mm')}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Printer className="h-4 w-4 text-emerald-400" />
                    Cupom Térmico (80mm)
                  </button>
                  <button
                    onClick={() => handleDownloadReceipt('a4')}
                    className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <FileText className="h-4 w-4 text-white" />
                    Recibo A4 em PDF
                  </button>
                </div>
              </div>

              <div className="flex gap-3 w-full max-w-md">
                <button
                  onClick={handleCloseCompleted}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
                >
                  Concluir & Novo Atendimento
                </button>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-800">Seu carrinho está vazio</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Escaneie as etiquetas térmicas com a câmera do celular ou leitor USB para adicionar discos automaticamente ao carrinho.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenScanner();
                }}
                className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Scan className="h-4 w-4" />
                <span>Abrir Câmera / Escanear Discos</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Discos Selecionados ({cartItems.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenScanner();
                      }}
                      className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Escanear Mais Discos
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={onClearCart}
                      className="text-xs text-rose-500 font-bold hover:text-rose-700 cursor-pointer"
                    >
                      Esvaziar
                    </button>
                  </div>
                </div>

                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 flex items-start gap-3 transition-all"
                  >
                    {/* Disc Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-300">
                      <img
                        src={item.coverImage || item.listing.release.coverImage || 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=150'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Disc Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-black bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                          {item.barcode}
                        </span>
                        {item.drawer && (
                          <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                            📍 {item.drawer}
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                          {item.mediaCondition}/{item.sleeveCondition}
                        </span>
                      </div>

                      <h5 className="text-sm font-bold text-slate-900 truncate mt-1">{item.artist}</h5>
                      <p className="text-xs text-slate-600 truncate">{item.title}</p>

                      {/* Price & Discount input */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-900">
                            R$ {item.finalPrice.toFixed(2)}
                          </span>
                          {item.discount > 0 && (
                            <span className="text-[10px] text-slate-400 line-through">
                              R$ {item.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                            <Tag className="h-3 w-3" /> Desc:
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.discount || ''}
                            placeholder="0,00"
                            onChange={(e) => onUpdateDiscount(item.id, parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-0.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none text-right"
                          />
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            title="Remover disco do carrinho"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form Bottom Section */}
              <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-4 max-h-[50vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Customer Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <User className="h-3 w-3 text-indigo-600" />
                      Cliente (Opcional):
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="">Cliente Avulso de Balcão</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sales Channel */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Canal de Venda:
                    </label>
                    <select
                      value={saleChannel}
                      onChange={(e) => handleChannelChange(e.target.value as SalesChannel)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="physical_store">Loja Física (Balcão)</option>
                      <option value="online_store">Loja Online Própria</option>
                      <option value="shopee">Shopee</option>
                      <option value="mercadolivre">Mercado Livre</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Payment Method */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <CreditCard className="h-3 w-3 text-emerald-600" />
                      Forma de Pagamento:
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="PIX">PIX (Instantâneo)</option>
                      <option value="Dinheiro">Dinheiro (Espécie)</option>
                      <option value="Cartao_Debito">Cartão de Débito</option>
                      <option value="Cartao_Credito">Cartão de Crédito (À Vista)</option>
                      <option value="Parcelado">Cartão de Crédito (Parcelado)</option>
                      <option value="Shopee">Saldo Shopee</option>
                      <option value="MercadoLivre">Saldo Mercado Livre</option>
                      <option value="Outro">Outro / Negociado</option>
                    </select>
                  </div>

                  {/* Extra General Discount */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <Percent className="h-3 w-3 text-amber-600" />
                      Desconto Extra Geral (R$):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0,00"
                      value={generalDiscount || ''}
                      onChange={(e) => setGeneralDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Marketplace Order Code and Screenshot Proof Uploader */}
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/70 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
                      Guardar Prints & Comprovantes do Marketplace
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold">
                      Shopee / ML / Pix (Ctrl+V suportado)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">
                        Código do Pedido no Marketplace:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 240820ABCD123, #1004..."
                        value={marketplaceOrderId}
                        onChange={(e) => setMarketplaceOrderId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">
                        Anexar Print da Venda / Comprovante:
                      </label>
                      <label className="w-full px-3 py-2 bg-white hover:bg-indigo-50 border border-dashed border-indigo-300 rounded-xl text-xs text-indigo-700 font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
                        <Upload className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Carregar Print / Imagem</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAddScreenshot}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Screenshots gallery */}
                  {proofScreenshots.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {proofScreenshots.map((img, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-indigo-200 group">
                          <img src={img} alt={`Comprovante ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setProofScreenshots(proofScreenshots.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-90 hover:opacity-100 cursor-pointer shadow-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cash Change Calculation if Dinheiro */}
                {paymentMethod === 'Dinheiro' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="text-[10px] font-black uppercase text-emerald-800">
                        Valor Recebido em Dinheiro (R$):
                      </label>
                      <input
                        type="number"
                        step="1"
                        placeholder="Ex: 100,00"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-sm font-mono font-bold text-emerald-950 outline-none"
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase text-emerald-700 block">Troco a Devolver:</span>
                      <span className="text-lg font-mono font-black text-emerald-900">
                        R$ {changeAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Totals Summary */}
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal ({cartItems.length} itens):</span>
                    <span className="font-mono font-bold text-slate-800">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-xs text-rose-600 font-bold">
                      <span>Desconto Total:</span>
                      <span className="font-mono">- R$ {totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-base pt-1">
                    <span className="font-black text-slate-900">Total a Pagar:</span>
                    <span className="text-2xl font-mono font-black text-emerald-600">
                      R$ {totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Finalize Action Button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalizeSale}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-emerald-950/20 transition-all"
                >
                  <Check className="h-5 w-5" />
                  <span>
                    {isSubmitting ? 'Registrando Venda...' : `Finalizar Venda • R$ ${totalAmount.toFixed(2)}`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Modal for image zoom */}
        {previewImageModal && (
          <div
            onClick={() => setPreviewImageModal(null)}
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 cursor-pointer"
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
              <img src={previewImageModal} alt="Comprovante Ampliado" className="w-full h-full object-contain max-h-[85vh]" />
              <button
                onClick={() => setPreviewImageModal(null)}
                className="absolute top-3 right-3 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

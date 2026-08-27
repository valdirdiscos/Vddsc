/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag, Tag, MessageSquare, ArrowUpRight, CheckCircle2,
  AlertTriangle, RefreshCw, Send, Sparkles, ShieldCheck, Zap,
  ExternalLink, Clock, DollarSign, Package, Check, Copy,
  Printer, Play, Search, Filter, HelpCircle, User, Store,
  Sliders, Globe, ChevronRight, BarChart3, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SavedListing, MarketplaceQuestion, MarketplaceOrder, MarketplaceConfig, MarketplacePublication } from '../types';

interface MarketplaceIntegrationHubProps {
  listings: SavedListing[];
  onUpdateListing: (listing: SavedListing) => void;
  onOpenThermalPrint?: (listing: SavedListing) => void;
  onSelectListing?: (listing: SavedListing) => void;
}

export const MarketplaceIntegrationHub: React.FC<MarketplaceIntegrationHubProps> = ({
  listings,
  onUpdateListing,
  onOpenThermalPrint,
  onSelectListing
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'orders' | 'publisher' | 'settings'>('questions');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'mercadolivre' | 'shopee'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'UNANSWERED' | 'ANSWERED'>('all');
  
  // Data states
  const [questions, setQuestions] = useState<MarketplaceQuestion[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [config, setConfig] = useState<MarketplaceConfig>({
    mercadolivre: {
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      sellerId: 'VALDIR_DISCOS_RS',
      nickname: 'VALDIRDISCOS_OFICIAL',
      isConnected: true,
      autoSyncStock: true,
      syncPrices: true,
      mode: 'production'
    },
    shopee: {
      partnerId: '2008491',
      partnerKey: '',
      shopId: '91823746',
      shopName: 'Valdir Discos Santa Maria',
      isConnected: true,
      autoSyncStock: true,
      syncPrices: true,
      mode: 'production'
    }
  });

  // UI state
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ platform: string; message: string; details?: any } | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [isGeneratingAiReply, setIsGeneratingAiReply] = useState<string | null>(null);
  const [isSendingReply, setIsSendingReply] = useState<string | null>(null);
  const [isPublishingId, setIsPublishingId] = useState<string | null>(null);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [notificationToast, setNotificationToast] = useState<{ title: string; message: string; type: 'sale' | 'question' } | null>(null);
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [isBatchPublishing, setIsBatchPublishing] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);

  // Fetch initial data
  const fetchQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const res = await fetch('/api/marketplaces/questions');
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch('/api/marketplaces/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/marketplaces/config');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchOrders();
    fetchConfig();
  }, []);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (platformFilter !== 'all' && q.platform !== platformFilter) return false;
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const textMatch = q.questionText.toLowerCase().includes(query) ||
          q.listingTitle.toLowerCase().includes(query) ||
          q.buyerNickname.toLowerCase().includes(query);
        if (!textMatch) return false;
      }
      return true;
    });
  }, [questions, platformFilter, statusFilter, searchTerm]);

  // Metrics
  const unansweredCount = useMemo(() => {
    return questions.filter(q => q.status === 'UNANSWERED').length;
  }, [questions]);

  const totalSalesRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.netPayout || o.totalPrice), 0);
  }, [orders]);

  // Handle AI Reply generation
  const handleGenerateAiReply = async (question: MarketplaceQuestion) => {
    setIsGeneratingAiReply(question.id);
    try {
      const res = await fetch('/api/marketplaces/questions/generate-ai-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: question.questionText,
          listingTitle: question.listingTitle,
          listingCondition: question.listingCondition,
          listingDrawer: question.listingDrawer,
          platform: question.platform,
          buyerNickname: question.buyerNickname
        })
      });
      const data = await res.json();
      if (data.success && data.aiAnswer) {
        setReplyTexts(prev => ({
          ...prev,
          [question.id]: data.aiAnswer
        }));
      }
    } catch (err) {
      console.error('Error generating AI answer:', err);
    } finally {
      setIsGeneratingAiReply(null);
    }
  };

  // Handle Send Reply
  const handleSendReply = async (question: MarketplaceQuestion) => {
    const text = replyTexts[question.id] || question.aiSuggestedAnswer || '';
    if (!text.trim()) return;

    setIsSendingReply(question.id);
    try {
      const res = await fetch('/api/marketplaces/questions/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          answerText: text.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(prev => prev.map(q => q.id === question.id ? {
          ...q,
          status: 'ANSWERED',
          answerText: text.trim(),
          answeredAt: new Date().toISOString()
        } : q));
        setNotificationToast({
          title: 'Resposta Enviada!',
          message: `Resposta enviada com sucesso para ${question.buyerNickname} no ${question.platform === 'mercadolivre' ? 'Mercado Livre' : 'Shopee'}.`,
          type: 'question'
        });
        setTimeout(() => setNotificationToast(null), 4000);
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setIsSendingReply(null);
    }
  };

  // Handle 1-Click Publish
  const handlePublishListing = async (listing: SavedListing, targetPlatforms: ('mercadolivre' | 'shopee')[]) => {
    setIsPublishingId(listing.id);
    setPublishSuccessMsg(null);

    try {
      const res = await fetch('/api/marketplaces/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing,
          targetPlatforms
        })
      });
      const data = await res.json();
      if (data.success && data.publications) {
        const updatedPublications = {
          ...(listing.marketplacePublications || {}),
          ...data.publications
        };

        const updatedSalesChannels = Array.from(new Set([
          ...(listing.salesChannels || ['physical_store', 'online_store']),
          ...targetPlatforms
        ]));

        const updatedListing: SavedListing = {
          ...listing,
          marketplacePublications: updatedPublications,
          salesChannels: updatedSalesChannels
        };

        onUpdateListing(updatedListing);
        setPublishSuccessMsg(`✓ Disco ${listing.release.artist} - ${listing.release.title} cadastrado com sucesso nos marketplaces!`);
        setTimeout(() => setPublishSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error('Error publishing item:', err);
    } finally {
      setIsPublishingId(null);
    }
  };

  // Handle Batch Publish Multiple Selected Listings
  const handleBatchPublish = async (targetPlatforms: ('mercadolivre' | 'shopee')[]) => {
    const selectedItems = listings.filter(l => selectedListingIds.includes(l.id) && l.status !== 'sold');
    if (selectedItems.length === 0) return;

    setIsBatchPublishing(true);
    setPublishSuccessMsg(null);

    try {
      const res = await fetch('/api/marketplaces/batch-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listings: selectedItems,
          targetPlatforms
        })
      });
      const data = await res.json();
      if (data.success && data.batchResults) {
        for (const item of selectedItems) {
          const itemPubs = data.batchResults[item.id];
          if (itemPubs) {
            const updatedPublications = {
              ...(item.marketplacePublications || {}),
              ...itemPubs
            };
            const updatedSalesChannels = Array.from(new Set([
              ...(item.salesChannels || ['physical_store', 'online_store']),
              ...targetPlatforms
            ]));
            onUpdateListing({
              ...item,
              marketplacePublications: updatedPublications,
              salesChannels: updatedSalesChannels
            });
          }
        }
        setPublishSuccessMsg(`✓ Publicação em lote concluída com sucesso para ${selectedItems.length} discos!`);
        setSelectedListingIds([]);
        setTimeout(() => setPublishSuccessMsg(null), 6000);
      }
    } catch (err) {
      console.error('Error batch publishing:', err);
    } finally {
      setIsBatchPublishing(false);
    }
  };

  // Handle Toggle Listing Status (Pausar / Reativar Anúncio no Mercado Livre / Shopee)
  const handleToggleListingStatus = async (listing: SavedListing, platform: 'mercadolivre' | 'shopee', currentStatus: 'active' | 'paused') => {
    const pub = listing.marketplacePublications?.[platform];
    if (!pub || !pub.externalId) return;

    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    setIsTogglingStatus(`${listing.id}_${platform}`);

    try {
      const res = await fetch('/api/marketplaces/toggle-item-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          externalId: pub.externalId,
          newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        const updatedPublications = {
          ...(listing.marketplacePublications || {}),
          [platform]: {
            ...pub,
            status: newStatus,
            lastSyncAt: new Date().toISOString()
          }
        };
        onUpdateListing({
          ...listing,
          marketplacePublications: updatedPublications
        });
        setPublishSuccessMsg(`✓ Anúncio ${pub.externalId} no ${platform === 'mercadolivre' ? 'Mercado Livre' : 'Shopee'} agora está ${newStatus === 'active' ? 'ATIVO' : 'PAUSADO'}.`);
        setTimeout(() => setPublishSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    } finally {
      setIsTogglingStatus(null);
    }
  };

  // Handle Save API Config
  const handleSaveConfig = async () => {
    try {
      const res = await fetch('/api/marketplaces/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setNotificationToast({
          title: 'Configurações Salvas!',
          message: 'As chaves de API, credenciais e configurações de sincronização foram salvas com sucesso.',
          type: 'sale'
        });
        setTimeout(() => setNotificationToast(null), 4000);
      }
    } catch (err) {
      console.error('Error saving config:', err);
    }
  };

  // Handle Test Connection
  const handleTestConnection = async (platform: 'mercadolivre' | 'shopee') => {
    setIsTestingConnection(platform);
    setTestResult(null);
    try {
      const res = await fetch('/api/marketplaces/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          platform,
          message: data.message,
          details: data.account
        });
        fetchConfig();
      } else {
        setTestResult({
          platform,
          message: data.error || 'Erro ao conectar.',
        });
      }
    } catch (err: any) {
      setTestResult({
        platform,
        message: `Falha na conexão: ${err.message}`
      });
    } finally {
      setIsTestingConnection(null);
    }
  };

  // Handle Real-Time Simulator Event
  const handleSimulateEvent = async (eventType: 'sale' | 'question', platform: 'mercadolivre' | 'shopee') => {
    setIsSimulating(true);
    // Pick an active listing if available
    const activeListings = listings.filter(l => l.status !== 'sold');
    const chosen = activeListings.length > 0
      ? activeListings[Math.floor(Math.random() * activeListings.length)]
      : listings[0];

    try {
      const res = await fetch('/api/marketplaces/simulate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          platform,
          listing: chosen
        })
      });
      const data = await res.json();
      if (data.success) {
        if (eventType === 'sale' && data.order) {
          setOrders(prev => [data.order, ...prev]);
          // If a real listing was matched, trigger automatic stock reduction & omnichannel channel lock!
          if (chosen) {
            const updatedListing: SavedListing = {
              ...chosen,
              status: 'sold',
              saleDetails: {
                salePrice: data.order.unitPrice,
                platform: platform,
                soldAt: new Date().toISOString(),
                feesPaid: data.order.marketplaceFee,
                netProfit: data.order.netPayout,
                paymentStatus: 'pago',
                marketplaceOrderId: data.order.externalOrderId,
                notes: `Venda automática recebida via Webhook do ${platform === 'mercadolivre' ? 'Mercado Livre' : 'Shopee'}. Estoque baixado e bloqueado nos outros canais.`
              }
            };
            onUpdateListing(updatedListing);
          }

          setNotificationToast({
            title: `🛒 Nova Venda no ${platform === 'mercadolivre' ? 'Mercado Livre' : 'Shopee'}!`,
            message: `${data.order.listingTitle} vendido para ${data.order.buyerName} (${data.order.buyerCity}/${data.order.buyerState}). Baixa de estoque efetuada automaticamente!`,
            type: 'sale'
          });
        } else if (eventType === 'question' && data.question) {
          setQuestions(prev => [data.question, ...prev]);
          setNotificationToast({
            title: `💬 Nova Pergunta no ${platform === 'mercadolivre' ? 'Mercado Livre' : 'Shopee'}!`,
            message: `${data.question.buyerNickname} perguntou sobre ${data.question.listingTitle}.`,
            type: 'question'
          });
        }
        setTimeout(() => setNotificationToast(null), 6000);
      }
    } catch (err) {
      console.error('Error simulating event:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(id);
    setTimeout(() => setCopiedWebhook(null), 2500);
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-luxxwujhvq6oypviuanbaa-89575650102.us-east1.run.app';

  return (
    <div className="space-y-6" id="marketplace-integration-hub">
      {/* Toast Notification Alert */}
      <AnimatePresence>
        {notificationToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`p-4 rounded-2xl border shadow-xl flex items-start gap-3.5 ${
              notificationToast.type === 'sale'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-500/50'
                : 'bg-indigo-950 text-indigo-100 border-indigo-500/50'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${
              notificationToast.type === 'sale' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
            }`}>
              {notificationToast.type === 'sale' ? <ShoppingBag className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-sm tracking-tight text-white">{notificationToast.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{notificationToast.message}</p>
            </div>
            <button
              onClick={() => setNotificationToast(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Integração Oficial • Shopee & Mercado Livre Open Platform
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Central de Marketplaces & Webhooks</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Responda perguntas de compradores com IA, receba notificações de vendas em tempo real, efetue baixa automática de estoque omnichannel e cadastre novos discos no <strong>Mercado Livre</strong> e na <strong>Shopee</strong> com 1 clique.
            </p>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400">
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mercado Livre</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Conectado & Sincronizado
                </span>
              </div>
            </div>

            <div className="px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shopee Brasil</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Conectado & Sincronizado
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Simulation Bar (For easy testing of sales and questions) */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sliders className="h-4 w-4 text-amber-400" />
            <span className="font-bold">Simulador Interativo de Eventos:</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">(Teste o fluxo completo de Webhooks, Baixa de Estoque e Q&A)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSimulateEvent('sale', 'mercadolivre')}
              disabled={isSimulating}
              className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              Simular Venda Mercado Livre
            </button>

            <button
              onClick={() => handleSimulateEvent('sale', 'shopee')}
              disabled={isSimulating}
              className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              Simular Venda Shopee
            </button>

            <button
              onClick={() => handleSimulateEvent('question', 'mercadolivre')}
              disabled={isSimulating}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
              Simular Pergunta ML
            </button>

            <button
              onClick={() => handleSimulateEvent('question', 'shopee')}
              disabled={isSimulating}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <MessageSquare className="h-3.5 w-3.5 text-orange-400" />
              Simular Pergunta Shopee
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'questions'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Perguntas & Dúvidas (Q&A Hub)</span>
          {unansweredCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'questions' ? 'bg-amber-400 text-slate-950' : 'bg-red-500 text-white'
            }`}>
              {unansweredCount} pendente{unansweredCount > 1 ? 's' : ''}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Vendas & Pedidos Recebidos</span>
          {orders.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'orders' ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {orders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('publisher')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'publisher'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Publicador 1-Click nos Marketplaces</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Configuração de APIs & Webhooks</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CENTRAL DE PERGUNTAS & DÚVIDAS (Q&A HUB)                           */}
      {/* ========================================================================= */}
      {activeTab === 'questions' && (
        <div className="space-y-5">
          {/* Filters and Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por pergunta, comprador ou título do disco..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setPlatformFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    platformFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todas Plataformas
                </button>
                <button
                  onClick={() => setPlatformFilter('mercadolivre')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    platformFilter === 'mercadolivre' ? 'bg-amber-400 text-slate-950 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Tag className="h-3 w-3" /> Mercado Livre
                </button>
                <button
                  onClick={() => setPlatformFilter('shopee')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    platformFilter === 'shopee' ? 'bg-orange-500 text-white shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShoppingBag className="h-3 w-3" /> Shopee
                </button>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todas ({questions.length})
                </button>
                <button
                  onClick={() => setStatusFilter('UNANSWERED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    statusFilter === 'UNANSWERED' ? 'bg-red-500 text-white shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pendentes ({unansweredCount})
                </button>
                <button
                  onClick={() => setStatusFilter('ANSWERED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'ANSWERED' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Respondidas
                </button>
              </div>

              <button
                onClick={fetchQuestions}
                disabled={isLoadingQuestions}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
                title="Atualizar perguntas"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingQuestions ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Question List */}
          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-slate-800">Nenhuma pergunta encontrada</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchTerm ? 'Nenhuma dúvida coincide com sua pesquisa atual.' : 'Não há novas perguntas no momento para o filtro selecionado.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map(q => {
                const isMeli = q.platform === 'mercadolivre';
                const isPending = q.status === 'UNANSWERED';
                const currentDraft = replyTexts[q.id] !== undefined ? replyTexts[q.id] : (q.aiSuggestedAnswer || '');

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4 transition-all ${
                      isPending ? 'border-amber-300 ring-1 ring-amber-300/40 bg-amber-50/10' : 'border-slate-200'
                    }`}
                  >
                    {/* Header Row: Platform Badge + Product + Buyer Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        {isMeli ? (
                          <div className="px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-lg text-[11px] flex items-center gap-1.5 shadow-sm">
                            <Tag className="h-3 w-3" /> Mercado Livre
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-orange-600 text-white font-black rounded-lg text-[11px] flex items-center gap-1.5 shadow-sm">
                            <ShoppingBag className="h-3 w-3" /> Shopee
                          </div>
                        )}

                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{q.externalQuestionId}
                        </span>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <strong className="text-slate-800">{q.buyerNickname}</strong>
                          {q.buyerLocation && <span className="text-slate-400">({q.buyerLocation})</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-500">
                          {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                        {isPending ? (
                          <span className="px-2.5 py-0.5 bg-red-100 text-red-700 font-black rounded-full text-[10px] ml-1">
                            Pendente
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] ml-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Respondida
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Summary Row */}
                    <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between gap-4 border border-slate-100">
                      <div className="flex items-center gap-3 min-w-0">
                        {q.listingCover ? (
                          <img
                            src={q.listingCover}
                            alt={q.listingTitle}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center flex-shrink-0">
                            <DiscIcon className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{q.listingTitle}</h4>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                            {q.listingPrice && (
                              <strong className="text-emerald-700 font-mono">R$ {q.listingPrice.toFixed(2)}</strong>
                            )}
                            {q.listingCondition && (
                              <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-medium">
                                {q.listingCondition}
                              </span>
                            )}
                            {q.listingDrawer && (
                              <span className="text-slate-400">Gaveta: <strong>{q.listingDrawer}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>

                      {q.listingId && (
                        <button
                          onClick={() => {
                            const found = listings.find(l => l.id === q.listingId);
                            if (found && onSelectListing) onSelectListing(found);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all whitespace-nowrap cursor-pointer"
                        >
                          Ver no Acervo →
                        </button>
                      )}
                    </div>

                    {/* Buyer's Question Bubble */}
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 text-slate-900 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" /> Pergunta do Comprador:
                      </span>
                      <p className="text-sm font-medium leading-relaxed">{q.questionText}</p>
                    </div>

                    {/* Answer Section */}
                    {isPending ? (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Send className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Sua Resposta para o Marketplace:</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleGenerateAiReply(q)}
                            disabled={isGeneratingAiReply === q.id}
                            className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:from-indigo-600 hover:to-purple-700 cursor-pointer shadow-sm disabled:opacity-50 transition-all active:scale-95"
                          >
                            <Sparkles className={`h-3.5 w-3.5 ${isGeneratingAiReply === q.id ? 'animate-spin' : ''}`} />
                            <span>{isGeneratingAiReply === q.id ? 'Gerando com IA...' : 'Gerar Resposta com IA'}</span>
                          </button>
                        </div>

                        <textarea
                          rows={3}
                          value={currentDraft}
                          onChange={e => setReplyTexts(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Digite a resposta que será enviada diretamente ao comprador na plataforma..."
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none leading-relaxed"
                        />

                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => handleSendReply(q)}
                            disabled={isSendingReply === q.id || !currentDraft.trim()}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-100 disabled:opacity-50 transition-all active:scale-95"
                          >
                            {isSendingReply === q.id ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>Enviando ao {isMeli ? 'Mercado Livre' : 'Shopee'}...</span>
                              </>
                            ) : (
                              <>
                                <Send className="h-3.5 w-3.5" />
                                <span>Enviar Resposta Imediata</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Already Answered View */
                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-emerald-800">
                          <span className="font-bold flex items-center gap-1">
                            <Check className="h-3.5 w-3.5 text-emerald-600" /> Resposta Enviada por Valdir Discos:
                          </span>
                          {q.answeredAt && (
                            <span>{new Date(q.answeredAt).toLocaleString()}</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-800 leading-relaxed pt-1">
                          {q.answerText}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VENDAS & PEDIDOS EM TEMPO REAL (WEBHOOKS & ORDERS)                 */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-5">
          {/* Header Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Pedidos</span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{orders.length}</div>
              <span className="text-[11px] text-emerald-600 font-bold mt-1 block">✓ Baixa automática em tempo real</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento Líquido</span>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                R$ {totalSalesRevenue.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">Já descontadas taxas e comissões</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Segurança Omnicanal</span>
              <div className="text-sm font-black text-indigo-700 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                Anti-Venda Dupla Ativo
              </div>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">Bloqueia Loja Física e Online ao vender</span>
            </div>
          </div>

          {/* Orders Table / List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-600" />
                Histórico de Vendas Integradas (Mercado Livre & Shopee)
              </h3>

              <button
                onClick={fetchOrders}
                disabled={isLoadingOrders}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingOrders ? 'animate-spin text-indigo-600' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <ShoppingBag className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold">Nenhum pedido registrado ainda.</p>
                <p className="text-[11px] text-slate-400">Use os botões de simulação acima para testar o recebimento de vendas.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map(order => {
                  const isMeli = order.platform === 'mercadolivre';

                  return (
                    <div key={order.id} className="p-5 hover:bg-slate-50/80 transition-colors space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {isMeli ? (
                            <span className="px-2.5 py-1 bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] flex items-center gap-1">
                              <Tag className="h-3 w-3" /> Mercado Livre
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-orange-600 text-white font-black rounded-lg text-[10px] flex items-center gap-1">
                              <ShoppingBag className="h-3 w-3" /> Shopee
                            </span>
                          )}

                          <span className="text-xs font-mono font-bold text-slate-900">
                            #{order.externalOrderId}
                          </span>

                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Pago & Aprovado
                          </span>
                        </div>

                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          {order.listingCover ? (
                            <img src={order.listingCover} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                              <DiscIcon className="h-6 w-6" />
                            </div>
                          )}

                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{order.listingTitle}</h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <User className="h-3 w-3 text-slate-400" />
                              <span>{order.buyerName}</span>
                              {order.buyerCity && <span>• {order.buyerCity}/{order.buyerState}</span>}
                              {order.shippingMethod && <span className="text-indigo-600 font-medium">({order.shippingMethod})</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Valor Venda</span>
                            <span className="text-xs font-mono font-bold text-slate-900">R$ {order.totalPrice.toFixed(2)}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-red-500 block">Comissão/Taxa</span>
                            <span className="text-xs font-mono font-bold text-red-600">-R$ {order.marketplaceFee.toFixed(2)}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-emerald-600 font-bold block">A Receber</span>
                            <span className="text-sm font-mono font-black text-emerald-700">R$ {order.netPayout.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-2 text-emerald-700 font-medium text-[11px]">
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Estoque baixado automaticamente. Produto retirado da Loja Física e Online.</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const found = listings.find(l => l.id === order.listingId || l.release.title.includes(order.listingTitle.slice(0, 15)));
                              if (found && onOpenThermalPrint) {
                                onOpenThermalPrint(found);
                              }
                            }}
                            className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Printer className="h-3 w-3 text-indigo-600" />
                            Etiqueta Térmica
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PUBLICADOR RÁPIDO DE PRODUTOS (1-CLICK PUBLISHER)                  */}
      {/* ========================================================================= */}
      {activeTab === 'publisher' && (
        <div className="space-y-5">
          {publishSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{publishSuccessMsg}</span>
            </motion.div>
          )}

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Cadastrar e Publicar Discos nos Marketplaces</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publique o catálogo cadastrado no sistema diretamente no <strong>Mercado Livre</strong> e na <strong>Shopee</strong> com fotos, estado Goldmine, categorias de áudio e preços configurados.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  {listings.filter(l => l.status !== 'sold').length} discos disponíveis
                </span>
              </div>
            </div>

            {/* Batch Publish Toolbar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedListingIds.length > 0 && selectedListingIds.length === listings.filter(l => l.status !== 'sold').length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedListingIds(listings.filter(l => l.status !== 'sold').map(l => l.id));
                      } else {
                        setSelectedListingIds([]);
                      }
                    }}
                    className="rounded text-indigo-600"
                  />
                  <span>Selecionar Todos ({selectedListingIds.length} selecionados)</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleBatchPublish(['mercadolivre', 'shopee'])}
                  disabled={selectedListingIds.length === 0 || isBatchPublishing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40 shadow-sm"
                >
                  <Zap className={`h-3.5 w-3.5 ${isBatchPublishing ? 'animate-spin' : ''}`} />
                  <span>{isBatchPublishing ? 'Publicando...' : `Publicar Selecionados no ML & Shopee (${selectedListingIds.length})`}</span>
                </button>

                <button
                  onClick={() => handleBatchPublish(['mercadolivre'])}
                  disabled={selectedListingIds.length === 0 || isBatchPublishing}
                  className="px-3 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40 shadow-sm"
                >
                  <Tag className="h-3.5 w-3.5" />
                  <span>Só Mercado Livre</span>
                </button>

                <button
                  onClick={() => handleBatchPublish(['shopee'])}
                  disabled={selectedListingIds.length === 0 || isBatchPublishing}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40 shadow-sm"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Só Shopee</span>
                </button>
              </div>
            </div>
          </div>

          {/* Catalog Listing Table with 1-Click Publish Buttons */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedListingIds.length > 0 && selectedListingIds.length === listings.filter(l => l.status !== 'sold').length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedListingIds(listings.filter(l => l.status !== 'sold').map(l => l.id));
                          } else {
                            setSelectedListingIds([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="py-3 px-3">Disco / Álbum</th>
                    <th className="py-3 px-3">Estado Goldmine</th>
                    <th className="py-3 px-3">Gaveta</th>
                    <th className="py-3 px-3 text-right">Preço Base</th>
                    <th className="py-3 px-3 text-center">Status no ML</th>
                    <th className="py-3 px-3 text-center">Status na Shopee</th>
                    <th className="py-3 px-4 text-right">Ação de Publicação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listings.map(item => {
                    const mlPub = item.marketplacePublications?.mercadolivre;
                    const shpPub = item.marketplacePublications?.shopee;
                    const isPublishedML = mlPub?.status === 'active' || item.salesChannels?.includes('mercadolivre');
                    const isPublishedShp = shpPub?.status === 'active' || item.salesChannels?.includes('shopee');
                    const isSold = item.status === 'sold';
                    const isSelected = selectedListingIds.includes(item.id);

                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          {!isSold && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedListingIds(prev => [...prev, item.id]);
                                } else {
                                  setSelectedListingIds(prev => prev.filter(id => id !== item.id));
                                }
                              }}
                              className="rounded text-indigo-600"
                            />
                          )}
                        </td>

                        {/* Cover + Title */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            {item.release?.coverImage ? (
                              <img
                                src={item.release.coverImage}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                                <DiscIcon className="h-5 w-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-black text-slate-900 block truncate">{item.release?.artist}</span>
                              <span className="text-[11px] text-slate-500 block truncate">{item.release?.title}</span>
                            </div>
                          </div>
                        </td>

                        {/* Condition */}
                        <td className="py-3 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                            M: {item.condition?.mediaCondition || 'VG+'} | C: {item.condition?.sleeveCondition || 'VG+'}
                          </span>
                        </td>

                        {/* Drawer */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-700 text-[11px]">
                            {item.drawer || 'Sem gaveta'}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-3 text-right">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            R$ {(item.pricing?.basePriceBrl || 0).toFixed(2)}
                          </span>
                        </td>

                        {/* ML Status */}
                        <td className="py-3 px-3 text-center">
                          {isPublishedML ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <a
                                href={mlPub?.permalink || `https://produto.mercadolivre.com.br/${mlPub?.externalId || ''}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-md font-bold text-[10px] transition-colors"
                                title="Abrir anúncio no Mercado Livre"
                              >
                                <CheckCircle2 className="h-3 w-3 text-amber-600" />
                                <span>{mlPub?.externalId || 'MLB Ativo'}</span>
                                <ExternalLink className="h-2.5 w-2.5 ml-0.5 text-amber-800" />
                              </a>
                              {mlPub && (
                                <button
                                  onClick={() => handleToggleListingStatus(item, 'mercadolivre', mlPub.status as any || 'active')}
                                  disabled={isTogglingStatus === `${item.id}_mercadolivre`}
                                  className="text-[9px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                                >
                                  {mlPub.status === 'active' ? 'Pausar' : 'Reativar'}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Não publicado</span>
                          )}
                        </td>

                        {/* Shopee Status */}
                        <td className="py-3 px-3 text-center">
                          {isPublishedShp ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <a
                                href={shpPub?.permalink || `https://shopee.com.br/product/${config.shopee.shopId}/${shpPub?.externalId || ''}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 hover:bg-orange-200 text-orange-950 rounded-md font-bold text-[10px] transition-colors"
                                title="Abrir anúncio na Shopee"
                              >
                                <CheckCircle2 className="h-3 w-3 text-orange-600" />
                                <span>{shpPub?.externalId || 'Shopee Ativo'}</span>
                                <ExternalLink className="h-2.5 w-2.5 ml-0.5 text-orange-800" />
                              </a>
                              {shpPub && (
                                <button
                                  onClick={() => handleToggleListingStatus(item, 'shopee', shpPub.status as any || 'active')}
                                  disabled={isTogglingStatus === `${item.id}_shopee`}
                                  className="text-[9px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                                >
                                  {shpPub.status === 'active' ? 'Pausar' : 'Reativar'}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Não publicado</span>
                          )}
                        </td>

                        {/* Publish Buttons */}
                        <td className="py-3 px-4 text-right">
                          {isSold ? (
                            <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                              Vendido (Indisponível)
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handlePublishListing(item, ['mercadolivre', 'shopee'])}
                                disabled={isPublishingId === item.id}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                                title="Publicar simultaneamente no Mercado Livre e na Shopee"
                              >
                                <Zap className={`h-3 w-3 ${isPublishingId === item.id ? 'animate-spin' : ''}`} />
                                <span>{isPublishingId === item.id ? 'Publicando...' : 'Publicar nos 2'}</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONFIGURAÇÕES DE API, TOKENS & WEBHOOKS                            */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Webhook URLs Notification Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Zap className="h-5 w-5" />
              <h3 className="text-sm font-black text-white">URLs de Webhook para Notificação em Tempo Real</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Copie estas URLs e cole no painel do <strong>Mercado Livre Developers</strong> e da <strong>Shopee Open Platform</strong> para que o sistema receba instantaneamente os eventos de vendas e perguntas:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span>Mercado Livre Webhook URL:</span>
                  <span className="text-[10px] text-slate-500 font-normal">Tópicos: orders_v2, questions</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg text-[11px] font-mono text-slate-300">
                  <span className="truncate flex-1">{originUrl}/api/marketplaces/webhook/mercadolivre</span>
                  <button
                    onClick={() => copyToClipboard(`${originUrl}/api/marketplaces/webhook/mercadolivre`, 'meli_wh')}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                  >
                    {copiedWebhook === 'meli_wh' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-orange-400">
                  <span>Shopee Webhook / Push URL:</span>
                  <span className="text-[10px] text-slate-500 font-normal">Eventos: order, chat</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg text-[11px] font-mono text-slate-300">
                  <span className="truncate flex-1">{originUrl}/api/marketplaces/webhook/shopee</span>
                  <button
                    onClick={() => copyToClipboard(`${originUrl}/api/marketplaces/webhook/shopee`, 'shp_wh')}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                  >
                    {copiedWebhook === 'shp_wh' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Test Connection Output */}
          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 text-xs space-y-2 shadow-sm"
            >
              <div className="flex items-center gap-2 font-black">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{testResult.message}</span>
              </div>
              {testResult.details && (
                <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 text-[11px] space-y-1">
                  <div><strong>Conta / Vendedor:</strong> {testResult.details.nickname || testResult.details.shopName}</div>
                  <div><strong>Reputação / Status:</strong> {testResult.details.reputation || testResult.details.rating}</div>
                  <div><strong>Webhooks Ativos:</strong> {testResult.details.webhooksStatus}</div>
                </div>
              )}
            </motion.div>
          )}

          {/* Two-Column Grid for ML and Shopee Credential Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mercado Livre Config */}
            <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Mercado Livre Open Platform</h4>
                    <span className="text-[10px] text-slate-500 font-bold">API v2 / Developers</span>
                  </div>
                </div>
                <button
                  onClick={() => handleTestConnection('mercadolivre')}
                  disabled={isTestingConnection === 'mercadolivre'}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black cursor-pointer transition-all disabled:opacity-50"
                >
                  {isTestingConnection === 'mercadolivre' ? 'Testando...' : 'Testar Conexão'}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Client ID (App ID):</label>
                  <input
                    type="text"
                    value={config.mercadolivre.clientId}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      mercadolivre: { ...prev.mercadolivre, clientId: e.target.value }
                    }))}
                    placeholder="Ex: 8491029481928"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Client Secret:</label>
                  <input
                    type="password"
                    value={config.mercadolivre.clientSecret}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      mercadolivre: { ...prev.mercadolivre, clientSecret: e.target.value }
                    }))}
                    placeholder="••••••••••••••••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Access Token (OAuth 2.0):</label>
                  <input
                    type="password"
                    value={config.mercadolivre.accessToken || ''}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      mercadolivre: { ...prev.mercadolivre, accessToken: e.target.value }
                    }))}
                    placeholder="APP_USR-8491029481928-..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Gerado via OAuth no Mercado Livre Developers</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Apelido da Loja (Nickname):</label>
                  <input
                    type="text"
                    value={config.mercadolivre.nickname || ''}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      mercadolivre: { ...prev.mercadolivre, nickname: e.target.value }
                    }))}
                    placeholder="VALDIRDISCOS_OFICIAL"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.mercadolivre.autoSyncStock}
                      onChange={e => setConfig(prev => ({
                        ...prev,
                        mercadolivre: { ...prev.mercadolivre, autoSyncStock: e.target.checked }
                      }))}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-bold text-slate-700">Baixar estoque automaticamente ao receber venda no ML</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Shopee Config */}
            <div className="bg-white rounded-2xl p-6 border border-orange-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-100 text-orange-700 rounded-xl">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Shopee Open Platform</h4>
                    <span className="text-[10px] text-slate-500 font-bold">Shopee Open API v2</span>
                  </div>
                </div>
                <button
                  onClick={() => handleTestConnection('shopee')}
                  disabled={isTestingConnection === 'shopee'}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black cursor-pointer transition-all disabled:opacity-50"
                >
                  {isTestingConnection === 'shopee' ? 'Testando...' : 'Testar Conexão'}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Partner ID:</label>
                  <input
                    type="text"
                    value={config.shopee.partnerId}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      shopee: { ...prev.shopee, partnerId: e.target.value }
                    }))}
                    placeholder="Ex: 2008491"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Partner Key:</label>
                  <input
                    type="password"
                    value={config.shopee.partnerKey}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      shopee: { ...prev.shopee, partnerKey: e.target.value }
                    }))}
                    placeholder="••••••••••••••••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Access Token (Shopee API):</label>
                  <input
                    type="password"
                    value={config.shopee.accessToken || ''}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      shopee: { ...prev.shopee, accessToken: e.target.value }
                    }))}
                    placeholder="••••••••••••••••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shop ID:</label>
                  <input
                    type="text"
                    value={config.shopee.shopId}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      shopee: { ...prev.shopee, shopId: e.target.value }
                    }))}
                    placeholder="91823746"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.shopee.autoSyncStock}
                      onChange={e => setConfig(prev => ({
                        ...prev,
                        shopee: { ...prev.shopee, autoSyncStock: e.target.checked }
                      }))}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-bold text-slate-700">Baixar estoque automaticamente ao receber venda na Shopee</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={handleSaveConfig}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-100"
            >
              <Check className="h-4 w-4" />
              <span>Salvar Configurações de Integração</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function DiscIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

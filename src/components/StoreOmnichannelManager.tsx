/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Store, Globe, ShoppingBag, Layers, Search, Filter,
  CheckCircle, ArrowUpRight, DollarSign, TrendingUp,
  Printer, QrCode, Tag, Sparkles, RefreshCw, Check,
  ExternalLink, Share2, Copy, AlertTriangle, Eye, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SavedListing, SalesChannel } from '../types';
import { getSalesChannelMeta } from '../utils/qrcode';

interface StoreOmnichannelManagerProps {
  listings: SavedListing[];
  onUpdateListing: (listing: SavedListing) => void;
  onOpenScanner: () => void;
  onOpenThermalPrint: (listing: SavedListing) => void;
  onBatchThermalPrint?: (listings: SavedListing[]) => void;
}

export const StoreOmnichannelManager: React.FC<StoreOmnichannelManagerProps> = ({
  listings,
  onUpdateListing,
  onOpenScanner,
  onOpenThermalPrint,
  onBatchThermalPrint
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | SalesChannel | 'exclusive_physical' | 'exclusive_shopee' | 'multi_channel'>('all');
  const [selectedDrawer, setSelectedDrawer] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'storefront'>('matrix');
  const [copiedLink, setCopiedLink] = useState(false);

  // Extract all unique drawers
  const drawers = useMemo(() => {
    const set = new Set<string>();
    listings.forEach(l => {
      if (l.drawer && l.drawer.trim()) {
        set.add(l.drawer.trim());
      }
    });
    return Array.from(set).sort();
  }, [listings]);

  // Omnichannel Metrics
  const metrics = useMemo(() => {
    const totalItems = listings.length;
    const availableItems = listings.filter(l => l.status !== 'sold');
    const soldItems = listings.filter(l => l.status === 'sold');

    // Counts per channel
    let physicalCount = 0;
    let onlineCount = 0;
    let shopeeCount = 0;
    let mlCount = 0;

    let physicalValue = 0;
    let onlineValue = 0;
    let shopeeValue = 0;
    let mlValue = 0;

    // Sales per channel
    let physicalSales = 0;
    let onlineSales = 0;
    let shopeeSales = 0;
    let mlSales = 0;

    let physicalRevenue = 0;
    let onlineRevenue = 0;
    let shopeeRevenue = 0;
    let mlRevenue = 0;

    availableItems.forEach(item => {
      const channels = item.salesChannels || ['physical_store', 'online_store', 'shopee', 'mercadolivre'];
      const price = item.pricing?.directPrice || item.pricing?.basePriceBrl || 0;
      const shopeePrice = item.shopee?.suggestedPrice || price;
      const mlPrice = item.mercadolivre?.suggestedPrice || price;

      if (channels.includes('physical_store')) {
        physicalCount++;
        physicalValue += price;
      }
      if (channels.includes('online_store')) {
        onlineCount++;
        onlineValue += price;
      }
      if (channels.includes('shopee')) {
        shopeeCount++;
        shopeeValue += shopeePrice;
      }
      if (channels.includes('mercadolivre')) {
        mlCount++;
        mlValue += mlPrice;
      }
    });

    soldItems.forEach(item => {
      const platform = item.saleDetails?.platform || 'physical_store';
      const revenue = item.saleDetails?.salePrice || item.pricing?.basePriceBrl || 0;

      if (platform === 'physical_store' || platform === 'direct') {
        physicalSales++;
        physicalRevenue += revenue;
      } else if (platform === 'online_store') {
        onlineSales++;
        onlineRevenue += revenue;
      } else if (platform === 'shopee') {
        shopeeSales++;
        shopeeRevenue += revenue;
      } else if (platform === 'mercadolivre') {
        mlSales++;
        mlRevenue += revenue;
      }
    });

    return {
      totalItems,
      availableCount: availableItems.length,
      soldCount: soldItems.length,
      channels: {
        physical_store: { count: physicalCount, value: physicalValue, sales: physicalSales, revenue: physicalRevenue },
        online_store: { count: onlineCount, value: onlineValue, sales: onlineSales, revenue: onlineRevenue },
        shopee: { count: shopeeCount, value: shopeeValue, sales: shopeeSales, revenue: shopeeRevenue },
        mercadolivre: { count: mlCount, value: mlValue, sales: mlSales, revenue: mlRevenue }
      }
    };
  }, [listings]);

  // Filtered listings
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      // Status filter: we list available items first
      const channels = item.salesChannels || ['physical_store', 'online_store', 'shopee', 'mercadolivre'];

      // Text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const artist = item.release?.artist?.toLowerCase() || '';
        const title = item.release?.title?.toLowerCase() || '';
        const drawer = item.drawer?.toLowerCase() || '';
        const barcode = (item.barcode || `VD-${item.id.replace('list_', '').slice(-8)}`).toLowerCase();
        const matchesText = artist.includes(q) || title.includes(q) || drawer.includes(q) || barcode.includes(q);
        if (!matchesText) return false;
      }

      // Drawer filter
      if (selectedDrawer !== 'all') {
        if (item.drawer?.trim() !== selectedDrawer) return false;
      }

      // Channel filter
      if (channelFilter === 'physical_store' && !channels.includes('physical_store')) return false;
      if (channelFilter === 'online_store' && !channels.includes('online_store')) return false;
      if (channelFilter === 'shopee' && !channels.includes('shopee')) return false;
      if (channelFilter === 'mercadolivre' && !channels.includes('mercadolivre')) return false;
      if (channelFilter === 'exclusive_physical' && (channels.length !== 1 || !channels.includes('physical_store'))) return false;
      if (channelFilter === 'exclusive_shopee' && (channels.length !== 1 || !channels.includes('shopee'))) return false;
      if (channelFilter === 'multi_channel' && channels.length <= 1) return false;

      return true;
    });
  }, [listings, searchTerm, selectedDrawer, channelFilter]);

  // Fast toggle channel on item
  const handleToggleChannel = (item: SavedListing, channel: SalesChannel) => {
    const current = item.salesChannels || ['physical_store', 'online_store', 'shopee', 'mercadolivre'];
    let updated: SalesChannel[];
    if (current.includes(channel)) {
      updated = current.filter(c => c !== channel);
    } else {
      updated = [...current, channel];
    }
    const updatedItem = { ...item, salesChannels: updated };
    onUpdateListing(updatedItem);
  };

  // Bulk enable/disable channel for all filtered items
  const handleBulkSetChannel = (channel: SalesChannel, enable: boolean) => {
    filteredListings.forEach(item => {
      const current = item.salesChannels || ['physical_store', 'online_store', 'shopee', 'mercadolivre'];
      if (enable && !current.includes(channel)) {
        onUpdateListing({ ...item, salesChannels: [...current, channel] });
      } else if (!enable && current.includes(channel)) {
        onUpdateListing({ ...item, salesChannels: current.filter(c => c !== channel) });
      }
    });
  };

  const handleCopyStorefrontLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6" id="omnichannel-store-control">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
              <Store className="h-3.5 w-3.5" />
              Controle Central Omnicanal • Valdir Discos
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Gestão Unificada de Estoque & Canais
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Controle simultâneo da <strong>Loja Física</strong>, <strong>Loja Própria Online</strong>, <strong>Shopee</strong> e <strong>Mercado Livre</strong> com leitor de código de barras e etiquetas térmicas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenScanner}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
            >
              <QrCode className="h-4 w-4" />
              <span>Leitor & PDV Térmico</span>
            </button>

            {onBatchThermalPrint && filteredListings.length > 0 && (
              <button
                onClick={() => onBatchThermalPrint(filteredListings)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 cursor-pointer border border-slate-700 transition-all"
              >
                <Printer className="h-4 w-4 text-indigo-400" />
                <span>Imprimir Etiquetas ({filteredListings.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Main Channels Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Loja Física */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Loja Física</h4>
                <span className="text-[10px] font-bold text-emerald-700">Balcão & Gavetas</span>
              </div>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Discos Ativos:</span>
              <strong className="text-slate-900 font-mono font-bold text-sm">{metrics.channels.physical_store.count}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Valor em Estoque:</span>
              <strong className="text-emerald-700 font-mono font-bold">R$ {metrics.channels.physical_store.value.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
              <span className="text-slate-400 text-[11px]">Vendas Realizadas:</span>
              <span className="text-slate-700 font-mono font-bold text-xs">{metrics.channels.physical_store.sales} un.</span>
            </div>
          </div>
        </div>

        {/* 2. Loja Própria Online */}
        <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Loja Própria Online</h4>
                <span className="text-[10px] font-bold text-indigo-700">Vitrine Digital Web</span>
              </div>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Discos Ativos:</span>
              <strong className="text-slate-900 font-mono font-bold text-sm">{metrics.channels.online_store.count}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Valor em Estoque:</span>
              <strong className="text-indigo-700 font-mono font-bold">R$ {metrics.channels.online_store.value.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
              <span className="text-slate-400 text-[11px]">Vendas Realizadas:</span>
              <span className="text-slate-700 font-mono font-bold text-xs">{metrics.channels.online_store.sales} un.</span>
            </div>
          </div>
        </div>

        {/* 3. Shopee */}
        <div className="bg-white rounded-2xl p-5 border border-orange-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-orange-100 text-orange-700 rounded-xl">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Shopee</h4>
                <span className="text-[10px] font-bold text-orange-700">Marketplace</span>
              </div>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Discos Ativos:</span>
              <strong className="text-slate-900 font-mono font-bold text-sm">{metrics.channels.shopee.count}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Valor em Estoque:</span>
              <strong className="text-orange-700 font-mono font-bold">R$ {metrics.channels.shopee.value.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
              <span className="text-slate-400 text-[11px]">Vendas Realizadas:</span>
              <span className="text-slate-700 font-mono font-bold text-xs">{metrics.channels.shopee.sales} un.</span>
            </div>
          </div>
        </div>

        {/* 4. Mercado Livre */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Mercado Livre</h4>
                <span className="text-[10px] font-bold text-amber-700">Marketplace</span>
              </div>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Discos Ativos:</span>
              <strong className="text-slate-900 font-mono font-bold text-sm">{metrics.channels.mercadolivre.count}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Valor em Estoque:</span>
              <strong className="text-amber-700 font-mono font-bold">R$ {metrics.channels.mercadolivre.value.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
              <span className="text-slate-400 text-[11px]">Vendas Realizadas:</span>
              <span className="text-slate-700 font-mono font-bold text-xs">{metrics.channels.mercadolivre.sales} un.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Filters & Fast Search */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por artista, título, código VD ou gaveta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Drawer Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Gaveta:</label>
            <select
              value={selectedDrawer}
              onChange={(e) => setSelectedDrawer(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Todas as Gavetas ({drawers.length})</option>
              {drawers.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Channel Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 mr-1">Filtrar por Disponibilidade:</span>
          {[
            { id: 'all', label: `Todos os Discos (${listings.length})` },
            { id: 'physical_store', label: `Loja Física (${metrics.channels.physical_store.count})`, color: 'text-emerald-700' },
            { id: 'online_store', label: `Loja Online (${metrics.channels.online_store.count})`, color: 'text-indigo-700' },
            { id: 'shopee', label: `Shopee (${metrics.channels.shopee.count})`, color: 'text-orange-700' },
            { id: 'mercadolivre', label: `Mercado Livre (${metrics.channels.mercadolivre.count})`, color: 'text-amber-800' },
            { id: 'exclusive_physical', label: 'Apenas Loja Física' },
            { id: 'multi_channel', label: 'Presente em Múltiplos Canais' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setChannelFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                channelFilter === f.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Omnichannel Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              Matriz de Canais de Venda & Etiquetas
              <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                {filteredListings.length} títulos listados
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Marque ou desmarque os canais de venda de cada disco em tempo real
            </p>
          </div>

          {/* Fast Bulk Selectors */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Ações em Lote:</span>
            <button
              onClick={() => handleBulkSetChannel('physical_store', true)}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold cursor-pointer"
            >
              + Física
            </button>
            <button
              onClick={() => handleBulkSetChannel('online_store', true)}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-lg text-[10px] font-bold cursor-pointer"
            >
              + Online
            </button>
            <button
              onClick={() => handleBulkSetChannel('shopee', true)}
              className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 rounded-lg text-[10px] font-bold cursor-pointer"
            >
              + Shopee
            </button>
            <button
              onClick={() => handleBulkSetChannel('mercadolivre', true)}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-[10px] font-bold cursor-pointer"
            >
              + ML
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Código / Capa</th>
                <th className="py-3 px-4">Artista & Álbum</th>
                <th className="py-3 px-4">Gaveta</th>
                <th className="py-3 px-4">Preço (R$)</th>
                <th className="py-3 px-3 text-center">🏬 Loja Física</th>
                <th className="py-3 px-3 text-center">🌐 Loja Online</th>
                <th className="py-3 px-3 text-center">🛍️ Shopee</th>
                <th className="py-3 px-3 text-center">💛 Mercado Livre</th>
                <th className="py-3 px-4 text-right">Etiqueta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Nenhum disco encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredListings.map(item => {
                  const channels = item.salesChannels || ['physical_store', 'online_store', 'shopee', 'mercadolivre'];
                  const barcode = item.barcode || `VD-${item.id.replace('list_', '').slice(-8)}`;
                  const isSold = item.status === 'sold';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSold ? 'opacity-60 bg-slate-50/50' : ''
                      }`}
                    >
                      {/* Code and Mini Cover */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                            <img
                              src={item.customImages?.[0] || item.release?.coverImage || 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=150'}
                              alt={item.release?.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-900 block">{barcode}</span>
                            {isSold ? (
                              <span className="text-[9px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">Vendido</span>
                            ) : (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">Em Estoque</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Artist and Album */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 line-clamp-1">{item.release?.artist}</div>
                        <div className="text-slate-500 text-[11px] line-clamp-1">{item.release?.title}</div>
                      </td>

                      {/* Drawer */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                          {item.drawer || 'SEM_LOC'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900">
                          R$ {(item.pricing?.basePriceBrl || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* 1. Loja Física Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleChannel(item, 'physical_store')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                            channels.includes('physical_store')
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                          }`}
                          title="Disponível na Loja Física"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </td>

                      {/* 2. Loja Online Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleChannel(item, 'online_store')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                            channels.includes('online_store')
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                          }`}
                          title="Disponível na Loja Própria Online"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </td>

                      {/* 3. Shopee Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleChannel(item, 'shopee')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                            channels.includes('shopee')
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                          }`}
                          title="Disponível na Shopee"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </td>

                      {/* 4. Mercado Livre Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleChannel(item, 'mercadolivre')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                            channels.includes('mercadolivre')
                              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                              : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                          }`}
                          title="Disponível no Mercado Livre"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </td>

                      {/* Thermal Print Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onOpenThermalPrint(item)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Printer className="h-3.5 w-3.5 text-emerald-400" />
                          Imprimir
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

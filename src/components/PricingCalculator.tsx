/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DollarSign, Percent, Tag, Calculator, Info, Package, TrendingUp, HelpCircle, Gift, Sparkles } from 'lucide-react';
import { PricingConfig } from '../types';

interface PricingCalculatorProps {
  pricing: PricingConfig;
  onChange: (updated: PricingConfig) => void;
  discogsLowestPriceUsd?: number;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  pricing,
  onChange,
  discogsLowestPriceUsd,
}) => {
  const mode = pricing.mode || 'direct';

  // Direct sale price (what customer pays in store/ads)
  const directSalePrice = pricing.directPrice ?? pricing.basePriceBrl ?? 80;
  
  // Real acquisition cost paid for the disc
  const discCost = pricing.costPrice ?? 0;
  const packaging = pricing.packagingCost ?? 4.0;
  const totalCost = discCost + packaging;
  const estimatedProfit = directSalePrice - totalCost;
  const profitMarginPct = directSalePrice > 0 ? ((estimatedProfit / directSalePrice) * 100).toFixed(0) : '0';

  // Advanced Mode Formulas
  const baseInBrl = pricing.useExchange
    ? (pricing.costPrice || pricing.basePriceBrl) * pricing.exchangeRate
    : (pricing.costPrice || pricing.basePriceBrl);

  const costWithPackaging = baseInBrl + packaging;
  const targetNetPayout = costWithPackaging * (1 + (pricing.profitMarginPercent || 20) / 100);
  const commissionRate = (pricing.shopeeCommissionPercent || 14) / 100;
  const divisor = 1 - commissionRate;
  const finalShopeePrice = divisor > 0 
    ? (targetNetPayout + (pricing.shopeeFixedFee || 4.0)) / divisor 
    : 0;
  const totalShopeeFee = finalShopeePrice * commissionRate + (pricing.shopeeFixedFee || 4.0);
  const realProfitAdvanced = finalShopeePrice - totalShopeeFee - costWithPackaging;

  const handleUseDiscogsPriceDirect = () => {
    if (discogsLowestPriceUsd) {
      const converted = Math.round(discogsLowestPriceUsd * (pricing.exchangeRate || 5.60));
      onChange({
        ...pricing,
        directPrice: converted,
        basePriceBrl: converted,
        mode: 'direct',
        useExchange: false
      });
    }
  };

  return (
    <div className="space-y-5" id="pricing-calculator-container">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-indigo-600" />
            Precificação & Custos do Disco
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Defina o preço de venda da loja e o custo real de aquisição para cálculo de lucro.
          </p>
        </div>
        <span className="text-[10px] uppercase font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl border border-indigo-200">
          Valdir Discos
        </span>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/50">
        <button
          type="button"
          onClick={() => onChange({ ...pricing, mode: 'direct' })}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mode === 'direct'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/20'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Tag className="h-4 w-4 text-indigo-500" />
          Preço Direto da Loja
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...pricing, mode: 'advanced' })}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mode === 'advanced'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/20'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calculator className="h-4 w-4 text-indigo-500" />
          Calculadora de Margem / Taxas
        </button>
      </div>

      {/* Mode Contents */}
      {mode === 'direct' ? (
        /* DIRECT PRICE MODE */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preço de Venda da Loja */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Preço de Venda na Loja (R$)</span>
                <span className="text-[10px] text-emerald-600 font-semibold lowercase bg-emerald-50 px-2 py-0.5 rounded-md">valor cobrado</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-base font-black font-mono">R$</span>
                </div>
                <input
                  type="number"
                  value={pricing.directPrice ?? pricing.basePriceBrl ?? ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onChange({ ...pricing, directPrice: val, basePriceBrl: val, mode: 'direct', useExchange: false });
                  }}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xl font-black font-mono text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="80.00"
                  step="any"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">
                Preço final anunciado no balcão, site e marketplaces.
              </p>
            </div>

            {/* Custo de Aquisição (O que pagou no disco) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Custo de Aquisição / Compra (R$)</span>
                <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">opcional</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-base font-black font-mono">R$</span>
                </div>
                <input
                  type="number"
                  value={pricing.costPrice !== undefined ? pricing.costPrice : ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    onChange({ ...pricing, costPrice: val });
                  }}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xl font-black font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="0.00"
                  step="any"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">
                Quanto você pagou no lote ou garimpo por este vinil (R$ 0 se não souber).
              </p>
            </div>
          </div>

          {/* Embalagem e Resumo de Lucro */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                <Package className="h-4 w-4 text-slate-400" />
                <span>Custo de Embalagem & Plásticos:</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-mono">R$</span>
                <input
                  type="number"
                  value={pricing.packagingCost ?? 4.0}
                  onChange={(e) => onChange({ ...pricing, packagingCost: parseFloat(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-right text-slate-800"
                  step="0.50"
                />
              </div>
            </div>

            {/* Profit summary card */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Lucro Bruto Estimado</span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Venda R$ {directSalePrice.toFixed(2)} - Custo Total R$ {totalCost.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-black font-mono text-emerald-700">
                  R$ {estimatedProfit.toFixed(2)}
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                  {profitMarginPct}% de margem
                </span>
              </div>
            </div>
          </div>

          {/* Promoção, Bônus & Desconto % OFF */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            pricing.promoActive 
              ? 'bg-rose-50/60 border-rose-200 shadow-xs' 
              : 'bg-slate-50 border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-rose-200/40">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!pricing.promoActive}
                  onChange={(e) => {
                    const active = e.target.checked;
                    const discount = pricing.discountPercent || 15;
                    const orig = pricing.originalPrice || directSalePrice;
                    const promoP = active ? Math.round(orig * (1 - discount / 100)) : orig;
                    onChange({
                      ...pricing,
                      promoActive: active,
                      discountPercent: discount,
                      originalPrice: orig,
                      promoPrice: promoP,
                      promoBadge: `${discount}% OFF`,
                      bonusDescription: pricing.bonusDescription || 'Bônus: Plásticos protetores novos inclusos'
                    });
                  }}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-rose-600" />
                    Ativar Promoção no Produto (% OFF) & Bônus
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Aplica porcentagem de desconto (ex: 15% OFF) com destaque no site e descrição de bônus.
                  </p>
                </div>
              </label>

              {pricing.promoActive && (
                <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-md uppercase tracking-wider shrink-0">
                  {pricing.promoBadge || `${pricing.discountPercent || 15}% OFF`}
                </span>
              )}
            </div>

            {pricing.promoActive && (
              <div className="pt-3 space-y-3">
                {/* Discount % buttons */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-700">Desconto:</span>
                    {[10, 15, 20, 25, 30].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const orig = pricing.originalPrice || directSalePrice;
                          const promoP = Math.round(orig * (1 - pct / 100));
                          onChange({
                            ...pricing,
                            discountPercent: pct,
                            promoBadge: `${pct}% OFF`,
                            promoPrice: promoP
                          });
                        }}
                        className={`px-2 py-0.5 text-xs font-black rounded-md cursor-pointer transition-all ${
                          pricing.discountPercent === pct
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {pct}% OFF
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <span className="text-[10px] font-bold text-slate-400">De R$ {(pricing.originalPrice || directSalePrice).toFixed(2)} por:</span>
                    <span className="text-sm font-black text-rose-600 font-mono">
                      R$ {(pricing.promoPrice || Math.round((pricing.originalPrice || directSalePrice) * (1 - (pricing.discountPercent || 15) / 100))).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Badge text and bonus */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <Tag className="h-3 w-3 text-rose-600" />
                      Texto do Selo Promocional:
                    </label>
                    <input
                      type="text"
                      value={pricing.promoBadge || ''}
                      onChange={(e) => onChange({ ...pricing, promoBadge: e.target.value })}
                      placeholder="Ex: 15% OFF"
                      className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <Gift className="h-3 w-3 text-amber-600" />
                      Bônus / Brinde da Promoção:
                    </label>
                    <input
                      type="text"
                      value={pricing.bonusDescription || ''}
                      onChange={(e) => onChange({ ...pricing, bonusDescription: e.target.value })}
                      placeholder="Ex: Bônus: Plásticos protetores novos inclusos"
                      className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Discogs optional Reference */}
          {discogsLowestPriceUsd && discogsLowestPriceUsd > 0 && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-extrabold text-amber-800 tracking-wider flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-amber-600" />
                    Cotação Internacional de Referência (Discogs)
                  </span>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Preço mínimo listado por vendedores estrangeiros: <strong className="text-slate-900 font-mono">${discogsLowestPriceUsd.toFixed(2)} USD</strong> (≈ R$ {Math.round(discogsLowestPriceUsd * (pricing.exchangeRate || 5.60)).toFixed(2)}).
                  </p>
                  <span className="text-[10px] text-slate-400 block italic">
                    *Preço meramente informativo. Não altera automaticamente o seu valor de venda.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleUseDiscogsPriceDirect}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl whitespace-nowrap cursor-pointer transition-all active:scale-95 shrink-0 shadow-xs"
                >
                  Copiar para Venda
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ADVANCED MODE (FORMULA CALCULATOR) */
        <div className="space-y-5 animate-fadeIn">
          {/* Input Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base Price input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Custo do Disco ({pricing.useExchange ? 'USD' : 'R$'})</span>
                <button
                  type="button"
                  onClick={() => onChange({ ...pricing, useExchange: !pricing.useExchange })}
                  className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer focus:outline-none"
                >
                  Mudar para {pricing.useExchange ? 'Reais (R$)' : 'Dólares ($)'}
                </button>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-xs font-mono">{pricing.useExchange ? '$' : 'R$'}</span>
                </div>
                <input
                  type="number"
                  value={pricing.costPrice !== undefined ? pricing.costPrice : pricing.basePriceBrl || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onChange({ ...pricing, costPrice: val, basePriceBrl: val });
                  }}
                  className="block w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  placeholder="0.00"
                  step="any"
                />
              </div>
            </div>

            {/* Shopee Commission */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Comissão Marketplace (%)</span>
                <span className="text-[10px] text-slate-400 font-medium">Padrão: 14%</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-xs"><Percent className="h-3 w-3" /></span>
                </div>
                <input
                  type="number"
                  value={pricing.shopeeCommissionPercent || ''}
                  onChange={(e) => onChange({ ...pricing, shopeeCommissionPercent: parseFloat(e.target.value) || 0 })}
                  className="block w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  placeholder="14"
                />
              </div>
            </div>

            {/* Fixed Fee */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxa Fixa por Item</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-xs">R$</span>
                </div>
                <input
                  type="number"
                  value={pricing.shopeeFixedFee || ''}
                  onChange={(e) => onChange({ ...pricing, shopeeFixedFee: parseFloat(e.target.value) || 0 })}
                  className="block w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  placeholder="4.00"
                  step="0.50"
                />
              </div>
            </div>

            {/* Packaging Cost */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Custo de Embalagem</span>
                <span className="text-[10px] text-slate-400 font-medium">Plásticos + Caixa</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-xs">R$</span>
                </div>
                <input
                  type="number"
                  value={pricing.packagingCost || ''}
                  onChange={(e) => onChange({ ...pricing, packagingCost: parseFloat(e.target.value) || 0 })}
                  className="block w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  placeholder="4.00"
                  step="0.50"
                />
              </div>
            </div>

            {/* Profit Margin slider */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margem de Lucro Desejada</label>
                <span className="text-xs text-emerald-600 font-bold">{pricing.profitMarginPercent}%</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pricing.profitMarginPercent || 20}
                  onChange={(e) => onChange({ ...pricing, profitMarginPercent: parseInt(e.target.value) || 0 })}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Spreadsheet / Breakdown Display */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3" id="pricing-breakdown">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalhamento Financeiro</h4>
            
            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between text-slate-500">
                <span>Custo de Aquisição do Disco:</span>
                <span className="font-mono text-slate-700">
                  R$ {baseInBrl.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between text-slate-500">
                <span>+ Custo de Embalagem Especial (Segura):</span>
                <span className="font-mono text-slate-700 font-semibold">R$ {(pricing.packagingCost || 4.0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>+ Margem de Lucro Calculada ({pricing.profitMarginPercent}%):</span>
                <span className="font-mono text-emerald-600 font-bold">+ R$ {(costWithPackaging * ((pricing.profitMarginPercent || 20) / 100)).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600 border-t border-slate-200/80 pt-2 pb-1">
                <span className="font-semibold text-slate-700">Receita Líquida Alvo (Valdir):</span>
                <span className="font-mono font-bold text-slate-900">R$ {targetNetPayout.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Taxa de Comissão ({pricing.shopeeCommissionPercent}%):</span>
                <span className="font-mono text-amber-600 font-semibold">R$ {(finalShopeePrice * commissionRate).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Taxa Fixa por Item:</span>
                <span className="font-mono text-amber-600 font-semibold">R$ {(pricing.shopeeFixedFee || 4.0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-amber-800 font-bold bg-amber-50 px-2 py-1.5 rounded-xl border border-amber-100">
                <span>Total de Taxas Descontadas:</span>
                <span className="font-mono">- R$ {totalShopeeFee.toFixed(2)}</span>
              </div>
            </div>

            {/* Final Price Result Display */}
            <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm shadow-emerald-50/50">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Preço Sugerido para o Anúncio</span>
              <div className="text-3xl font-black font-mono text-emerald-600">
                R$ {finalShopeePrice.toFixed(2)}
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 max-w-[280px] leading-relaxed font-medium">
                Ao vender por este preço, você cobre as taxas e garante seu lucro líquido de <strong className="text-emerald-700 font-bold">R$ {realProfitAdvanced.toFixed(2)}</strong>!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


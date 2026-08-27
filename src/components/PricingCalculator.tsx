/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DollarSign, Percent, Plus, HelpCircle, ArrowRight, ShieldCheck, Tag, Calculator, Info } from 'lucide-react';
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

  // Conversions and calculations for Advanced Mode
  const baseInBrl = pricing.useExchange
    ? pricing.basePriceBrl * pricing.exchangeRate
    : pricing.basePriceBrl;

  const costWithPackaging = baseInBrl + pricing.packagingCost;
  const targetNetPayout = costWithPackaging * (1 + pricing.profitMarginPercent / 100);

  const commissionRate = pricing.shopeeCommissionPercent / 100;
  const divisor = 1 - commissionRate;
  
  const finalShopeePrice = divisor > 0 
    ? (targetNetPayout + pricing.shopeeFixedFee) / divisor 
    : 0;

  const totalShopeeFee = finalShopeePrice * commissionRate + pricing.shopeeFixedFee;
  const realProfit = finalShopeePrice - totalShopeeFee - costWithPackaging;

  const handleUseDiscogsPriceDirect = () => {
    if (discogsLowestPriceUsd) {
      const converted = Math.round(discogsLowestPriceUsd * pricing.exchangeRate);
      onChange({
        ...pricing,
        directPrice: converted,
        basePriceBrl: converted,
        mode: 'direct',
        useExchange: false
      });
    }
  };

  const handleUseDiscogsPriceAdvanced = () => {
    if (discogsLowestPriceUsd) {
      onChange({
        ...pricing,
        basePriceBrl: discogsLowestPriceUsd,
        useExchange: true,
      });
    }
  };

  return (
    <div className="space-y-5" id="pricing-calculator-container">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-indigo-600" />
          Precificação do Anúncio
        </h3>
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
          Definir Preço Direto
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
          Calculadora de Margem
        </button>
      </div>

      {/* Mode Contents */}
      {mode === 'direct' ? (
        /* DIRECT PRICE MODE */
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Meu Preço de Venda / Preço da Loja (R$)</span>
              <span className="text-[10px] text-emerald-600 font-semibold lowercase bg-emerald-50 px-2 py-0.5 rounded-md">salvo no banco de dados</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className="text-slate-400 text-lg font-black font-mono">R$</span>
              </div>
              <input
                type="number"
                value={pricing.directPrice ?? pricing.basePriceBrl}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onChange({ ...pricing, directPrice: val, basePriceBrl: val, mode: 'direct', useExchange: false });
                }}
                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-2xl font-black font-mono text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                placeholder="0.00"
                step="any"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed flex items-start gap-1">
              <Info className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <span>Digite diretamente o preço pelo qual o disco será anunciado. Este valor será sincronizado automaticamente no título e na descrição das duas plataformas.</span>
            </p>
          </div>

          {discogsLowestPriceUsd && (
            <button
              type="button"
              onClick={handleUseDiscogsPriceDirect}
              className="w-full flex items-center justify-between px-3.5 py-3 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/70 rounded-xl text-xs text-emerald-800 transition-all cursor-pointer shadow-sm shadow-emerald-50/50"
            >
              <span className="flex items-center gap-1.5 text-left font-semibold">
                <DollarSign className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Sugerido do Discogs convertido: <strong className="text-emerald-950">R$ {Math.round(discogsLowestPriceUsd * pricing.exchangeRate).toFixed(2)}</strong>
                </span>
              </span>
              <span className="bg-emerald-600 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider flex-shrink-0">
                Usar Preço
              </span>
            </button>
          )}
        </div>
      ) : (
        /* ADVANCED MODE (FORMULA CALCULATOR) */
        <div className="space-y-5 animate-fadeIn">
          {discogsLowestPriceUsd && (
            <button
              type="button"
              onClick={handleUseDiscogsPriceAdvanced}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/70 rounded-xl text-xs text-indigo-700 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-semibold">
                <DollarSign className="h-4 w-4 text-indigo-500" />
                <span>Usar preço médio do Discogs: <strong className="text-indigo-950">${discogsLowestPriceUsd.toFixed(2)} USD</strong></span>
              </span>
              <span className="bg-indigo-600 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                Carregar
              </span>
            </button>
          )}

          {/* Input Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base Price input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Custo Base do Item ({pricing.useExchange ? 'USD' : 'R$'})</span>
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
                  value={pricing.basePriceBrl || ''}
                  onChange={(e) => onChange({ ...pricing, basePriceBrl: parseFloat(e.target.value) || 0 })}
                  className="block w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  placeholder="0.00"
                  step="any"
                />
              </div>
            </div>

            {/* Exchange Rate (if USD) */}
            {pricing.useExchange && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxa do Dólar (USD para BRL)</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-xs">R$</span>
                  </div>
                  <input
                    type="number"
                    value={pricing.exchangeRate || ''}
                    onChange={(e) => onChange({ ...pricing, exchangeRate: parseFloat(e.target.value) || 0 })}
                    className="block w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    placeholder="5.60"
                    step="0.01"
                  />
                </div>
              </div>
            )}

            {/* Shopee Commission */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Comissão da Shopee (%)</span>
                <span className="text-[10px] text-slate-400 font-medium">Padrão: 14% ou 20%</span>
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
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxa Fixa Shopee por Item</label>
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
                <span>Custo da Embalagem</span>
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
                  placeholder="5.00"
                  step="0.50"
                />
              </div>
            </div>

            {/* Profit Margin slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margem de Lucro Desejada</label>
                <span className="text-xs text-emerald-600 font-bold">{pricing.profitMarginPercent}%</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pricing.profitMarginPercent}
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
                <span>Custo Base do Disco:</span>
                <span className="font-mono text-slate-700">
                  {pricing.useExchange ? `$${pricing.basePriceBrl.toFixed(2)} USD ≈ ` : ''}
                  R$ {baseInBrl.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between text-slate-500">
                <span>+ Custo de Embalagem Especial (Segura):</span>
                <span className="font-mono text-slate-700 font-semibold">R$ {pricing.packagingCost.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>+ Margem de Lucro Calculada ({pricing.profitMarginPercent}%):</span>
                <span className="font-mono text-emerald-600 font-bold">+ R$ {(costWithPackaging * (pricing.profitMarginPercent / 100)).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600 border-t border-slate-200/80 pt-2 pb-1">
                <span className="font-semibold text-slate-700">Receita Líquida Alvo (Valdir):</span>
                <span className="font-mono font-bold text-slate-900">R$ {targetNetPayout.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Taxa de Comissão Shopee ({pricing.shopeeCommissionPercent}%):</span>
                <span className="font-mono text-amber-600 font-semibold">R$ {(finalShopeePrice * commissionRate).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Taxa Fixa por Item Shopee:</span>
                <span className="font-mono text-amber-600 font-semibold">R$ {pricing.shopeeFixedFee.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-amber-800 font-bold bg-amber-50 px-2 py-1.5 rounded-xl border border-amber-100">
                <span>Total de Taxas Shopee Descontadas:</span>
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
                Ao vender por este preço, você cobre as taxas da Shopee e garante seu lucro líquido de <strong className="text-emerald-700 font-bold">R$ {realProfit.toFixed(2)}</strong> por este disco!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

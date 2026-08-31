import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Search, 
  Check, 
  Clock, 
  Store, 
  AlertCircle, 
  ShieldCheck,
  Package,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  calculateCorreiosShipping, 
  fetchAddressByCep, 
  ShippingOption, 
  STORE_ORIGIN,
  getCorreiosTrackingUrl,
  CorreiosCalculationResult
} from '../utils/shippingCalculator';

interface ShippingCalculatorWidgetProps {
  onSelectOption?: (option: ShippingOption) => void;
  selectedOptionId?: string;
  compact?: boolean;
  itemsCount?: number;
  format?: 'vinyl' | 'cd' | 'cassette' | 'tshirt' | 'mixed';
  declaredValue?: number;
  initialCep?: string;
}

export function ShippingCalculatorWidget({
  onSelectOption,
  selectedOptionId,
  compact = false,
  itemsCount = 1,
  format = 'vinyl',
  declaredValue = 0,
  initialCep = ''
}: ShippingCalculatorWidgetProps) {
  const [activeTab, setActiveTab] = useState<'calculate' | 'track'>('calculate');
  const [cep, setCep] = useState(initialCep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculationResult, setCalculationResult] = useState<CorreiosCalculationResult | null>(null);

  // Tracking tab state
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingFeedback, setTrackingFeedback] = useState<string | null>(null);

  const formatCep = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    if (raw.length > 5) {
      return `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }
    return raw;
  };

  const handleCalculate = async (e?: React.FormEvent, customCep?: string) => {
    if (e) e.preventDefault();
    const targetCep = (customCep || cep).replace(/\D/g, '');
    if (targetCep.length !== 8) {
      setError('Informe um CEP válido com 8 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await calculateCorreiosShipping({
        cep: targetCep,
        itemsCount,
        format,
        declaredValue
      });

      if (!result || !result.options || result.options.length === 0) {
        setError('Não foi possível calcular o frete dos Correios para este CEP.');
      } else {
        setCalculationResult(result);
        
        // Auto-select best option if callback provided
        if (onSelectOption && result.options.length > 0) {
          const isLocal = result.destination.state === 'RS';
          const defaultOpt = isLocal
            ? (result.options.find(o => o.id === 'correios_pac') || result.options[0])
            : (result.options.find(o => o.id === 'correios_pac') || result.options.find(o => o.isOfficialCorreios) || result.options[0]);
          
          if (!selectedOptionId) {
            onSelectOption(defaultOpt);
          }
        }
      }
    } catch (err) {
      setError('Falha temporária de conexão com o cálculo dos Correios. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Recalculate if itemsCount or format changes and we already have a calculated CEP
  useEffect(() => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8 && calculationResult) {
      handleCalculate(undefined, clean);
    }
  }, [itemsCount, format]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackingCode.trim().toUpperCase();
    if (!clean) {
      setTrackingFeedback('Digite o código de rastreamento (ex: NL123456789BR).');
      return;
    }
    setTrackingFeedback(null);
    const url = getCorreiosTrackingUrl(clean);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`rounded-2xl border ${compact ? 'p-3 bg-slate-50/90 border-slate-200' : 'p-4 bg-white border-slate-200 shadow-xs'} space-y-3`}>
      {/* Header with Correios Branding & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {/* Correios emblem badge */}
          <div className="flex items-center gap-1 bg-[#003882] text-white px-2 py-0.8 rounded-lg shadow-2xs">
            <Truck className="h-3.5 w-3.5 text-[#FED100]" />
            <span className="text-[11px] font-black tracking-wide">CORREIOS</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('calculate')}
              className={`text-xs font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'calculate' 
                  ? 'bg-amber-100 text-amber-900' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Calcular Frete
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('track')}
              className={`text-xs font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'track' 
                  ? 'bg-amber-100 text-amber-900' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Search className="h-3 w-3" />
              <span>Rastrear Objeto</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
          <span>Origem: <strong>Santa Maria - RS</strong></span>
        </div>
      </div>

      {/* Tab 1: Calculate Shipping */}
      {activeTab === 'calculate' && (
        <div className="space-y-3">
          {/* Package Simulation Notice */}
          <div className="flex items-center justify-between text-[10.5px] bg-blue-50/70 border border-blue-100 p-2 rounded-xl text-blue-900">
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-blue-700 shrink-0" />
              <span>
                Simulação para: <strong>{itemsCount}x {format === 'vinyl' ? 'Disco de Vinil LP 12"' : format === 'cd' ? 'CD' : format === 'cassette' ? 'Fita K7' : 'Item'}</strong>
              </span>
            </div>
            <span className="font-mono text-[10px] text-blue-700 font-semibold bg-white/80 px-1.5 py-0.5 rounded">
              {format === 'vinyl' ? `~${Math.round(250 + itemsCount * 380)}g` : `~${itemsCount * 120}g`}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleCalculate} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Informe seu CEP (ex: 97010-000)"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#003882] font-mono"
                maxLength={9}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#003882] hover:bg-[#002860] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <span className="animate-spin text-xs">⏳</span>
              ) : (
                <Search className="h-3.5 w-3.5 text-[#FED100]" />
              )}
              <span>Calcular Correios</span>
            </button>
          </form>

          {error && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 bg-rose-50 p-2 rounded-lg border border-rose-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {/* Results Display */}
          {calculationResult && (
            <div className="space-y-2 pt-1">
              {/* Destination Banner */}
              <div className="text-[11px] flex items-center justify-between font-medium bg-emerald-50 text-emerald-950 p-2.5 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">
                    Entrega em: <strong>{calculationResult.destination.formatted}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-mono shrink-0 ml-2">
                  CEP {calculationResult.destination.cep}
                </span>
              </div>

              {/* Shipping Options list */}
              <div className="space-y-1.5">
                {calculationResult.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  const isPac = opt.id === 'correios_pac';
                  const isSedex = opt.id === 'correios_sedex';
                  const isModico = opt.id === 'correios_modico';
                  const isPickup = opt.id === 'pickup';

                  return (
                    <div
                      key={opt.id}
                      onClick={() => onSelectOption && onSelectOption(opt)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        onSelectOption ? 'cursor-pointer hover:border-[#003882]/60' : ''
                      } ${
                        isSelected 
                          ? 'bg-blue-50/80 border-[#003882] ring-1 ring-[#003882]' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#003882] bg-[#003882] text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="h-2.5 w-2.5" />}
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900">
                                {opt.name}
                              </span>

                              {isSedex && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 bg-[#FED100] text-[#003882] rounded">
                                  SEDEX EXPRESS
                                </span>
                              )}

                              {isPac && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 bg-[#003882] text-white rounded">
                                  PAC ECONÔMICO
                                </span>
                              )}

                              {isModico && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 bg-purple-100 text-purple-900 rounded">
                                  MÓDICO / DISCOS
                                </span>
                              )}

                              {opt.badge && !isPac && !isSedex && !isModico && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded">
                                  {opt.badge}
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-slate-500 leading-snug">
                              {opt.description}
                            </p>

                            <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-600 font-medium">
                              <span className="flex items-center gap-1 text-slate-700">
                                <Clock className="h-3 w-3 text-amber-600" />
                                Prazo: <strong>{opt.estimatedDays}</strong>
                              </span>

                              {opt.hasTracking && (
                                <span className="text-emerald-700 flex items-center gap-0.5">
                                  • Rastreio Correios
                                </span>
                              )}

                              {opt.hasInsurance && (
                                <span className="text-blue-700 flex items-center gap-0.5">
                                  • Seguro contra avarias
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-slate-900 font-mono block">
                            {opt.price === 0 ? (
                              <span className="text-emerald-700 font-bold uppercase text-[11px]">Grátis</span>
                            ) : (
                              `R$ ${opt.price.toFixed(2).replace('.', ',')}`
                            )}
                          </span>

                          {isSelected && (
                            <span className="text-[9px] font-black text-[#003882] uppercase tracking-wider block mt-1">
                              Selecionado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Packaging & Safety Disclaimer */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-[10.5px] text-slate-600">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-tight space-y-0.5">
                  <span className="font-bold text-slate-800 block">Embalagem Blindada Valdir Discos</span>
                  <p>
                    Postamos via agência dos Correios em caixa de papelão reforçado duplo, plástico bolha extra e cantoneiras rígidas. Seu vinil chega impecável!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Track Package */}
      {activeTab === 'track' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-600 leading-snug">
            Já comprou e tem o código de postagem dos Correios? Acompanhe o trajeto em tempo real direto da agência de Santa Maria/RS:
          </div>

          <form onSubmit={handleTrackSubmit} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código de Rastreamento (ex: NL123456789BR)"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono tracking-wider placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#003882]"
                maxLength={15}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#003882] hover:bg-[#002860] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>Rastrear</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#FED100]" />
              </button>
            </div>

            {trackingFeedback && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{trackingFeedback}</span>
              </p>
            )}
          </form>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 space-y-1">
            <span className="font-bold block flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-amber-700" />
              Dica Valdir Discos:
            </span>
            <p>
              O código de rastreamento é enviado automaticamente para o seu WhatsApp e e-mail assim que o pacote é postado na agência dos Correios de Santa Maria - RS.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

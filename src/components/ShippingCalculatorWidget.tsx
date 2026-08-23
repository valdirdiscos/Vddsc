import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Search, 
  Check, 
  Clock, 
  Store, 
  AlertCircle, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { calculateShippingOptions, fetchAddressByCep, ShippingOption, STORE_ORIGIN } from '../utils/shippingCalculator';

interface ShippingCalculatorWidgetProps {
  onSelectOption?: (option: ShippingOption) => void;
  selectedOptionId?: string;
  compact?: boolean;
}

export function ShippingCalculatorWidget({
  onSelectOption,
  selectedOptionId,
  compact = false
}: ShippingCalculatorWidgetProps) {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressInfo, setAddressInfo] = useState<{ city: string; uf: string; street?: string } | null>(null);
  const [options, setOptions] = useState<ShippingOption[] | null>(null);

  const formatCep = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    if (raw.length > 5) {
      return `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }
    return raw;
  };

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setError('Informe um CEP válido com 8 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchAddressByCep(cleanCep);
      if (!data) {
        // Fallback with default RS/Brazil calculation
        const fallbackOpts = calculateShippingOptions('SP', '', 1);
        setOptions(fallbackOpts);
        setAddressInfo({ city: 'Brasil', uf: 'BR' });
      } else {
        const city = data.localidade;
        const uf = data.uf;
        setAddressInfo({ city, uf, street: data.logradouro });
        const calculated = calculateShippingOptions(uf, city, 1);
        setOptions(calculated);
        if (onSelectOption && calculated.length > 0) {
          // Default to PAC or Pickup if local
          const defaultOpt = (city.toLowerCase().includes('santa maria') || uf === 'RS')
            ? calculated[0]
            : (calculated.find(o => o.id === 'correios_pac') || calculated[0]);
          onSelectOption(defaultOpt);
        }
      }
    } catch (err) {
      setError('Não foi possível calcular o frete agora.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl border ${compact ? 'p-3 bg-slate-50/80 border-slate-200' : 'p-4 bg-white border-slate-200 shadow-xs'} space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Truck className="h-4 w-4 text-amber-600" />
          <h4 className="text-xs font-bold text-slate-900">
            Calcular Frete e Prazo de Entrega
          </h4>
        </div>
        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          Origem: Santa Maria - RS
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleCalculate} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Digite seu CEP (ex: 97010-000)"
            value={cep}
            onChange={(e) => setCep(formatCep(e.target.value))}
            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
            maxLength={9}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-3.5 py-2 bg-slate-900 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-spin text-xs">⏳</span>
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          <span>Calcular</span>
        </button>
      </form>

      {error && (
        <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Results */}
      {addressInfo && options && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] text-slate-600 flex items-center gap-1 font-medium bg-emerald-50 text-emerald-900 p-2 rounded-lg border border-emerald-200">
            <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
            <span>Destino: <strong>{addressInfo.city} - {addressInfo.uf}</strong> {addressInfo.street ? `(${addressInfo.street})` : ''}</span>
          </div>

          <div className="space-y-1.5">
            {options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => onSelectOption && onSelectOption(opt)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                    onSelectOption ? 'cursor-pointer hover:border-amber-400' : ''
                  } ${
                    isSelected 
                      ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                    }`}>
                      {isSelected && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{opt.name}</span>
                        {opt.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {opt.description} • Prazo: {opt.estimatedDays}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 font-mono">
                      {opt.price === 0 ? (
                        <span className="text-emerald-700 font-bold uppercase text-[11px]">Grátis</span>
                      ) : (
                        `R$ ${opt.price.toFixed(2).replace('.', ',')}`
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

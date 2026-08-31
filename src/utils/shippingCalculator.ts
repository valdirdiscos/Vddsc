// Shipping rates and calculations for Valdir Discos
// Origin: Santa Maria - RS (CEP 97010-000)
import { 
  CorreiosCalculationResult, 
  CorreiosPackageSpecs, 
  CorreiosShippingOption, 
  calculateCorreiosRates, 
  estimatePackageSpecs,
  VALDIR_ORIGIN_CEP,
  VALDIR_ORIGIN_CITY,
  VALDIR_ORIGIN_STATE
} from './correiosMatrix';

export type { CorreiosPackageSpecs, CorreiosCalculationResult };

export interface ShippingOption extends CorreiosShippingOption {}

export interface CepAddress {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

// Santa Maria, RS Origin CEP
export const STORE_ORIGIN = {
  city: VALDIR_ORIGIN_CITY,
  state: VALDIR_ORIGIN_STATE,
  cep: VALDIR_ORIGIN_CEP,
  address: 'Santa Maria - Rio Grande do Sul (RS)'
};

/**
 * Fetch address details from ViaCEP with BrasilAPI fallback
 */
export async function fetchAddressByCep(cep: string): Promise<CepAddress | null> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  // 1. Try ViaCEP
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (!data.erro && data.uf) {
        return {
          cep: data.cep || cleanCep,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          localidade: data.localidade || '',
          uf: data.uf || ''
        };
      }
    }
  } catch (err) {
    console.warn('ViaCEP falhou ou demorou, tentando BrasilAPI...', err);
  }

  // 2. Fallback to BrasilAPI
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.state) {
        return {
          cep: data.cep || cleanCep,
          logradouro: data.street || '',
          bairro: data.neighborhood || '',
          localidade: data.city || '',
          uf: data.state || ''
        };
      }
    }
  } catch (err) {
    console.warn('BrasilAPI também indisponível:', err);
  }

  return null;
}

export interface CalculateShippingParams {
  cep: string;
  itemsCount?: number;
  format?: 'vinyl' | 'cd' | 'cassette' | 'tshirt' | 'mixed';
  declaredValue?: number;
}

/**
 * Integração completa com o frete dos Correios:
 * Tenta a API backend /api/shipping/calculate e caso offline calcula localmente pela Matriz Correios
 */
export async function calculateCorreiosShipping(
  params: CalculateShippingParams
): Promise<CorreiosCalculationResult | null> {
  const cleanCep = params.cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  const itemsCount = params.itemsCount || 1;
  const format = params.format || 'vinyl';
  const declaredValue = params.declaredValue || 0;

  // 1. Tenta a API do servidor
  try {
    const response = await fetch('/api/shipping/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cepDestino: cleanCep,
        itemsCount,
        format,
        declaredValue
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data: CorreiosCalculationResult = await response.json();
      if (data && data.options && data.options.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.info('Endpoint /api/shipping/calculate indisponível, usando motor local Correios...', err);
  }

  // 2. Fallback local: resolve endereço e calcula com a matriz oficial dos Correios
  const address = await fetchAddressByCep(cleanCep);
  const destinationUf = address?.uf || 'RS';
  const destinationCity = address?.localidade || 'Santa Maria';
  const packageSpecs = estimatePackageSpecs(itemsCount, format);

  const localResult = calculateCorreiosRates(
    destinationUf,
    destinationCity,
    cleanCep,
    packageSpecs,
    declaredValue
  );

  if (address) {
    localResult.destination = {
      cep: cleanCep,
      city: address.localidade,
      state: address.uf,
      neighborhood: address.bairro,
      street: address.logradouro,
      formatted: `${address.localidade} - ${address.uf}${address.bairro ? ` (${address.bairro})` : ''}`
    };
  }

  return localResult;
}

/**
 * Backward-compatible synchronous calculation
 */
export function calculateShippingOptions(
  uf: string = 'RS', 
  city: string = '', 
  cartWeightOrItems: number = 1
): ShippingOption[] {
  const packageSpecs = estimatePackageSpecs(cartWeightOrItems, 'vinyl');
  const result = calculateCorreiosRates(uf, city, '97010000', packageSpecs, 0);
  return result.options;
}

/**
 * Gera URL oficial de rastreamento dos Correios
 */
export function getCorreiosTrackingUrl(trackingCode: string): string {
  const clean = trackingCode.trim().toUpperCase();
  return `https://rastreamento.correios.com.br/app/index.php?codigo=${encodeURIComponent(clean)}`;
}

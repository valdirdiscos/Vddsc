// Shipping rates and calculations for Valdir Discos
// Origin: Santa Maria - RS (CEP 97010-000)

export interface ShippingOption {
  id: 'pickup' | 'local_express' | 'correios_mini' | 'correios_pac' | 'correios_sedex';
  name: string;
  carrier: string;
  description: string;
  price: number;
  estimatedDays: string;
  badge?: string;
}

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
  city: 'Santa Maria',
  state: 'RS',
  cep: '97010-000',
  address: 'Santa Maria - Rio Grande do Sul (RS)'
};

/**
 * Fetch address details from ViaCEP
 */
export async function fetchAddressByCep(cep: string): Promise<CepAddress | null> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return data;
  } catch (err) {
    console.warn('Erro ao consultar CEP:', err);
    return null;
  }
}

/**
 * Calculate shipping options based on destination State (UF) and city
 */
export function calculateShippingOptions(
  uf: string = 'RS', 
  city: string = '', 
  cartWeightOrItems: number = 1
): ShippingOption[] {
  const cleanUf = (uf || 'RS').trim().toUpperCase();
  const isSantaMaria = (city || '').toLowerCase().includes('santa maria') || cleanUf === 'RS' && (city || '').toLowerCase().includes('maria');
  const isRS = cleanUf === 'RS';
  const isSul = ['RS', 'SC', 'PR'].includes(cleanUf);
  const isSudeste = ['SP', 'RJ', 'MG', 'ES'].includes(cleanUf);
  const isCentroOeste = ['DF', 'GO', 'MT', 'MS'].includes(cleanUf);
  const isNordeste = ['BA', 'PE', 'CE', 'RN', 'PB', 'AL', 'SE', 'PI', 'MA'].includes(cleanUf);
  const isNorte = ['AM', 'PA', 'AC', 'RR', 'RO', 'AP', 'TO'].includes(cleanUf);

  const options: ShippingOption[] = [];

  // 1. Retirada no Balcão em Santa Maria - RS (Sempre disponível e Grátis)
  options.push({
    id: 'pickup',
    name: 'Retirada Grátis no Balcão',
    carrier: 'Valdir Discos',
    description: 'Retire diretamente na nossa loja física em Santa Maria - RS',
    price: 0,
    estimatedDays: 'Disponível no mesmo dia',
    badge: 'Grátis em Santa Maria / RS'
  });

  // 2. Entrega Local Santa Maria
  if (isSantaMaria || isRS) {
    options.push({
      id: 'local_express',
      name: 'Entrega Expressa Local (Motoboy)',
      carrier: 'Valdir Express Santa Maria',
      description: 'Entrega rápida em qualquer bairro de Santa Maria - RS',
      price: 12.00,
      estimatedDays: '1 a 2 horas (mesmo dia)',
      badge: 'Local Santa Maria'
    });
  }

  // 3. Mini Envios / Registro Módico (Compactos 7", CDs e Fitas)
  let miniPrice = 18.00;
  if (isSul) miniPrice = 16.00;
  else if (isSudeste) miniPrice = 19.00;
  else if (isNordeste || isNorte) miniPrice = 24.00;

  options.push({
    id: 'correios_mini',
    name: 'Registro Módico / Mini Envios',
    carrier: 'Correios Brasil',
    description: 'Opção econômica com rastreio direto de Santa Maria/RS para todo Brasil',
    price: miniPrice,
    estimatedDays: isSul ? '3 a 6 dias úteis' : '5 a 10 dias úteis',
    badge: 'Econômico'
  });

  // 4. PAC Correios (Embalagem reforçada para discos de vinil 12" LP)
  let pacPrice = 28.00;
  let pacDays = '4 a 8 dias úteis';

  if (isRS) {
    pacPrice = 22.00;
    pacDays = '2 a 4 dias úteis';
  } else if (isSul) {
    pacPrice = 26.00;
    pacDays = '3 a 6 dias úteis';
  } else if (isSudeste) {
    pacPrice = 32.00;
    pacDays = '5 a 8 dias úteis';
  } else if (isCentroOeste) {
    pacPrice = 36.00;
    pacDays = '6 a 9 dias úteis';
  } else if (isNordeste) {
    pacPrice = 42.00;
    pacDays = '8 a 12 dias úteis';
  } else if (isNorte) {
    pacPrice = 49.00;
    pacDays = '9 a 15 dias úteis';
  }

  options.push({
    id: 'correios_pac',
    name: 'Correios PAC Seguro Vinil',
    carrier: 'Correios Brasil',
    description: 'Caixa de papelão reforçada + plástico bolha + seguro contra avarias',
    price: pacPrice,
    estimatedDays: pacDays,
    badge: 'Mais Popular'
  });

  // 5. SEDEX Express Correios
  let sedexPrice = 48.00;
  let sedexDays = '1 a 3 dias úteis';

  if (isRS) {
    sedexPrice = 29.00;
    sedexDays = '1 a 2 dias úteis';
  } else if (isSul) {
    sedexPrice = 38.00;
    sedexDays = '1 a 3 dias úteis';
  } else if (isSudeste) {
    sedexPrice = 54.00;
    sedexDays = '2 a 4 dias úteis';
  } else if (isCentroOeste) {
    sedexPrice = 62.00;
    sedexDays = '2 a 4 dias úteis';
  } else if (isNordeste) {
    sedexPrice = 76.00;
    sedexDays = '3 a 5 dias úteis';
  } else if (isNorte) {
    sedexPrice = 88.00;
    sedexDays = '3 a 6 dias úteis';
  }

  options.push({
    id: 'correios_sedex',
    name: 'Correios SEDEX Prioritário',
    carrier: 'Correios Brasil',
    description: 'Despacho prioritário com máxima agilidade e rastreamento em tempo real',
    price: sedexPrice,
    estimatedDays: sedexDays,
    badge: 'Super Rápido'
  });

  return options;
}

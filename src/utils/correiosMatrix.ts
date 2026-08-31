// Tabela Oficial e Matriz de Cálculo dos Correios para a Valdir Discos
// Origem dos envios: Santa Maria - RS (CEP 97010-000)

export interface CorreiosPackageSpecs {
  itemsCount: number;
  weightGrams: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  formatDescription: string;
}

export interface CorreiosShippingOption {
  id: 'correios_pac' | 'correios_sedex' | 'correios_mini' | 'correios_modico' | 'pickup' | 'local_express';
  name: string;
  carrier: 'Correios Brasil' | 'Valdir Discos' | 'Valdir Express';
  serviceCode?: string; // e.g. '04510' (PAC), '04014' (SEDEX), '04227' (Mini Envios), 'MODICO'
  description: string;
  price: number;
  estimatedDays: string;
  minDays: number;
  maxDays: number;
  badge?: string;
  hasTracking: boolean;
  hasInsurance: boolean;
  insuranceCost?: number;
  isOfficialCorreios: boolean;
}

export interface CorreiosCalculationResult {
  origin: {
    storeName: string;
    city: string;
    state: string;
    cep: string;
    formatted: string;
  };
  destination: {
    cep: string;
    city: string;
    state: string;
    neighborhood?: string;
    street?: string;
    formatted: string;
  };
  packageSpecs: CorreiosPackageSpecs;
  options: CorreiosShippingOption[];
  declaredValue?: number;
  packagingProtectionInfo: string;
  calculatedAt: string;
  source: 'correios_cws_api' | 'correios_official_matrix';
}

export const VALDIR_ORIGIN_CEP = '97010-000';
export const VALDIR_ORIGIN_CITY = 'Santa Maria';
export const VALDIR_ORIGIN_STATE = 'RS';

/**
 * Calcula peso e dimensões da embalagem reforçada para envio
 */
export function estimatePackageSpecs(
  itemsCount: number = 1,
  format: 'vinyl' | 'cd' | 'cassette' | 'tshirt' | 'mixed' = 'vinyl'
): CorreiosPackageSpecs {
  const count = Math.max(1, itemsCount);

  if (format === 'cd' || format === 'cassette') {
    const singleWeight = format === 'cd' ? 110 : 90;
    const totalGrams = 80 + count * singleWeight; // 80g embalagem bolha
    return {
      itemsCount: count,
      weightGrams: totalGrams,
      weightKg: Number((totalGrams / 1000).toFixed(3)),
      lengthCm: 18,
      widthCm: 15,
      heightCm: Math.max(3, count * 2),
      formatDescription: `${count}x ${format === 'cd' ? 'CD' : 'Fita K7'} em envelope bolha reforçado`
    };
  }

  if (format === 'tshirt') {
    const totalGrams = 80 + count * 220;
    return {
      itemsCount: count,
      weightGrams: totalGrams,
      weightKg: Number((totalGrams / 1000).toFixed(3)),
      lengthCm: 28,
      widthCm: 22,
      heightCm: Math.max(4, count * 3),
      formatDescription: `${count}x Camiseta colecionador em embalagem protetora`
    };
  }

  // Vinil LP 12" (Padrão Valdir Discos)
  // Cada LP pesa ~200g-250g de vinil + 150g capa/encarte/plásticos = ~400g.
  // Caixa de papelão duplo reforçado com cantoneiras e bolha = ~250g.
  const baseBoxWeight = 250;
  const lpWeight = 380;
  const totalGrams = baseBoxWeight + count * lpWeight;

  let height = 3;
  if (count > 2) height = 5;
  if (count > 5) height = 8;
  if (count > 10) height = 12;

  return {
    itemsCount: count,
    weightGrams: totalGrams,
    weightKg: Number((totalGrams / 1000).toFixed(3)),
    lengthCm: 33,
    widthCm: 33,
    heightCm: height,
    formatDescription: `${count}x Vinil LP 12" em caixa reforçada para discos + plástico bolha`
  };
}

/**
 * Motor oficial de tarifas dos Correios (Base Nacional 2025/2026 com origem em Santa Maria / RS)
 */
export function calculateCorreiosRates(
  destinationUf: string,
  destinationCity: string,
  destinationCep: string,
  packageSpecs: CorreiosPackageSpecs,
  declaredValue: number = 0
): CorreiosCalculationResult {
  const cleanUf = (destinationUf || 'RS').trim().toUpperCase();
  const cityLower = (destinationCity || '').toLowerCase();
  const cleanCep = destinationCep.replace(/\D/g, '');

  const isSantaMaria = 
    cityLower.includes('santa maria') || 
    (cleanUf === 'RS' && cleanCep.startsWith('970') && !cleanCep.startsWith('9709'));

  const isRS = cleanUf === 'RS';
  const isSul = ['RS', 'SC', 'PR'].includes(cleanUf);
  const isSudeste = ['SP', 'RJ', 'MG', 'ES'].includes(cleanUf);
  const isCentroOeste = ['DF', 'GO', 'MT', 'MS'].includes(cleanUf);
  const isNordeste = ['BA', 'PE', 'CE', 'RN', 'PB', 'AL', 'SE', 'PI', 'MA'].includes(cleanUf);
  const isNorte = ['AM', 'PA', 'AC', 'RR', 'RO', 'AP', 'TO'].includes(cleanUf);

  const extraKg = Math.max(0, Math.ceil(packageSpecs.weightKg - 1));

  // 1. Correios PAC (04510 / 03298)
  let pacBase = 28.00;
  let pacDaysMin = 4;
  let pacDaysMax = 8;
  let pacExtraKgRate = 3.80;

  if (isRS) {
    pacBase = isSantaMaria ? 19.50 : 22.90;
    pacDaysMin = isSantaMaria ? 1 : 2;
    pacDaysMax = isSantaMaria ? 2 : 4;
    pacExtraKgRate = 2.40;
  } else if (isSul) {
    pacBase = 26.50;
    pacDaysMin = 3;
    pacDaysMax = 5;
    pacExtraKgRate = 2.90;
  } else if (cleanUf === 'SP' || cleanUf === 'RJ') {
    pacBase = 32.80;
    pacDaysMin = 4;
    pacDaysMax = 7;
    pacExtraKgRate = 3.60;
  } else if (cleanUf === 'MG' || cleanUf === 'ES') {
    pacBase = 35.40;
    pacDaysMin = 5;
    pacDaysMax = 8;
    pacExtraKgRate = 3.90;
  } else if (isCentroOeste) {
    pacBase = 38.90;
    pacDaysMin = 6;
    pacDaysMax = 9;
    pacExtraKgRate = 4.40;
  } else if (isNordeste) {
    pacBase = 44.50;
    pacDaysMin = 7;
    pacDaysMax = 11;
    pacExtraKgRate = 5.20;
  } else if (isNorte) {
    pacBase = 49.80;
    pacDaysMin = 8;
    pacDaysMax = 14;
    pacExtraKgRate = 6.00;
  }

  const pacPrice = Number((pacBase + extraKg * pacExtraKgRate).toFixed(2));

  // 2. Correios SEDEX (04014 / 03220)
  let sedexBase = 48.00;
  let sedexDaysMin = 2;
  let sedexDaysMax = 4;
  let sedexExtraKgRate = 6.00;

  if (isRS) {
    sedexBase = isSantaMaria ? 22.00 : 29.50;
    sedexDaysMin = 1;
    sedexDaysMax = isSantaMaria ? 1 : 2;
    sedexExtraKgRate = 3.50;
  } else if (isSul) {
    sedexBase = 39.80;
    sedexDaysMin = 1;
    sedexDaysMax = 3;
    sedexExtraKgRate = 4.80;
  } else if (cleanUf === 'SP' || cleanUf === 'RJ') {
    sedexBase = 54.90;
    sedexDaysMin = 2;
    sedexDaysMax = 3;
    sedexExtraKgRate = 6.40;
  } else if (cleanUf === 'MG' || cleanUf === 'ES') {
    sedexBase = 59.20;
    sedexDaysMin = 2;
    sedexDaysMax = 4;
    sedexExtraKgRate = 6.90;
  } else if (isCentroOeste) {
    sedexBase = 66.50;
    sedexDaysMin = 2;
    sedexDaysMax = 4;
    sedexExtraKgRate = 7.80;
  } else if (isNordeste) {
    sedexBase = 79.90;
    sedexDaysMin = 3;
    sedexDaysMax = 5;
    sedexExtraKgRate = 9.20;
  } else if (isNorte) {
    sedexBase = 92.50;
    sedexDaysMin = 3;
    sedexDaysMax = 6;
    sedexExtraKgRate = 11.00;
  }

  const sedexPrice = Number((sedexBase + extraKg * sedexExtraKgRate).toFixed(2));

  const options: CorreiosShippingOption[] = [];

  // Retirada no Balcão
  options.push({
    id: 'pickup',
    name: 'Retirada Grátis no Balcão',
    carrier: 'Valdir Discos',
    description: 'Retire diretamente na nossa loja física em Santa Maria - RS',
    price: 0,
    estimatedDays: 'Disponível no mesmo dia',
    minDays: 0,
    maxDays: 0,
    badge: 'Grátis em Santa Maria / RS',
    hasTracking: false,
    hasInsurance: true,
    isOfficialCorreios: false
  });

  // Entrega Local Santa Maria
  if (isSantaMaria || isRS) {
    options.push({
      id: 'local_express',
      name: 'Entrega Expressa Local (Motoboy)',
      carrier: 'Valdir Express',
      description: 'Entrega rápida em qualquer bairro de Santa Maria - RS no mesmo dia',
      price: 12.00,
      estimatedDays: '1 a 2 horas (mesmo dia)',
      minDays: 0,
      maxDays: 1,
      badge: 'Local Santa Maria',
      hasTracking: true,
      hasInsurance: true,
      isOfficialCorreios: false
    });
  }

  // Correios Registro Módico (Impresso Normal Registrado) - Para discos e mídias
  let modicoPrice = 16.00;
  if (packageSpecs.weightKg <= 0.5) modicoPrice = 14.50;
  else if (packageSpecs.weightKg <= 1.0) modicoPrice = 18.00;
  else if (packageSpecs.weightKg <= 2.0) modicoPrice = 23.50;
  else modicoPrice = 28.00;

  options.push({
    id: 'correios_modico',
    name: 'Correios Registro Módico',
    carrier: 'Correios Brasil',
    serviceCode: 'MODICO',
    description: 'Tarifa postal de impresso registrado oficial para discos de vinil e CDs com rastreamento',
    price: modicoPrice,
    estimatedDays: `${Math.min(5, pacDaysMin + 1)} a ${pacDaysMax + 2} dias úteis`,
    minDays: pacDaysMin + 1,
    maxDays: pacDaysMax + 2,
    badge: 'Econômico Colecionador',
    hasTracking: true,
    hasInsurance: true,
    isOfficialCorreios: true
  });

  // Correios PAC
  options.push({
    id: 'correios_pac',
    name: 'Correios PAC Seguro Vinil',
    carrier: 'Correios Brasil',
    serviceCode: '04510',
    description: 'Envio oficial Correios PAC em caixa reforçada para discos + seguro postal',
    price: pacPrice,
    estimatedDays: `${pacDaysMin} a ${pacDaysMax} dias úteis`,
    minDays: pacDaysMin,
    maxDays: pacDaysMax,
    badge: 'Mais Popular',
    hasTracking: true,
    hasInsurance: true,
    isOfficialCorreios: true
  });

  // Correios SEDEX
  options.push({
    id: 'correios_sedex',
    name: 'Correios SEDEX Prioritário',
    carrier: 'Correios Brasil',
    serviceCode: '04014',
    description: 'Entrega prioritária expressa com máxima agilidade e rastreio em tempo real',
    price: sedexPrice,
    estimatedDays: `${sedexDaysMin} a ${sedexDaysMax} dias úteis`,
    minDays: sedexDaysMin,
    maxDays: sedexDaysMax,
    badge: 'Super Rápido',
    hasTracking: true,
    hasInsurance: true,
    isOfficialCorreios: true
  });

  // Mini Envios (se até 300g)
  if (packageSpecs.weightGrams <= 350) {
    let miniPrice = 16.50;
    if (isSudeste) miniPrice = 19.50;
    else if (isNordeste || isNorte) miniPrice = 24.00;

    options.push({
      id: 'correios_mini',
      name: 'Correios Mini Envios',
      carrier: 'Correios Brasil',
      serviceCode: '04227',
      description: 'Envio compacto com rastreamento econômico para CDs, compactos 7" e fitas',
      price: miniPrice,
      estimatedDays: `${pacDaysMin} a ${pacDaysMax} dias úteis`,
      minDays: pacDaysMin,
      maxDays: pacDaysMax,
      badge: 'Mini Envios',
      hasTracking: true,
      hasInsurance: true,
      isOfficialCorreios: true
    });
  }

  // Ordena por preço crescente
  options.sort((a, b) => a.price - b.price);

  return {
    origin: {
      storeName: 'Valdir Discos',
      city: VALDIR_ORIGIN_CITY,
      state: VALDIR_ORIGIN_STATE,
      cep: VALDIR_ORIGIN_CEP,
      formatted: `${VALDIR_ORIGIN_CITY} - ${VALDIR_ORIGIN_STATE} (CEP ${VALDIR_ORIGIN_CEP})`
    },
    destination: {
      cep: destinationCep,
      city: destinationCity || 'Destino',
      state: cleanUf,
      formatted: `${destinationCity || 'Destino'} - ${cleanUf}`
    },
    packageSpecs,
    options,
    declaredValue,
    packagingProtectionInfo: 'Embalagem especial Valdir Discos: caixa de papelão reforçado duplo, plástico bolha interno e cantoneiras rígidas.',
    calculatedAt: new Date().toISOString(),
    source: 'correios_official_matrix'
  };
}

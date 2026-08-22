import { TShirtProduct, TShirtColor } from '../types';
import { LOGO_BADGE, LOGO_COLOR, LOGO_BW } from '../assets/logos';

export const TSHIRT_COLORS: TShirtColor[] = [
  {
    id: 'black',
    name: 'Preto Vintage',
    hex: '#18181b',
    bgClass: 'bg-zinc-900',
    borderClass: 'border-zinc-700'
  },
  {
    id: 'offwhite',
    name: 'Off-White / Cru',
    hex: '#f5f3ec',
    bgClass: 'bg-[#f5f3ec]',
    borderClass: 'border-amber-200'
  },
  {
    id: 'sand',
    name: 'Bege Areia Retrô',
    hex: '#d8c7a6',
    bgClass: 'bg-[#d8c7a6]',
    borderClass: 'border-amber-300'
  },
  {
    id: 'terracotta',
    name: 'Vinho / Terracota',
    hex: '#782329',
    bgClass: 'bg-[#782329]',
    borderClass: 'border-rose-900'
  },
  {
    id: 'moss',
    name: 'Verde Musgo',
    hex: '#2e4334',
    bgClass: 'bg-[#2e4334]',
    borderClass: 'border-emerald-900'
  },
  {
    id: 'navy',
    name: 'Azul Petróleo',
    hex: '#1e293b',
    bgClass: 'bg-slate-800',
    borderClass: 'border-slate-700'
  }
];

export const TSHIRT_PRODUCTS: TShirtProduct[] = [
  {
    id: 'tshirt_selo_oficial',
    name: 'Camiseta Selo Retrô - "Disco é Cultura"',
    subtitle: 'Estampa DTF do Selo Oficial Valdir Discos',
    description: 'Camiseta oficial da loja Valdir Discos com o lema eterno "Disco é Cultura". Estampa em filme DTF (Direct to Film) de alta resolução, cores vivas e durabilidade extrema.',
    price: 79.90,
    originalPrice: 99.90,
    category: 'selo_oficial',
    colors: [TSHIRT_COLORS[0], TSHIRT_COLORS[1], TSHIRT_COLORS[2], TSHIRT_COLORS[3], TSHIRT_COLORS[4]],
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
    models: ['Unissex Tradicional', 'Baby Look Feminina'],
    image: LOGO_BADGE,
    badge: 'Estampa DTF • Oficial',
    features: [
      '100% Algodão Fio 30.1 Penteado',
      'Estampa DTF Alta Definição (não racha nem desbota)',
      'Gola Canelada com reforço ombro a ombro',
      'Toque macio e caimento perfeito'
    ],
    fabricInfo: 'Gramatura de 165g/m² com toque aveludado e costuras reforçadas.',
    inStock: true
  },
  {
    id: 'tshirt_mascote_color',
    name: 'Camiseta Mascote Valdir Discos - Color',
    subtitle: 'Estampa DTF Colorida do Mascote Colecionador',
    description: 'Estampa colorida do Mascote Valdir carregando seu vinil dourado. Impressão DTF (Direct to Film) com cores fiéis, resistentes a lavagens frequentes.',
    price: 84.90,
    originalPrice: 104.90,
    category: 'selo_oficial',
    colors: [TSHIRT_COLORS[0], TSHIRT_COLORS[1], TSHIRT_COLORS[2], TSHIRT_COLORS[5]],
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
    models: ['Unissex Tradicional', 'Baby Look Feminina'],
    image: LOGO_COLOR,
    badge: 'Estampa DTF Color',
    features: [
      '100% Algodão Penteado Premium',
      'Estampa DTF em Alta Resolução',
      'Costura Dupla Reforçada',
      'Não encolhe após lavagem'
    ],
    fabricInfo: 'Algodão fio 30.1 penteado nacional, toque suave e respirável.',
    inStock: true
  },
  {
    id: 'tshirt_monochrome_retro',
    name: 'Camiseta Valdir Discos - Traço Retrô',
    subtitle: 'Estampa DTF Minimalista em Linhas Vintage',
    description: 'Logo clássica em traçado retrô vintage. Estampa DTF de alta definição com toque suave sobre algodão penteado nobre.',
    price: 79.90,
    originalPrice: 94.90,
    category: 'retro_dj',
    colors: [TSHIRT_COLORS[0], TSHIRT_COLORS[1], TSHIRT_COLORS[4], TSHIRT_COLORS[5]],
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
    models: ['Unissex Tradicional', 'Baby Look Feminina'],
    image: LOGO_BW,
    badge: 'Estampa DTF Retrô',
    features: [
      'Algodão 100% Penteado 30.1',
      'Estampa DTF Monocromática de Alta Precisão',
      'Corte Confortável e macio',
      'Gola Reforçada anti-deformação'
    ],
    fabricInfo: 'Tecido premium com tingimento reativo que preserva o tom escuro profundo.',
    inStock: true
  },
  {
    id: 'tshirt_baile_black',
    name: 'Camiseta Baile Black & Samba-Soul 70s',
    subtitle: 'Estampa DTF Tributo aos Bailes de Vinil',
    description: 'Inspirada nos clássicos bailes de Soul, Funk e Samba-Rock dos anos 70 e 80. Estampa DTF de altíssima definição sobre algodão penteado premium.',
    price: 89.90,
    originalPrice: 109.90,
    category: 'mpb_brasil',
    colors: [TSHIRT_COLORS[0], TSHIRT_COLORS[3], TSHIRT_COLORS[2]],
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
    models: ['Unissex Tradicional', 'Baby Look Feminina'],
    image: LOGO_BADGE,
    badge: 'Estampa DTF • Especial',
    features: [
      'Algodão 100% Penteado Nobre',
      'Estampa DTF com Detalhes Nítidos',
      'Acabamento com costura ombro a ombro',
      'Etiqueta estampada para máximo conforto'
    ],
    fabricInfo: 'Fio penteado 30.1 de alta torção, toque macio.',
    inStock: true
  },
  {
    id: 'tshirt_hifi_turntable',
    name: 'Camiseta Hi-Fi Turntable 33 ⅓ RPM',
    subtitle: 'Estampa DTF Toca-Discos & Cultura Analógica',
    description: 'Traçado artístico do toca-discos de alta fidelidade e tipografia analógica. Estampa DTF ultra durável com toque macio.',
    price: 84.90,
    originalPrice: 99.90,
    category: 'retro_dj',
    colors: [TSHIRT_COLORS[0], TSHIRT_COLORS[1], TSHIRT_COLORS[5]],
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
    models: ['Unissex Tradicional', 'Baby Look Feminina'],
    image: LOGO_BW,
    badge: 'Estampa DTF Hi-Fi',
    features: [
      '100% Algodão Penteado Premium',
      'Estampa DTF de Alta Resolução',
      'Modelagem Streetwear Confortável',
      'Alta durabilidade em lavagens'
    ],
    fabricInfo: '100% algodão nacional selecionado com toque aveludado.',
    inStock: true
  },
  {
    id: 'tshirt_brasil_tropic',
    name: 'Camiseta Brasilidades & MPB de Ouro',
    subtitle: 'Estampa DTF Tributo à Música Brasileira',
    description: 'A riqueza da música brasileira estampada com orgulho. Estampa DTF com cores vivas e alta resistência sobre 100% algodão penteado.',
    price: 79.90,
    originalPrice: 94.90,
    category: 'mpb_brasil',
    colors: [TSHIRT_COLORS[1], TSHIRT_COLORS[2], TSHIRT_COLORS[4], TSHIRT_COLORS[0]],
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
    models: ['Unissex Tradicional', 'Baby Look Feminina'],
    image: LOGO_COLOR,
    badge: 'Estampa DTF MPB',
    features: [
      '100% Algodão Penteado 30.1',
      'Estampa DTF Colorida Alta Definição',
      'Toque Macio e Aveludado',
      'Lavagem anti-encolhimento'
    ],
    fabricInfo: 'Fio penteado 30.1 macio, leve e de alta durabilidade.',
    inStock: true
  }
];

export interface SizeMeasurement {
  size: string;
  chest: number; // largura do tórax em cm
  length: number; // comprimento em cm
  sleeve: number; // manga em cm
}

export const SIZE_CHART_UNISSEX: SizeMeasurement[] = [
  { size: 'P', chest: 50, length: 68, sleeve: 21 },
  { size: 'M', chest: 52, length: 70, sleeve: 22 },
  { size: 'G', chest: 55, length: 74, sleeve: 23 },
  { size: 'GG', chest: 58, length: 78, sleeve: 24 },
  { size: 'XGG', chest: 62, length: 82, sleeve: 25 }
];

export const SIZE_CHART_BABYLOOK: SizeMeasurement[] = [
  { size: 'P', chest: 42, length: 58, sleeve: 14 },
  { size: 'M', chest: 45, length: 60, sleeve: 15 },
  { size: 'G', chest: 48, length: 63, sleeve: 16 },
  { size: 'GG', chest: 51, length: 66, sleeve: 17 }
];

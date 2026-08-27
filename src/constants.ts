/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ConditionOption {
  code: string;
  name: string;
  description: string;
  vibe: string; // Brief visual badge color code
}

export interface ConditionOption {
  code: string;
  name: string;
  description: string;
  vibe: string; // Brief visual badge color code
}

export const GOLDMINE_VINYL_MEDIA: ConditionOption[] = [
  {
    code: 'M',
    name: 'Mint (M) - Vinil',
    description: 'Novo/Lacrado. Absolutamente perfeito em todos os aspectos. Disco nunca tocado, sem qualquer sinal de uso.',
    vibe: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    code: 'NM',
    name: 'Near Mint (NM) - Vinil',
    description: 'Quase Perfeito. Vinil brilhante, sem marcas ou riscos visíveis sob luz forte direta.',
    vibe: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  {
    code: 'EX',
    name: 'Excellent (EX / VG++) - Vinil',
    description: 'Excelente. Apenas riscos de papel (hairlines) superficiais extremamente sutis que não afetam em nada a reprodução silenciosa.',
    vibe: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  {
    code: 'VG+',
    name: 'Very Good Plus (VG+) - Vinil',
    description: 'Muito Bom Estado. Marcas superficiais leves (hairlines/scuffs) de uso, com ruído de fundo nulo ou quase imperceptível.',
    vibe: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    code: 'VG',
    name: 'Very Good (VG) - Vinil',
    description: 'Bom Estado. Apresenta riscos visíveis e chiado suave ou estalos leves em trechos silenciosos, mas toca totalmente sem pular.',
    vibe: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    code: 'G+',
    name: 'Good Plus (G+) - Vinil',
    description: 'Regular. Bastante tocado, sem brilho original, com estalos e chiados contínuos que podem sobressair, mas toca sem pular.',
    vibe: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  {
    code: 'G',
    name: 'Good (G) - Vinil',
    description: 'Bastante Desgastado. Toca com ruídos constantes de agulha, mas sem pular ou travar.',
    vibe: 'bg-red-50 text-red-700 border-red-200'
  },
  {
    code: 'F/P',
    name: 'Fair / Poor (F/P) - Vinil',
    description: 'Ruim. Disco severamente riscado que pode pular, travar ou repetir faixas. Indicado apenas para decoração ou acervo histórico.',
    vibe: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  {
    code: 'SEM_DISCO',
    name: 'Sem Disco / Apenas Capa (Mídia Ausente)',
    description: 'Atenção: NÃO acompanha o disco de vinil. Anúncio referente exclusivamente à capa / encarte original.',
    vibe: 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
  }
];

export const GOLDMINE_VINYL_SLEEVE: ConditionOption[] = [
  {
    code: 'M',
    name: 'Mint (M) - Capa',
    description: 'Perfeita. Capa absolutamente nova, sem dobras, amassados, marcas de anel ou desgaste de borda.',
    vibe: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    code: 'NM',
    name: 'Near Mint (NM) - Capa',
    description: 'Quase Impecável. Sem marcas visíveis de anel (ringwear), lombada perfeitamente legível, sem vincos ou escritas.',
    vibe: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  {
    code: 'EX',
    name: 'Excellent (EX / VG++) - Capa',
    description: 'Excelente. Capa firme e muito bem preservada, com sinais mínimos de armazenamento nas quinas. Sem rasgos ou assinaturas.',
    vibe: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  {
    code: 'VG+',
    name: 'Very Good Plus (VG+) - Capa',
    description: 'Muito Bom Estado. Inteira, com desgaste sutil nas pontas, quinas ou leve marca de anel/rubrica discreta.',
    vibe: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    code: 'VG',
    name: 'Very Good (VG) - Capa',
    description: 'Bom Estado. Desgaste moderado nas quinas/bordas, marca de anel nítida, pequenas assinaturas, carimbos ou dobras.',
    vibe: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    code: 'G+',
    name: 'Good Plus (G+) - Capa',
    description: 'Regular. Capa bem gasta, costuras ou bordas levemente abertas, marcas severas de anel ou rasgos leves.',
    vibe: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  {
    code: 'G',
    name: 'Good (G) - Capa',
    description: 'Bastante Desgastada. Capa com desgastes severos, fitas de reparo, rasgos médios ou muito amarelada.',
    vibe: 'bg-red-50 text-red-700 border-red-200'
  },
  {
    code: 'F/P',
    name: 'Fair / Poor (F/P) - Capa',
    description: 'Ruim. Capa muito danificada, incompleta, descolada, mofada ou com grandes partes rasgadas.',
    vibe: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  {
    code: 'SEM_CAPA',
    name: 'Sem Capa / Apenas Disco (Capa Genérica)',
    description: 'Atenção: NÃO acompanha a capa original. O disco é enviado em envelope/capa de proteção genérica.',
    vibe: 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
  }
];

export const GOLDMINE_CD_MEDIA: ConditionOption[] = [
  {
    code: 'M',
    name: 'Mint (M) - CD',
    description: 'Novo/Lacrado. CD absolutamente perfeito, sem qualquer risco, marca de dedo ou sinal de uso.',
    vibe: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    code: 'NM',
    name: 'Near Mint (NM) - CD',
    description: 'Quase Perfeito. Mídia brilhante como nova, sem qualquer marca ou risco na superfície legível de leitura.',
    vibe: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  {
    code: 'EX',
    name: 'Excellent (EX / VG++) - CD',
    description: 'Excelente. Pouquíssimas marcas superficiais extremamente finas e localizadas que não afetam em nada a reprodução digital.',
    vibe: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  {
    code: 'VG+',
    name: 'Very Good Plus (VG+) - CD',
    description: 'Muito Bom Estado. Poucos riscos superficiais leves de manuseio. Toca perfeitamente do início ao fim sem saltar.',
    vibe: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    code: 'VG',
    name: 'Very Good (VG) - CD',
    description: 'Bom Estado. Vários riscos superficiais visíveis, mas foi testado e toca 100% sem pular em aparelhos convencionais.',
    vibe: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    code: 'G+',
    name: 'Good Plus (G+) - CD',
    description: 'Regular. Superfície bastante riscada, mas lida pelo leitor. Pode apresentar problemas de leitura em aparelhos mais sensíveis.',
    vibe: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  {
    code: 'G',
    name: 'Good (G) - CD',
    description: 'Bastante Desgastado. Muito riscado na superfície óptica, pode sofrer travamentos ou falhas de leitura dependendo do reprodutor.',
    vibe: 'bg-red-50 text-red-700 border-red-200'
  },
  {
    code: 'F/P',
    name: 'Fair / Poor (F/P) - CD',
    description: 'Ruim. Mídia severamente danificada, com furos na camada reflexiva de alumínio (laser rot) ou trincas. Não é lido ou pula constantemente.',
    vibe: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  {
    code: 'SEM_DISCO',
    name: 'Sem CD/DVD / Apenas Encarte e Caixa',
    description: 'Atenção: NÃO acompanha a mídia óptica CD/DVD. Anúncio referente exclusivamente à caixinha e encarte original.',
    vibe: 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
  }
];

export const GOLDMINE_CD_SLEEVE: ConditionOption[] = [
  {
    code: 'M',
    name: 'Mint (M) - Encarte/Estojo',
    description: 'Novo/Lacrado. Encarte (booklet) perfeito, sem marcas. Caixa de acrílico original intocada e brilhante.',
    vibe: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    code: 'NM',
    name: 'Near Mint (NM) - Encarte/Estojo',
    description: 'Quase Perfeito. Encarte impecável, sem marcas de dente da caixinha (case dimples), dobras ou assinaturas. Estojo limpo.',
    vibe: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  {
    code: 'EX',
    name: 'Excellent (EX / VG++) - Encarte/Estojo',
    description: 'Excelente. Encarte muito bem preservado, com marcas mínimas de manuseio ou levíssima marca de dente do estojo.',
    vibe: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  {
    code: 'VG+',
    name: 'Very Good Plus (VG+) - Encarte/Estojo',
    description: 'Muito Bom Estado. Encarte íntegro, mas com marcas leves de dente da caixinha ou leve amarelado natural do papel.',
    vibe: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    code: 'VG',
    name: 'Very Good (VG) - Encarte/Estojo',
    description: 'Bom Estado. Encarte com dobras visíveis, marcas de dentes acentuadas, pequenas assinaturas ou caixinha de acrílico trincada/riscada.',
    vibe: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    code: 'G+',
    name: 'Good Plus (G+) - Encarte/Estojo',
    description: 'Regular. Encarte bem gasto, amarelado, com manchas de umidade ou pequenos rasgos. Estojo de acrílico quebrado.',
    vibe: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  {
    code: 'G',
    name: 'Good (G) - Encarte/Estojo',
    description: 'Bastante Desgastado. Encarte muito danificado, colado ou com rasgos médios. Peça de reposição ou caixa quebrada.',
    vibe: 'bg-red-50 text-red-700 border-red-200'
  },
  {
    code: 'F/P',
    name: 'Fair / Poor (F/P) - Encarte/Estojo',
    description: 'Ruim. Encarte incompleto, rasgado ou colado de forma irrecuperável. Estojo destruído, quebrado ou ausente.',
    vibe: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  {
    code: 'SEM_CAPA',
    name: 'Sem Encarte/Capa / Apenas Mídia (Estojo Simples)',
    description: 'Atenção: NÃO acompanha o encarte original/booklet. Enviado apenas a mídia em estojo ou envelope de proteção.',
    vibe: 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
  }
];

// Fallback legacy array to keep compatibility for imports that expect GOLDMINE_CONDITIONS
export const GOLDMINE_CONDITIONS: ConditionOption[] = GOLDMINE_VINYL_MEDIA;

export const FORMAT_TYPES = [
  { id: 'vinyl', label: 'Disco de Vinil (LP / Single)', icon: 'Disc' },
  { id: 'cd', label: 'CD de Música', icon: 'Music' },
  { id: 'dvd', label: 'DVD de Música', icon: 'Video' },
  { id: 'other', label: 'Outro (Fita Cassete, Box Set)', icon: 'FileAudio' }
];

export const OFFICIAL_MARKETPLACE_LINKS = {
  shopee: {
    id: 'shopee',
    name: 'Shopee',
    url: 'https://shopee.com.br/valdirdiscos',
    label: 'Shopee Oficial',
    badge: 'Loja Oficial',
    bgColor: 'bg-[#ee4d2d]',
    textColor: 'text-[#ee4d2d]',
    lightBg: 'bg-orange-50',
    border: 'border-orange-200 hover:border-orange-500',
    description: 'Frete grátis com cupons no app da Shopee e garantia de entrega.'
  },
  mercadolivre: {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    url: 'https://lista.mercadolivre.com.br/_CustId_valdirdiscos',
    label: 'Mercado Livre',
    badge: 'MercadoLíder',
    bgColor: 'bg-[#ffe600]',
    textColor: 'text-amber-600',
    lightBg: 'bg-yellow-50',
    border: 'border-yellow-200 hover:border-yellow-500',
    description: 'Envios rápidos pelo Mercado Envios com proteção total ao comprador.'
  },
  discogs: {
    id: 'discogs',
    name: 'Discogs',
    url: 'https://www.discogs.com/seller/valdirdiscos',
    label: 'Discogs Marketplace',
    badge: 'Seller Oficial',
    bgColor: 'bg-[#222222]',
    textColor: 'text-slate-900',
    lightBg: 'bg-slate-100',
    border: 'border-slate-300 hover:border-slate-800',
    description: 'Catálogo de discos internacional com graduação rigorosa Goldmine.'
  }
};

export const DEFAULT_PRICING = {
  costPrice: 0,
  basePriceBrl: 80,
  exchangeRate: 5.60,
  useExchange: false,
  shopeeCommissionPercent: 14,
  shopeeFixedFee: 4.00,
  packagingCost: 4.00,
  profitMarginPercent: 20,
  mode: 'direct' as const,
  directPrice: 80
};

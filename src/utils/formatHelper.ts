import { SavedListing, DiscogsRelease } from '../types';

export interface ListingFormatInfo {
  type: 'vinyl_lp' | 'vinyl_single' | 'vinyl_10' | 'cd' | 'dvd' | 'cassette' | 'other';
  badgeLabel: string;
  fullLabel: string;
  badgeBg: string;
  badgeText: string;
  iconEmoji: string;
}

/**
 * Accurately analyzes release data, formats, descriptions, notes, and title
 * to determine if the item is a CD, DVD, Cassette, 7" Single, 10" Vinyl, or 12" LP.
 */
export function getListingFormatInfo(listingOrRelease?: SavedListing | DiscogsRelease | null): ListingFormatInfo {
  if (!listingOrRelease) {
    return {
      type: 'vinyl_lp',
      badgeLabel: 'LP 12"',
      fullLabel: 'Vinil LP 12" (33 ⅓ RPM)',
      badgeBg: 'bg-slate-950/85 text-white backdrop-blur-xs',
      badgeText: 'LP 12"',
      iconEmoji: '⚫'
    };
  }

  const release: DiscogsRelease = 'release' in listingOrRelease ? listingOrRelease.release : listingOrRelease;
  const formats = release.formats || [];
  
  const fmtNames = formats.map(f => (f.name || '').toLowerCase()).join(' ');
  const fmtDescs = formats.flatMap(f => f.descriptions || []).map(d => d.toLowerCase()).join(' ');
  const allFmtText = `${fmtNames} ${fmtDescs}`.trim();
  
  const title = (release.title || '').toLowerCase();
  const notes = (release.notes || '').toLowerCase();
  const fullText = `${allFmtText} ${title} ${notes}`;

  // 1. CD check
  const isExplicitCd = 
    fmtNames.includes('cd') ||
    fmtDescs.includes('cd') ||
    allFmtText.includes('compact disc') ||
    /\bcd\b|\bcds\b|\bcompact disc\b/i.test(fullText);

  // 2. DVD check
  const isExplicitDvd = 
    fmtNames.includes('dvd') ||
    fmtDescs.includes('dvd') ||
    allFmtText.includes('dvd-video') ||
    /\bdvd\b|\bdvds\b/i.test(fullText);

  // 3. Cassette / K7 check
  const isExplicitCassette = 
    allFmtText.includes('cassette') ||
    allFmtText.includes('tape') ||
    allFmtText.includes('k7') ||
    /\bk7\b|\bcassette\b|\bfita\b/i.test(fullText);

  if (isExplicitCd && !isExplicitDvd) {
    const isDouble = allFmtText.includes('2xcd') || allFmtText.includes('double') || allFmtText.includes('duplo') || (formats[0]?.qty === '2');
    const isMaxi = allFmtText.includes('maxi') || allFmtText.includes('single');
    
    let label = 'CD';
    if (isDouble) label = 'CD Duplo';
    else if (isMaxi) label = 'Maxi CD';

    return {
      type: 'cd',
      badgeLabel: label,
      fullLabel: isDouble ? 'CD Duplo (Compact Disc)' : 'CD (Compact Disc)',
      badgeBg: 'bg-emerald-700 text-white font-black',
      badgeText: label,
      iconEmoji: '💿'
    };
  }

  if (isExplicitDvd) {
    const isDouble = allFmtText.includes('2xdvd') || allFmtText.includes('duplo');
    const label = isDouble ? 'DVD Duplo' : 'DVD';
    return {
      type: 'dvd',
      badgeLabel: label,
      fullLabel: isDouble ? 'DVD Duplo Vídeo / Show' : 'DVD Vídeo / Show',
      badgeBg: 'bg-purple-700 text-white font-black',
      badgeText: label,
      iconEmoji: '🎬'
    };
  }

  if (isExplicitCassette) {
    return {
      type: 'cassette',
      badgeLabel: 'K7 / Fita',
      fullLabel: 'Fita Cassete (K7)',
      badgeBg: 'bg-amber-800 text-white font-black',
      badgeText: 'K7',
      iconEmoji: '📼'
    };
  }

  // 4. Vinyl Single 7" check
  const isSingle7 = 
    allFmtText.includes('7"') || 
    allFmtText.includes('single') || 
    allFmtText.includes('45 rpm') || 
    allFmtText.includes('compacto simples') ||
    allFmtText.includes('compacto') ||
    /\bcompacto\b|\b7"\b/i.test(fullText);

  if (isSingle7) {
    return {
      type: 'vinyl_single',
      badgeLabel: 'Compacto 7"',
      fullLabel: 'Vinil Compacto 7" (Single / 45 RPM)',
      badgeBg: 'bg-indigo-600 text-white font-black',
      badgeText: 'Compacto 7"',
      iconEmoji: '⚫'
    };
  }

  // 5. Vinyl 10" check
  const isVinyl10 = 
    allFmtText.includes('10"') || 
    allFmtText.includes('compacto duplo') || 
    allFmtText.includes('10 inch') ||
    /\b10"\b/i.test(fullText);

  if (isVinyl10) {
    return {
      type: 'vinyl_10',
      badgeLabel: 'Vinil 10"',
      fullLabel: 'Vinil 10" Polegadas',
      badgeBg: 'bg-sky-700 text-white font-black',
      badgeText: 'Vinil 10"',
      iconEmoji: '⚫'
    };
  }

  // 6. Default Vinyl LP 12"
  const isDoubleLp = allFmtText.includes('2xlp') || allFmtText.includes('gatefold') || allFmtText.includes('duplo') || (formats[0]?.qty === '2');
  const label = isDoubleLp ? 'LP Duplo' : 'LP 12"';
  return {
    type: 'vinyl_lp',
    badgeLabel: label,
    fullLabel: isDoubleLp ? 'Vinil LP Duplo 12"' : 'Vinil LP 12" (33 ⅓ RPM)',
    badgeBg: 'bg-slate-950/85 text-white backdrop-blur-xs font-black',
    badgeText: label,
    iconEmoji: '⚫'
  };
}

export interface ItemConditionInfo {
  isNew: boolean;
  type: 'new' | 'used';
  label: string; // 'Novo / Lacrado' or 'Usado (VG+)'
  shortLabel: string; // 'Novo' or 'Usado'
  tag: string; // 'Novo' or 'Usado'
  badgeBg: string;
  badgeClass: string;
  modalDescription: string;
}

/**
 * Accurately determines if a physical music listing (Vinyl, CD, DVD, K7) is New/Sealed or Used/Pre-owned.
 */
export function getItemConditionInfo(listingOrRelease?: SavedListing | null): ItemConditionInfo {
  if (!listingOrRelease) {
    return {
      isNew: false,
      type: 'used',
      label: 'Usado',
      shortLabel: 'Usado',
      tag: 'Usado',
      badgeBg: 'bg-amber-600',
      badgeClass: 'bg-amber-600 text-white font-bold',
      modalDescription: 'Item do acervo clássico / Usado higienizado e testado'
    };
  }

  const mediaCond = (listingOrRelease.condition?.mediaCondition || '').trim().toUpperCase();
  const sleeveCond = (listingOrRelease.condition?.sleeveCondition || '').trim().toUpperCase();
  const mediaDetails = (listingOrRelease.condition?.mediaDetails || '').toLowerCase();
  const sleeveDetails = (listingOrRelease.condition?.sleeveDetails || '').toLowerCase();
  const notes = (listingOrRelease.release?.notes || '').toLowerCase();
  const title = (listingOrRelease.release?.title || '').toLowerCase();

  const isSealedOrMint =
    mediaCond === 'M' ||
    mediaCond === 'SS' ||
    mediaCond === 'NOVO' ||
    mediaCond === 'LACRADO' ||
    mediaCond === 'NEW' ||
    sleeveCond === 'SS' ||
    sleeveCond === 'M' ||
    sleeveCond === 'NOVO' ||
    sleeveCond === 'LACRADO' ||
    sleeveCond === 'NEW' ||
    mediaDetails.includes('lacrado') ||
    mediaDetails.includes('novo de fábrica') ||
    mediaDetails.includes('still sealed') ||
    mediaDetails.includes('disco novo') ||
    mediaDetails.includes('item novo') ||
    sleeveDetails.includes('lacrado') ||
    sleeveDetails.includes('still sealed') ||
    notes.includes('lacrado') ||
    notes.includes('still sealed') ||
    notes.includes('novo e lacrado') ||
    title.includes('lacrado') ||
    title.includes('novo lacrado') ||
    title.includes('[lacrado]') ||
    title.includes('(lacrado)');

  if (isSealedOrMint) {
    return {
      isNew: true,
      type: 'new',
      label: 'Novo / Lacrado',
      shortLabel: 'Novo',
      tag: 'Novo',
      badgeBg: 'bg-emerald-600',
      badgeClass: 'bg-emerald-600 text-white font-black shadow-xs',
      modalDescription: 'Item 100% Novo e Lacrado de fábrica (Sem marcas de uso)'
    };
  }

  const grade = listingOrRelease.condition?.mediaCondition ? ` (${listingOrRelease.condition.mediaCondition})` : '';
  return {
    isNew: false,
    type: 'used',
    label: `Usado${grade}`,
    shortLabel: 'Usado',
    tag: 'Usado',
    badgeBg: 'bg-amber-600',
    badgeClass: 'bg-amber-500/20 text-amber-900 border border-amber-500/30 font-bold',
    modalDescription: 'Item usado / original de época cuidadosamente avaliado no padrão Goldmine'
  };
}

export interface GarimpoInfo {
  isGarimpo: boolean;
  badgeLabel: string;
  reason: string;
}

/**
 * Checks if a listing belongs to the "Sessão Garimpo"
 * (Discos de menor valor de mercado, itens com detalhes/danificados ou marcados como garimpo).
 */
export function isGarimpoItem(listing?: SavedListing | null): boolean {
  if (!listing) return false;

  // 1. Explicit flag
  if (listing.isGarimpo === true) return true;

  // 2. Storage location / Drawer indication
  const drawer = (listing.drawer || '').toLowerCase();
  if (drawer.includes('garimpo') || drawer.includes('caixa 10') || drawer.includes('caixa 20') || drawer.includes('promocao') || drawer.includes('promo')) {
    return true;
  }

  // 3. Price under market threshold (<= R$ 40)
  const price = listing.pricing?.directPrice || listing.pricing?.basePriceBrl || 0;
  if (price > 0 && price <= 40) {
    return true;
  }

  // 4. Goldmine Condition: G, G+, Fair, Poor
  const mediaCond = (listing.condition?.mediaCondition || '').trim().toUpperCase();
  const sleeveCond = (listing.condition?.sleeveCondition || '').trim().toUpperCase();
  if (['G', 'G+', 'F', 'P', 'POOR', 'FAIR'].includes(mediaCond) || ['G', 'G+', 'F', 'P', 'POOR', 'FAIR'].includes(sleeveCond)) {
    return true;
  }

  // 5. Notes / Details indicating damage or low-cost opportunity
  const combinedNotes = `${listing.condition?.mediaDetails || ''} ${listing.condition?.sleeveDetails || ''} ${listing.garimpoDetails || ''} ${listing.release?.notes || ''}`.toLowerCase();
  if (
    combinedNotes.includes('garimpo') ||
    combinedNotes.includes('danificado') ||
    combinedNotes.includes('com detalhes') ||
    combinedNotes.includes('capa avariada') ||
    combinedNotes.includes('marcas de uso acentuadas') ||
    combinedNotes.includes('riscos visíveis') ||
    combinedNotes.includes('pequeno detalhe') ||
    combinedNotes.includes('preço promocional')
  ) {
    return true;
  }

  return false;
}

export function getGarimpoReason(listing?: SavedListing | null): string {
  if (!listing) return 'Oportunidade Garimpo';
  if (listing.garimpoDetails) return listing.garimpoDetails;
  
  const price = listing.pricing?.directPrice || listing.pricing?.basePriceBrl || 0;
  const mediaCond = (listing.condition?.mediaCondition || '').trim().toUpperCase();
  
  if (['G', 'G+', 'F', 'P'].includes(mediaCond)) {
    return `Conservação ${mediaCond} (com marcas de uso/detalhes)`;
  }
  if (price > 0 && price <= 40) {
    return `Preço super acessível (R$ ${price.toFixed(2)})`;
  }
  return 'Achado de menor valor de mercado';
}

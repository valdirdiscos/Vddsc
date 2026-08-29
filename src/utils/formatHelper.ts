import { SavedListing, DiscogsRelease, Track, Format } from '../types';

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

/**
 * Checks if a listing is marked as an online exclusive rare record
 * (Discos raros vendidos exclusivamente pelo site / loja online).
 */
export function isOnlineExclusiveItem(listing?: SavedListing | null): boolean {
  if (!listing) return false;

  // 1. Explicit flag
  if (listing.isOnlineExclusive === true) return true;

  // 2. Storage location / Drawer indication
  const drawer = (listing.drawer || '').toLowerCase();
  if (drawer.includes('exclusivo') || drawer.includes('raro') || drawer.includes('raridade') || drawer.includes('online exclusive')) {
    return true;
  }

  // 3. Channel restriction strictly to online_store only
  const channels = listing.salesChannels;
  if (channels && channels.length === 1 && channels[0] === 'online_store') {
    return true;
  }

  // 4. Notes / Details indicating online store rarity exclusivity
  const combinedNotes = `${listing.onlineExclusiveDetails || ''} ${listing.condition?.mediaDetails || ''} ${listing.shopee?.description || ''} ${listing.release?.notes || ''}`.toLowerCase();
  if (
    combinedNotes.includes('exclusivo do site') ||
    combinedNotes.includes('exclusivo da loja online') ||
    combinedNotes.includes('exclusivo no site') ||
    combinedNotes.includes('venda exclusiva pelo site') ||
    combinedNotes.includes('raridade exclusiva')
  ) {
    return true;
  }

  return false;
}

export function getOnlineExclusiveReason(listing?: SavedListing | null): string {
  if (!listing) return 'Disco Raro Exclusivo do Site';
  if (listing.onlineExclusiveDetails) return listing.onlineExclusiveDetails;
  return 'Disco raro selecionado para venda exclusiva através do site oficial.';
}

export interface AlbumParticularity {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  type: 'disc_count' | 'box' | 'edition' | 'packaging' | 'bonus' | 'custom';
  badgeClass: string;
  pillClass: string;
  description: string;
}

/**
 * Automatically inspects a listing or Discogs release to detect important particularities
 * such as Double/Triple Albums, Box Sets, Special/Deluxe Editions, Gatefold covers, Colored Vinyl, Inserts, etc.
 */
export function getAlbumParticularities(listingOrRelease?: SavedListing | DiscogsRelease | null): AlbumParticularity[] {
  if (!listingOrRelease) return [];

  const listing: SavedListing | null = 'release' in listingOrRelease ? (listingOrRelease as SavedListing) : null;
  const release: DiscogsRelease = 'release' in listingOrRelease ? (listingOrRelease as SavedListing).release : (listingOrRelease as DiscogsRelease);

  if (!release) return [];

  const particularities: AlbumParticularity[] = [];
  const addedIds = new Set<string>();

  const formats = release.formats || [];
  const fmtNames = formats.map(f => (f.name || '').toLowerCase()).join(' ');
  const fmtDescs = formats.flatMap(f => f.descriptions || []).map(d => d.toLowerCase()).join(' ');
  const allFmtText = `${fmtNames} ${fmtDescs}`.toLowerCase();
  
  const title = (release.title || '').toLowerCase();
  const notes = (release.notes || '').toLowerCase();
  const sleeveDetails = (listing?.condition?.sleeveDetails || '').toLowerCase();
  const mediaDetails = (listing?.condition?.mediaDetails || '').toLowerCase();
  const specialText = (listing?.specialEditionDetails || '').toLowerCase();
  
  const fullText = `${allFmtText} ${title} ${notes} ${sleeveDetails} ${mediaDetails} ${specialText}`.toLowerCase();

  // Helper to add unique
  const add = (part: AlbumParticularity) => {
    if (!addedIds.has(part.id)) {
      addedIds.add(part.id);
      particularities.push(part);
    }
  };

  // 1. Custom Merchant Particularity (Highest priority if provided)
  if (listing?.specialEditionDetails && listing.specialEditionDetails.trim().length > 0) {
    const customText = listing.specialEditionDetails.trim();
    add({
      id: 'custom_particularity',
      label: customText,
      shortLabel: customText.length > 20 ? `${customText.slice(0, 18)}...` : customText,
      icon: '⭐',
      type: 'custom',
      badgeClass: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black border border-yellow-300 shadow-md',
      pillClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
      description: customText
    });
  }

  // 2. Box Set
  const isExplicitBox = listing?.isBoxSet === true;
  const isBoxDetected =
    isExplicitBox ||
    formats.some(f => (f.name || '').toLowerCase().includes('box') || (f.descriptions || []).some(d => d.toLowerCase().includes('box set'))) ||
    /\bbox\s*set\b|\bbox\b|\bcaixa\s+(especial|luxo|comemorativa|coletânea|de\s+luxo)\b|\bestojo\b/i.test(title) ||
    /\bbox\s*set\b|\bbox\s+com\b|\bcaixa\s+com\b|\bestojo\s+especial\b/i.test(notes) ||
    /\bbox\b/i.test(allFmtText);

  if (isBoxDetected) {
    add({
      id: 'box_set',
      label: 'Box Set Especial',
      shortLabel: 'Box Set',
      icon: '📦',
      type: 'box',
      badgeClass: 'bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-950 text-amber-200 font-black border border-purple-400/50 shadow-lg ring-1 ring-purple-500/30',
      pillClass: 'bg-purple-900 text-amber-200 border border-purple-400 font-black',
      description: 'Caixa especial / Box Set de colecionador com acondicionamento premium e itens exclusivos.'
    });
  }

  // 3. Multi-Disc: 4x, 3x, 2x (Double Album)
  const isExplicitDouble = listing?.isDoubleAlbum === true;
  const isQuadruple =
    formats.some(f => f.qty === '4') ||
    /\b4\s*x\s*(lp|vinil|vinyl|cd|disco)\b|\b4xlp\b|\b4xcd\b/i.test(fullText);

  const isTriple =
    formats.some(f => f.qty === '3') ||
    /\b3\s*x\s*(lp|vinil|vinyl|cd|disco)\b|\b3xlp\b|\b3xcd\b|\btriple\s+(album|lp|cd|vinyl)\b|\b[aá]lbum\s+triplo\b/i.test(fullText);

  const isDouble =
    isExplicitDouble ||
    formats.some(f => f.qty === '2') ||
    /\b2\s*x\s*(lp|vinil|vinyl|cd|disco)\b|\b2xlp\b|\b2xcd\b|\bdouble\s+(album|lp|cd|vinyl)\b|\b[aá]lbum\s+duplo\b|\bdisco\s+duplo\b|\blp\s+duplo\b|\bcd\s+duplo\b/i.test(fullText);

  if (isQuadruple) {
    add({
      id: 'quadruple_album',
      label: 'Álbum Quádruplo (4 Discos)',
      shortLabel: '4x Discos',
      icon: '💿4x',
      type: 'disc_count',
      badgeClass: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-950 text-white font-black border border-blue-400/50 shadow-md',
      pillClass: 'bg-blue-100 text-blue-900 border border-blue-300 font-black',
      description: 'Edição robusta com 4 discos (LPs ou CDs).'
    });
  } else if (isTriple) {
    add({
      id: 'triple_album',
      label: 'Álbum Triplo (3 Discos)',
      shortLabel: '3xLP Triplo',
      icon: '💿3x',
      type: 'disc_count',
      badgeClass: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-950 text-white font-black border border-blue-400/50 shadow-md',
      pillClass: 'bg-blue-100 text-blue-900 border border-blue-300 font-black',
      description: 'Edição com 3 discos (LPs ou CDs).'
    });
  } else if (isDouble) {
    const isCd = fmtNames.includes('cd') || title.includes('cd');
    const isDvd = fmtNames.includes('dvd') || title.includes('dvd');
    const label = isCd ? 'CD Duplo (2 CDs)' : isDvd ? 'DVD Duplo (2 DVDs)' : 'Álbum Duplo (2xLP)';
    const shortLabel = isCd ? 'CD Duplo' : isDvd ? 'DVD Duplo' : 'Álbum Duplo';

    add({
      id: 'double_album',
      label,
      shortLabel,
      icon: '💿💿',
      type: 'disc_count',
      badgeClass: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 text-white font-black border border-blue-300/60 shadow-md',
      pillClass: 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-black',
      description: 'Álbum duplo contendo 2 discos completos com todas as faixas e faixas bônus originais.'
    });
  }

  // 4. Capa Dupla (Gatefold)
  const isExplicitGatefold = listing?.isGatefold === true;
  const isGatefoldDetected =
    isExplicitGatefold ||
    allFmtText.includes('gatefold') ||
    /\bgatefold\b|\bcapa\s+dupla\b/i.test(fullText);

  if (isGatefoldDetected) {
    add({
      id: 'gatefold',
      label: 'Capa Dupla (Gatefold)',
      shortLabel: 'Capa Dupla',
      icon: '📖',
      type: 'packaging',
      badgeClass: 'bg-slate-950/90 text-amber-300 font-black border border-amber-500/40 shadow-md backdrop-blur-xs',
      pillClass: 'bg-slate-900 text-amber-300 border border-amber-500/40 font-bold',
      description: 'Capa dobrável dupla (Gatefold) que se abre revelando artes, letras e fotografias internas.'
    });
  }

  // 5. Vinil Colorido ou Picture Disc
  if (/\bpicture\s+disc\b/i.test(fullText)) {
    add({
      id: 'picture_disc',
      label: 'Picture Disc (Ilustrado)',
      shortLabel: 'Picture Disc',
      icon: '🖼️',
      type: 'edition',
      badgeClass: 'bg-gradient-to-r from-pink-600 to-rose-700 text-white font-black border border-pink-300/50 shadow-md',
      pillClass: 'bg-pink-100 text-pink-900 border border-pink-300 font-black',
      description: 'Vinil especial Picture Disc com imagem gráfica impressa diretamente no corpo do disco.'
    });
  } else if (/\b(colored\s+vinyl|coloured\s+vinyl|vinil\s+colorido|blue\s+vinyl|red\s+vinyl|white\s+vinyl|yellow\s+vinyl|green\s+vinyl|splatter|marble)\b/i.test(fullText)) {
    add({
      id: 'colored_vinyl',
      label: 'Vinil Colorido',
      shortLabel: 'Vinil Colorido',
      icon: '🎨',
      type: 'edition',
      badgeClass: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white font-black border border-emerald-300/50 shadow-md',
      pillClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black',
      description: 'Prensagem especial em vinil colorido (splatter, marble ou monocromático translúcido/opaco).'
    });
  }

  // 6. 180 Gramas / Prensagem Audiófila
  if (/\b180\s*g(ram|ramas)?\b|\baudiophile\b|\baudi[oó]filo\b/i.test(fullText)) {
    add({
      id: 'audiophile_180g',
      label: 'Vinil 180g (Audiófilo)',
      shortLabel: '180g Audiófilo',
      icon: '⚖️',
      type: 'edition',
      badgeClass: 'bg-slate-900 text-amber-300 font-black border border-amber-400/50 shadow-md',
      pillClass: 'bg-amber-950 text-amber-300 border border-amber-500/40 font-bold',
      description: 'Prensagem pesada em vinil virgem de 180 gramas com alta fidelidade sonora e menor ressonância.'
    });
  }

  // 7. Edição Especial / Deluxe / Limitada / Comemorativa
  const isExplicitSpecial = listing?.isSpecialEdition === true;
  const isDeluxe = /\bdeluxe(\s+edition)?\b|\bedi[cç][aã]o\s+deluxe\b/i.test(fullText);
  const isLimited = /\blimited(\s+edition)?\b|\bedi[cç][aã]o\s+limitada\b/i.test(fullText);
  const isAnniversary = /\b(anniversary|comemorativa|anivers[aá]rio)\b/i.test(fullText);
  const isJapanese = /\b(japanese\s+edition|edição\s+japonesa|com\s+obi|obi\s+strip)\b/i.test(fullText);
  const isSpecial = isExplicitSpecial || allFmtText.includes('special edition') || /\bedi[cç][aã]o\s+especial\b|\bspecial\s+edition\b/i.test(fullText);

  if (isDeluxe) {
    add({
      id: 'deluxe_edition',
      label: 'Edição Deluxe',
      shortLabel: 'Deluxe',
      icon: '💎',
      type: 'edition',
      badgeClass: 'bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 text-white font-black border border-violet-300/50 shadow-md',
      pillClass: 'bg-purple-100 text-purple-900 border border-purple-300 font-black',
      description: 'Edição Deluxe expandida com faixas extras, acabamento superior e encartes exclusivos.'
    });
  } else if (isLimited) {
    add({
      id: 'limited_edition',
      label: 'Edição Limitada',
      shortLabel: 'Ed. Limitada',
      icon: '🎖️',
      type: 'edition',
      badgeClass: 'bg-gradient-to-r from-red-700 via-rose-700 to-pink-800 text-white font-black border border-red-300/50 shadow-md',
      pillClass: 'bg-red-100 text-red-900 border border-red-300 font-black',
      description: 'Tiragem limitada e numerada de colecionador.'
    });
  } else if (isAnniversary) {
    add({
      id: 'anniversary_edition',
      label: 'Edição Comemorativa',
      shortLabel: 'Comemorativa',
      icon: '🎂',
      type: 'edition',
      badgeClass: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white font-black border border-amber-300/50 shadow-md',
      pillClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-black',
      description: 'Edição comemorativa de aniversário de lançamento da obra.'
    });
  } else if (isJapanese) {
    add({
      id: 'japanese_edition',
      label: 'Edição Japonesa (OBI)',
      shortLabel: 'Ed. Japonesa',
      icon: '🇯🇵',
      type: 'edition',
      badgeClass: 'bg-gradient-to-r from-red-800 to-slate-900 text-white font-black border border-red-300/40 shadow-md',
      pillClass: 'bg-red-900 text-white border border-red-400 font-black',
      description: 'Prensagem japonesa altamente cobiçada com faixa OBI original e encarte bilíngue.'
    });
  } else if (isSpecial) {
    add({
      id: 'special_edition',
      label: 'Edição Especial',
      shortLabel: 'Ed. Especial',
      icon: '✨',
      type: 'edition',
      badgeClass: 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white font-black border border-rose-300/50 shadow-md',
      pillClass: 'bg-rose-100 text-rose-900 border border-rose-300 font-black',
      description: 'Edição especial com particularidades distintas do lançamento convencional.'
    });
  }

  // 8. Acompanha Encarte Original / Pôster
  const hasExplicitInsert = listing?.hasInsert === true || listing?.condition?.hasInsert === true;
  const hasInsertDetected =
    hasExplicitInsert ||
    /\b(com\s+encarte|encarte\s+original|encarte\s+incluso|acompanha\s+encarte|includes\s+insert|with\s+insert)\b/i.test(fullText);

  if (hasInsertDetected) {
    add({
      id: 'insert_included',
      label: 'Com Encarte Original',
      shortLabel: 'C/ Encarte',
      icon: '📄',
      type: 'bonus',
      badgeClass: 'bg-amber-800/90 text-amber-100 font-black border border-amber-500/40 shadow-xs backdrop-blur-xs',
      pillClass: 'bg-amber-50 text-amber-900 border border-amber-300 font-bold',
      description: 'Acompanha o encarte original com letras, fichas técnicas ou fotos de época.'
    });
  }

  if (/\b(com\s+p[oô]ster|p[oô]ster\s+original|includes\s+poster|with\s+poster)\b/i.test(fullText)) {
    add({
      id: 'poster_included',
      label: 'Com Pôster Original',
      shortLabel: 'C/ Pôster',
      icon: '📜',
      type: 'bonus',
      badgeClass: 'bg-amber-900/90 text-amber-200 font-black border border-amber-400/40 shadow-xs backdrop-blur-xs',
      pillClass: 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
      description: 'Acompanha o pôster oficial original encartado.'
    });
  }

  // 9. Coletânea / Vários Artistas (VA)
  if (isVariousArtistsAlbum(listingOrRelease)) {
    add({
      id: 'various_artists_va',
      label: 'Coletânea / Vários Artistas (VA)',
      shortLabel: 'Coletânea VA',
      icon: '👥',
      type: 'custom',
      badgeClass: 'bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-teal-100 font-black border border-teal-400/50 shadow-md',
      pillClass: 'bg-teal-100 text-teal-900 border border-teal-300 font-black',
      description: 'Álbum no formato Coletânea / V.A. contendo músicas de múltiplos artistas e bandas consagradas.'
    });
  }

  return particularities;
}

/**
 * Accurately detects whether an album is a Various Artists (VA / Coletânea / Soundtrack / Trilha Sonora) compilation.
 */
export function isVariousArtistsAlbum(
  releaseOrArtist?: string | DiscogsRelease | SavedListing | null,
  formats?: Format[],
  tracklist?: Track[]
): boolean {
  if (!releaseOrArtist) return false;

  let artist = '';
  let title = '';
  let releaseFormats: Format[] = formats || [];
  let releaseTracks: Track[] = tracklist || [];

  if (typeof releaseOrArtist === 'string') {
    artist = releaseOrArtist;
  } else if ('release' in releaseOrArtist) {
    const r = (releaseOrArtist as SavedListing).release;
    artist = r.artist || '';
    title = r.title || '';
    if (r.formats) releaseFormats = r.formats;
    if (r.tracklist) releaseTracks = r.tracklist;
  } else {
    const r = releaseOrArtist as DiscogsRelease;
    artist = r.artist || '';
    title = r.title || '';
    if (r.formats) releaseFormats = r.formats;
    if (r.tracklist) releaseTracks = r.tracklist;
  }

  const cleanArtist = (artist || '').trim().toLowerCase();

  // Common VA artist representations
  const vaPatterns = [
    /^various(\s+artists)?$/i,
    /^v[áa]rios(\s+artistas)?$/i,
    /^v\.?a\.?$/i,
    /^v\/a$/i,
    /^colet[âa]nea$/i,
    /^compilation$/i,
    /^soundtrack$/i,
    /^original\s+soundtrack$/i,
    /^trilha\s+sonora(\s+original)?$/i,
    /^o\.?s\.?t\.?$/i
  ];

  if (vaPatterns.some(p => p.test(cleanArtist))) {
    return true;
  }

  if (
    cleanArtist.includes('various artists') ||
    cleanArtist.includes('vários artistas') ||
    cleanArtist.includes('varios artistas') ||
    cleanArtist.startsWith('v.a.') ||
    cleanArtist.startsWith('v.a -') ||
    cleanArtist.startsWith('va -')
  ) {
    return true;
  }

  // Check formats for "compilation" / "coletânea"
  const isCompilationFormat = releaseFormats.some(f =>
    (f.descriptions || []).some(d => /compilation|colet[âa]nea|sampler/i.test(d))
  );

  // Check tracklist: if 2 or more tracks have distinct artists (and not the main release artist)
  const trackArtists = Array.from(
    new Set(
      releaseTracks
        .map(t => (t.artist || '').trim())
        .filter(a => a && !vaPatterns.some(p => p.test(a)) && a.toLowerCase() !== cleanArtist)
    )
  );

  if (trackArtists.length >= 2) {
    return true;
  }

  if (isCompilationFormat && (trackArtists.length >= 1 || /v[áa]rios|various|trilha\s+sonora|soundtrack/i.test(title))) {
    return true;
  }

  return false;
}

/**
 * Formats a track display string, ensuring that for VA albums the artist is clearly identified alongside the song title.
 */
export function formatTrackWithArtist(track: Track, isVA?: boolean): { position: string; title: string; artist?: string; fullDisplay: string } {
  const pos = track.position || '';
  let art = track.artist?.trim() || '';
  let title = track.title?.trim() || '';

  // If artist is not set on the track object, check if title is formatted as "Artist - Title" or "Artist: Title"
  if (!art && (isVA || title.includes(' - ') || title.includes(' – ') || title.includes(' — '))) {
    const splitMatch = title.match(/^(.+?)\s+[-–—:]\s+(.+)$/);
    if (splitMatch) {
      art = splitMatch[1].trim();
      title = splitMatch[2].trim();
    }
  }

  const durationStr = track.duration ? ` (${track.duration})` : '';
  const fullDisplay = art 
    ? `${pos ? `${pos} ` : ''}${art} - ${title}${durationStr}`
    : `${pos ? `${pos} ` : ''}${title}${durationStr}`;

  return {
    position: pos,
    title,
    artist: art || undefined,
    fullDisplay
  };
}

/**
 * Quick detector to pre-fill listing fields from a Discogs release.
 */
export function detectReleaseParticularities(release?: DiscogsRelease | null) {
  if (!release) {
    return {
      isDoubleAlbum: false,
      isBoxSet: false,
      isSpecialEdition: false,
      isGatefold: false,
      hasInsert: false,
      isVariousArtists: false,
      suggestedDetails: ''
    };
  }

  const isVA = isVariousArtistsAlbum(release);
  const formats = release.formats || [];
  const fmtNames = formats.map(f => (f.name || '').toLowerCase()).join(' ');
  const fmtDescs = formats.flatMap(f => f.descriptions || []).map(d => d.toLowerCase()).join(' ');
  const allFmtText = `${fmtNames} ${fmtDescs}`.toLowerCase();
  const title = (release.title || '').toLowerCase();
  const notes = (release.notes || '').toLowerCase();
  const full = `${allFmtText} ${title} ${notes}`;

  const isBoxSet =
    formats.some(f => (f.name || '').toLowerCase().includes('box') || (f.descriptions || []).some(d => d.toLowerCase().includes('box set'))) ||
    /\bbox\s*set\b|\bbox\b|\bcaixa\s+(especial|luxo)\b/i.test(title);

  const isDoubleAlbum =
    formats.some(f => f.qty === '2' || f.qty === '3' || f.qty === '4') ||
    /\b2\s*x\s*(lp|vinil|vinyl|cd|disco)\b|\b2xlp\b|\bdouble\s+album\b|\b[aá]lbum\s+duplo\b/i.test(full);

  const isGatefold = allFmtText.includes('gatefold') || /\bgatefold\b|\bcapa\s+dupla\b/i.test(full);

  const isSpecialEdition =
    allFmtText.includes('special edition') ||
    allFmtText.includes('deluxe') ||
    allFmtText.includes('limited') ||
    allFmtText.includes('colored') ||
    allFmtText.includes('picture disc') ||
    /\b(special\s+edition|edição\s+especial|deluxe|limited\s+edition|edição\s+limitada|vinil\s+colorido|picture\s+disc)\b/i.test(full);

  const hasInsert = /\b(com\s+encarte|encarte\s+incluso|includes\s+insert|with\s+insert)\b/i.test(full);

  let suggestedDetails = '';
  if (isBoxSet) suggestedDetails = 'Box Set Especial de Colecionador';
  else if (isDoubleAlbum && isGatefold) suggestedDetails = 'Álbum Duplo com Capa Dupla (Gatefold)';
  else if (isDoubleAlbum) suggestedDetails = 'Álbum Duplo (2 Discos)';
  else if (isGatefold) suggestedDetails = 'Capa Dupla (Gatefold)';
  else if (isVA) suggestedDetails = 'Coletânea Especial Vários Artistas (V.A.)';

  return {
    isDoubleAlbum,
    isBoxSet,
    isSpecialEdition,
    isGatefold,
    hasInsert,
    isVariousArtists: isVA,
    suggestedDetails
  };
}


import { SavedListing, DiscogsRelease, Track, Format, ConditionSelection } from '../types';

export interface ListingFormatInfo {
  type: 'vinyl_lp' | 'vinyl_12_single' | 'vinyl_single' | 'vinyl_10' | 'cd' | 'dvd' | 'cassette' | 'other';
  badgeLabel: string;
  fullLabel: string;
  badgeBg: string;
  badgeText: string;
  iconEmoji: string;
  sizeInches?: number;
  defaultSpeed?: string;
}

/**
 * Accurately analyzes release data, formats, descriptions, notes, and title
 * to determine if the item is a CD, DVD, Cassette, 7" Single, 10" Vinyl, 12" Single/EP, or 12" LP.
 */
export function getListingFormatInfo(listingOrRelease?: SavedListing | DiscogsRelease | null): ListingFormatInfo {
  if (!listingOrRelease) {
    return {
      type: 'vinyl_lp',
      badgeLabel: 'LP 12"',
      fullLabel: 'Vinil LP 12" (33 ⅓ RPM)',
      badgeBg: 'bg-slate-950/85 text-white backdrop-blur-xs',
      badgeText: 'LP 12"',
      iconEmoji: '⚫',
      sizeInches: 12,
      defaultSpeed: '33,3 rpm'
    };
  }

  // 0. Manual format override check if set on SavedListing
  if ('formatOverride' in listingOrRelease && listingOrRelease.formatOverride) {
    const override = listingOrRelease.formatOverride;
    if (override === 'vinyl_12_single') {
      return {
        type: 'vinyl_12_single',
        badgeLabel: 'Single 12"',
        fullLabel: 'Vinil Single / Maxi-Single / EP 12" (12 Polegadas)',
        badgeBg: 'bg-violet-700 text-white font-black',
        badgeText: 'Single 12"',
        iconEmoji: '⚫',
        sizeInches: 12,
        defaultSpeed: '33,3 rpm'
      };
    } else if (override === 'vinyl_single') {
      return {
        type: 'vinyl_single',
        badgeLabel: 'Compacto 7"',
        fullLabel: 'Vinil Compacto 7" (Single / EP / 45 RPM)',
        badgeBg: 'bg-indigo-600 text-white font-black',
        badgeText: 'Compacto 7"',
        iconEmoji: '⚫',
        sizeInches: 7,
        defaultSpeed: '45 rpm'
      };
    } else if (override === 'vinyl_10') {
      return {
        type: 'vinyl_10',
        badgeLabel: 'Vinil 10"',
        fullLabel: 'Vinil 10" Polegadas',
        badgeBg: 'bg-sky-700 text-white font-black',
        badgeText: 'Vinil 10"',
        iconEmoji: '⚫',
        sizeInches: 10,
        defaultSpeed: '33,3 rpm'
      };
    } else if (override === 'cd') {
      return {
        type: 'cd',
        badgeLabel: 'CD',
        fullLabel: 'CD (Compact Disc)',
        badgeBg: 'bg-emerald-700 text-white font-black',
        badgeText: 'CD',
        iconEmoji: '💿',
        sizeInches: 5,
        defaultSpeed: 'Não se aplica'
      };
    } else if (override === 'dvd') {
      return {
        type: 'dvd',
        badgeLabel: 'DVD',
        fullLabel: 'DVD Vídeo / Show',
        badgeBg: 'bg-purple-700 text-white font-black',
        badgeText: 'DVD',
        iconEmoji: '🎬',
        sizeInches: 5,
        defaultSpeed: 'Não se aplica'
      };
    } else if (override === 'cassette') {
      return {
        type: 'cassette',
        badgeLabel: 'K7 / Fita',
        fullLabel: 'Fita Cassete (K7)',
        badgeBg: 'bg-amber-800 text-white font-black',
        badgeText: 'K7',
        iconEmoji: '📼',
        defaultSpeed: 'Não se aplica'
      };
    } else if (override === 'vinyl_lp') {
      return {
        type: 'vinyl_lp',
        badgeLabel: 'LP 12"',
        fullLabel: 'Vinil LP 12" (33 ⅓ RPM)',
        badgeBg: 'bg-slate-950/85 text-white backdrop-blur-xs font-black',
        badgeText: 'LP 12"',
        iconEmoji: '⚫',
        sizeInches: 12,
        defaultSpeed: '33,3 rpm'
      };
    }
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
      iconEmoji: '💿',
      sizeInches: 5,
      defaultSpeed: 'Não se aplica'
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
      iconEmoji: '🎬',
      sizeInches: 5,
      defaultSpeed: 'Não se aplica'
    };
  }

  if (isExplicitCassette) {
    return {
      type: 'cassette',
      badgeLabel: 'K7 / Fita',
      fullLabel: 'Fita Cassete (K7)',
      badgeBg: 'bg-amber-800 text-white font-black',
      badgeText: 'K7',
      iconEmoji: '📼',
      defaultSpeed: 'Não se aplica'
    };
  }

  // --- RECONHECIMENTO PRECISO DE VINIL (12", 10", 7", COMPACTOS E SINGLES) ---
  const is45Rpm = allFmtText.includes('45 rpm') || allFmtText.includes('45rpm') || /\b45\s*rpm\b/i.test(fullText);
  const is78Rpm = allFmtText.includes('78 rpm') || allFmtText.includes('78rpm') || /\b78\s*rpm\b/i.test(fullText);
  const defaultVinylSpeed = is45Rpm ? '45 rpm' : is78Rpm ? '78 rpm' : '33,3 rpm';

  const has12Inch = 
    allFmtText.includes('12"') || 
    allFmtText.includes('12 inch') || 
    allFmtText.includes('12-inch') || 
    allFmtText.includes('12 polegadas') ||
    allFmtText.includes('maxi-single') ||
    allFmtText.includes('maxi single') ||
    /\b12"\b|\b12\s*inch\b|\b12-inch\b|\bmaxi-single\b|\bmaxi\s+single\b/i.test(fullText);

  const has7Inch = 
    allFmtText.includes('7"') || 
    allFmtText.includes('7 inch') || 
    allFmtText.includes('7-inch') || 
    allFmtText.includes('compacto simples') ||
    /\b7"\b|\b7\s*inch\b|\b7-inch\b|\bcompacto\s+simples\b/i.test(fullText);

  const has10Inch = 
    allFmtText.includes('10"') || 
    allFmtText.includes('10 inch') || 
    allFmtText.includes('10-inch') || 
    /\b10"\b|\b10\s*inch\b|\b10-inch\b/i.test(fullText);

  const hasMaxi = allFmtText.includes('maxi-single') || allFmtText.includes('maxi single') || allFmtText.includes('maxi') || /\bmaxi\b/i.test(fullText);
  const hasSingle = allFmtText.includes('single') || /\bsingle\b/i.test(fullText);
  const hasEp = allFmtText.includes('ep') || allFmtText.includes('mini-album') || /\bep\b|\bmini-album\b/i.test(allFmtText);
  const isShortTracklist = (release.tracklist?.length || 0) > 0 && (release.tracklist?.length || 0) <= 4;

  // 4. VINIL 12" SINGLE / MAXI-SINGLE / EP (12 POLEGADAS)
  // Se possui 12" e é Single, Maxi-Single, EP ou Mini-Album, É UM SINGLE DE 12 POLEGADAS (tamanho de LP), NUNCA UM COMPACTO 7"!
  const is12InchSingleOrEp = 
    has12Inch && (hasMaxi || hasSingle || hasEp || (isShortTracklist && !allFmtText.includes('album') && !allFmtText.includes('lp')));

  if (is12InchSingleOrEp || (hasMaxi && !has7Inch)) {
    let label = 'Single 12"';
    if (hasMaxi) label = 'Maxi-Single 12"';
    else if (hasEp) label = 'EP 12"';

    return {
      type: 'vinyl_12_single',
      badgeLabel: label,
      fullLabel: `Vinil ${label} (${is45Rpm ? '45 RPM' : '33 ⅓ RPM'} - 12 Polegadas)`,
      badgeBg: 'bg-violet-700 text-white font-black',
      badgeText: label,
      iconEmoji: '⚫',
      sizeInches: 12,
      defaultSpeed: defaultVinylSpeed
    };
  }

  // 5. VINIL 7" COMPACTO (SINGLE / EP 7 POLEGADAS)
  const isSingle7 = 
    has7Inch || 
    allFmtText.includes('compacto') ||
    /\bcompacto\b/i.test(fullText) ||
    ((hasSingle || hasEp || is45Rpm) && !has12Inch && !has10Inch);

  if (isSingle7 && !has12Inch) {
    const isDoubleCompacto = allFmtText.includes('compacto duplo') || (hasEp && !hasSingle);
    const label = isDoubleCompacto ? 'Compacto 7" (EP)' : 'Compacto 7"';
    return {
      type: 'vinyl_single',
      badgeLabel: label,
      fullLabel: isDoubleCompacto ? 'Vinil Compacto Duplo 7" (EP / 7 Polegadas)' : 'Vinil Compacto 7" (Single / 45 RPM)',
      badgeBg: 'bg-indigo-600 text-white font-black',
      badgeText: label,
      iconEmoji: '⚫',
      sizeInches: 7,
      defaultSpeed: is45Rpm ? '45 rpm' : '33,3 rpm'
    };
  }

  // 6. VINIL 10" POLEGADAS
  if (has10Inch) {
    return {
      type: 'vinyl_10',
      badgeLabel: 'Vinil 10"',
      fullLabel: 'Vinil 10" Polegadas',
      badgeBg: 'bg-sky-700 text-white font-black',
      badgeText: 'Vinil 10"',
      iconEmoji: '⚫',
      sizeInches: 10,
      defaultSpeed: defaultVinylSpeed
    };
  }

  // 7. PADRÃO: VINIL LP 12" (LONG PLAY COMPLETO)
  const isDoubleLp = allFmtText.includes('2xlp') || allFmtText.includes('gatefold') || allFmtText.includes('duplo') || (formats[0]?.qty === '2');
  const label = isDoubleLp ? 'LP Duplo' : 'LP 12"';
  return {
    type: 'vinyl_lp',
    badgeLabel: label,
    fullLabel: isDoubleLp ? 'Vinil LP Duplo 12"' : 'Vinil LP 12" (33 ⅓ RPM)',
    badgeBg: 'bg-slate-950/85 text-white backdrop-blur-xs font-black',
    badgeText: label,
    iconEmoji: '⚫',
    sizeInches: 12,
    defaultSpeed: defaultVinylSpeed
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
      modalDescription: 'Item do acervo clássico / Usado higienizado e revisado no padrão Goldmine'
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
 * Eliminado a pedido do usuário (estava confuso e gerava marcações incorretas).
 * Retorna sempre false para desativar qualquer exibição de garimpo.
 */
export function isGarimpoItem(_listing?: SavedListing | null): boolean {
  return false;
}

export function getGarimpoReason(_listing?: SavedListing | null): string {
  return '';
}

/**
 * Lista de artistas consagrados da Música Gaúcha, Nativista e Tradicionalista do RS.
 */
const GAUCHO_NATIVISTA_ARTISTS = [
  'teixeirinha', 'gaucho da fronteira', 'gaúcho da fronteira', 'os serranos', 
  'porca véia', 'porca veia', 'luiz marenco', 'noel guarany', 'cenair maicá', 
  'cenair maica', 'pedro ortaça', 'pedro ortaca', 'telmo de lima freitas', 
  'honeyde bertussi', 'os mirins', 'berenice azambuja', 'leopoldo rassier', 
  'neto fagundes', 'ernesto fagundes', 'joca martins', 'baitaca', 'grupo rodeio', 
  'os monarcas', 'chiquito & bordoneio', 'chiquito e bordoneio', 'cesar passarinho', 
  'césar passarinho', 'dante ramon ledesma', 'wilson paim', 'kleiton & kledir', 
  'kleiton e kledir', 'elton saldanha', 'os fagundes', 'joão de almeida neto', 
  'joao de almeida neto', 'josé mendes', 'jose mendes', 'mary terezinha', 
  'adelar bertussi', 'irmãos bertussi', 'irmaos bertussi', 'gildo de freitas', 
  'barbosa lessa', 'paixão côrtes', 'paixao cortes', 'tchê garotos', 'tche garotos', 
  'tchê barbaridade', 'tche barbaridade', 'os 3 xirus', 'os três xirús', 'os tres xirus', 
  'os nativos', 'valter moraes', 'antônio gringo', 'antonio gringo', 'mário barbará', 
  'mario barbara', 'shana müller', 'shana muller', 'grupo fandanguerio', 'os bertussi', 
  'mano lima', 'luiz carlos borges', 'garotos de ouro', 'grupo charrua', 'trio nativista', 
  'conjunto farroupilha', 'os 4 gauchos', 'os quatro gaúchos', 'os tauras', 'os campeiros', 
  'renato borghetti', 'borghettinho', 'tupanciretã', 'alma missioneira', 'grupo quarteador'
];

const GAUCHO_KEYWORDS = [
  'gaúcho', 'gaucho', 'gaúcha', 'gaucha', 'nativista', 'nativismo', 'rio grande do sul', 
  'tradicionalismo', 'tradicionalista', 'ctg', 'pampa', 'pampeano', 'milonga', 'chamamé', 
  'chamame', 'vaneira', 'vanera', 'vanerão', 'vanerao', 'bugio', 'chula', 'chimarrão', 
  'chimarrao', 'fandango', 'payada', 'trova', 'trovador', 'galpão', 'galpao', 'fronteira', 
  'charqueada', 'farroupilha', 'missões', 'missoes', 'serrano', 'campeiro', 'querência', 
  'querencia', 'acordeom', 'gaita ponto', 'gaita de botão', 'gauchesco', 'gauchão', 
  'gauchao', 'regional gaúcho', 'regional gaucho', 'porto alegre', 'sulista', 'bagé', 
  'uruguaiana', 'pelotas', 'passo fundo', 'vacaria'
];

/**
 * Identifica se o disco pertence à Sessão Música Gaúcha / Nativista.
 * Identifica artistas do RS e classifica discos marcados como 'Folk' ou 'Folk, World, & Country'
 * pelo Discogs que sejam da cultura gaúcha / tradicionalista do Rio Grande do Sul.
 */
export function isNativistaGauchoItem(listingOrRelease?: SavedListing | DiscogsRelease | null): boolean {
  if (!listingOrRelease) return false;

  const listing: SavedListing | null = 'release' in listingOrRelease ? (listingOrRelease as SavedListing) : null;
  const release: DiscogsRelease = listing ? listing.release : (listingOrRelease as DiscogsRelease);

  // 1. Flag explícita do item
  if (listing?.isNativista === true) return true;

  const artist = (release.artist || '').toLowerCase();
  const title = (release.title || '').toLowerCase();
  const notes = (release.notes || '').toLowerCase();
  const genres = (release.genres || []).map(g => (g || '').toLowerCase());
  const styles = (release.styles || []).map(s => (s || '').toLowerCase());
  const tracklistTitles = (release.tracklist || []).map(t => (t.title || '').toLowerCase()).join(' ');
  const drawer = (listing?.drawer || '').toLowerCase();

  const fullText = `${artist} ${title} ${notes} ${styles.join(' ')} ${genres.join(' ')} ${tracklistTitles} ${drawer}`;

  // 2. Gaveta / Localização
  if (drawer.includes('gaucho') || drawer.includes('gaúcho') || drawer.includes('nativista') || drawer.includes('sul')) {
    return true;
  }

  // 3. Artista consagrado da música gaúcha/nativista
  if (GAUCHO_NATIVISTA_ARTISTS.some(gArtist => artist.includes(gArtist))) {
    return true;
  }

  // 4. Classificação Discogs: Folk / Folk, World, & Country + termos do RS / Gaúcho
  const isDiscogsFolk = 
    genres.some(g => g.includes('folk')) || 
    styles.some(s => s.includes('folk')) ||
    genres.some(g => g.includes('world') || g.includes('country')) ||
    styles.some(s => s.includes('country') || s.includes('regional'));

  // Se o Discogs classificou como Folk/World/Regional e contém palavras-chave do Rio Grande do Sul
  if (isDiscogsFolk && GAUCHO_KEYWORDS.some(kw => fullText.includes(kw))) {
    return true;
  }

  // 5. Palavras-chave gaúchas/nativistas fortes no artista, título ou estilos
  const strongKeywords = ['nativista', 'nativismo', 'gaúcho', 'gaucho', 'gaúcha', 'gaucha', 'tradicionalismo', 'milonga', 'chamamé', 'chamame', 'vaneira', 'vanerão', 'vanerao', 'bugio', 'chimarrão'];
  if (strongKeywords.some(skw => artist.includes(skw) || title.includes(skw) || styles.some(s => s.includes(skw)))) {
    return true;
  }

  return false;
}

export function getNativistaInfo(listingOrRelease?: SavedListing | DiscogsRelease | null): {
  isNativista: boolean;
  label: string;
  tag: string;
} {
  const isNat = isNativistaGauchoItem(listingOrRelease);
  return {
    isNativista: isNat,
    label: '🧉 Música Gaúcha & Nativista',
    tag: 'Gaúcha / Nativista'
  };
}

/**
 * Palavras-chave e títulos clássicos de Trilhas Sonoras de Novela brasileiras
 * (Globo, Som Livre, Tupi, Manchete, SBT, etc.)
 */
const NOVELA_TITLES_AND_KEYWORDS = [
  'roque santeiro', 'vale tudo', 'tieta', 'pantanal', 'o clone', 'renascer', 
  'laços de família', 'lacos de familia', 'mulheres de areia', 'por amor', 
  'rainha da sucata', 'fera radical', 'top model', 'vamp', 'quatro por quatro', 
  'o rei do gado', 'a viagem', 'selva de pedra', 'dancin\' days', 'dancin days', 
  'dancing days', 'locomotivas', 'água viva', 'agua viva', 'bailado', 'brilhante', 
  'guerra dos sexos', 'vereda tropical', 'cambalacho', 'brega & chique', 'brega e chique', 
  'bebe a bordo', 'bebê a bordo', 'salvador da pátria', 'salvador da patria', 
  'barriga de aluguel', 'de corpo e alma', 'sonho meu', 'história de amor', 
  'historia de amor', 'explodir', 'salsa e merengue', 'torre de babel', 'terra nostra', 
  'porto dos milagres', 'o cravo e a rosa', 'celebridade', 'senhora do destino', 
  'américa', 'america', 'belíssima', 'belissima', 'páginas da vida', 'paginas da vida', 
  'paraíso tropical', 'paraiso tropical', 'a favorita', 'caminho das índias', 
  'caminho das indias', 'passione', 'avenida brasil', 'saravá', 'estúpido cupido', 
  'estupido cupido', 'gabriela', 'saramandaia', 'pecado capital', 'espelho mágico', 
  'espelho magico', 'marron glacê', 'marron glace', 'coração alado', 'coracao alado', 
  'plumas e paetês', 'plumas e paetes', 'sétimo sentido', 'setimo sentido', 
  'sol de verão', 'sol de verao', 'final feliz', 'champagne', 'corpo a corpo', 
  'mandala', 'sassaricando', 'ti-ti-ti', 'tititi', 'hipertensão', 'hipertensao', 
  'mandacaru', 'xica da silva', 'dona beija', 'kananga do japão', 'kananga do japao',
  'malhação', 'malhacao'
];

/**
 * Identifica se o disco pertence à categoria de Trilhas Sonoras de Novelas
 * (Trilha Sonora Nacional / Internacional de Novela, Som Livre, Rede Globo).
 */
export function isNovelaItem(listingOrRelease?: SavedListing | DiscogsRelease | null): boolean {
  if (!listingOrRelease) return false;

  const listing: SavedListing | null = 'release' in listingOrRelease ? (listingOrRelease as SavedListing) : null;
  const release: DiscogsRelease = listing ? listing.release : (listingOrRelease as DiscogsRelease);

  // 1. Flag explícita do item
  if (listing?.isNovela === true) return true;

  const artist = (release.artist || '').toLowerCase();
  const title = (release.title || '').toLowerCase();
  const label = (release.label || '').toLowerCase();
  const notes = (release.notes || '').toLowerCase();
  const genres = (release.genres || []).map(g => (g || '').toLowerCase());
  const styles = (release.styles || []).map(s => (s || '').toLowerCase());
  const drawer = (listing?.drawer || '').toLowerCase();

  const fullText = `${artist} ${title} ${label} ${notes} ${styles.join(' ')} ${genres.join(' ')} ${drawer}`;

  // 2. Gaveta / Localização
  if (drawer.includes('novela') || drawer.includes('trilha') || drawer.includes('som livre')) {
    return true;
  }

  // 3. Palavras-chave explícitas de Novela no Título ou Notas
  if (
    /\btrilha\s+(?:sonora\s+)?(?:da\s+)?novela\b/i.test(fullText) ||
    /\btrilha\s+nacional\b/i.test(fullText) ||
    /\btrilha\s+internacional\b/i.test(fullText) ||
    /\bnovela\s+(?:nacional|internacional)\b/i.test(fullText) ||
    /\bnovela\s+da\s+(?:globo|tupi|manchete|band)\b/i.test(fullText) ||
    /\brede\s+globo\b/i.test(fullText) ||
    /\bsoap\s+opera\b/i.test(fullText) ||
    /\btelenovela\b/i.test(fullText)
  ) {
    return true;
  }

  // 4. Se tiver a palavra "novela" associada ao título ou artista
  if (title.includes('novela') || artist.includes('novela')) {
    return true;
  }

  // 5. Verifica se o título do álbum bate com novelas consagradas
  const isSoundtrackContext = 
    label.includes('som livre') || 
    genres.some(g => g.includes('stage & screen') || g.includes('soundtrack')) ||
    styles.some(s => s.includes('soundtrack') || s.includes('theme') || s.includes('score')) ||
    /\b(nacional|internacional|vol\.?\s*\d+|trilha)\b/i.test(title) ||
    /v[áa]rios|various/i.test(artist);

  if (NOVELA_TITLES_AND_KEYWORDS.some(novela => title.includes(novela))) {
    // Se o título contém o nome da novela e há contexto de trilha/Som Livre/compilação
    if (isSoundtrackContext || label.includes('som livre') || label.includes('sigla') || fullText.includes('globo')) {
      return true;
    }
    // "Roque Santeiro" ou novelas marcantes mesmo sem menção explícita a trilha no selo
    if (title.includes('roque santeiro') || title.includes('vale tudo') || title.includes('tieta') || title.includes('dancin days') || title.includes('dancin\' days')) {
      return true;
    }
  }

  return false;
}

export function getNovelaInfo(listingOrRelease?: SavedListing | DiscogsRelease | null): {
  isNovela: boolean;
  label: string;
  tag: string;
} {
  const isNov = isNovelaItem(listingOrRelease);
  return {
    isNovela: isNov,
    label: '📺 Trilhas Sonoras de Novela',
    tag: 'Trilha de Novela'
  };
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
    // Do not treat generic VA / compilation labels as physical edition particularities
    const isGenericVaText = /colet[aâ]nea|v[aá]rios\s+artistas|various\s+artists|\bv\.?a\.?\b/i.test(customText);
    if (!isGenericVaText) {
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

export interface MlRoteiroParams {
  release: DiscogsRelease | null;
  condition?: ConditionSelection;
  title: string;
  description: string;
  price: number | string;
  drawer?: string;
}

export function buildMercadoLivreOrderTxt(params: MlRoteiroParams): string {
  const { release, condition, title, description, price, drawer } = params;
  const artist = release?.artist || 'Não informado';
  const album = release?.title || 'Não informado';

  const rawLoc = drawer ? drawer.trim() : '';
  const locClean = cleanLocationCode(rawLoc);
  const locDisplay = locClean ? `[${locClean}]` : '[Sem Localização]';

  const formatInfo = getListingFormatInfo(release);
  const particularities = detectReleaseParticularities(release);

  const mlCategory = formatInfo.type === 'cd'
    ? 'Música, Filmes e Seriados > Música > CDs e DVDs de Música'
    : formatInfo.type === 'dvd'
    ? 'Música, Filmes e Seriados > Música > DVDs de Música'
    : 'Música, Filmes e Seriados > Música > Vinil';

  const isNew = condition?.mediaCondition === 'M';
  const mlCondition = isNew ? 'Novo' : 'Usado';
  const mlFormatAlbum = formatInfo.type === 'cd' ? 'CD' : formatInfo.type === 'dvd' ? 'DVD' : 'Vinil';

  const mlPhysicalFormat = particularities.isDoubleAlbum
    ? 'Álbum Duplo (2 LPs 12")'
    : formatInfo.type === 'vinyl_12_single'
    ? 'Single / Maxi-Single / EP 12" (33/45 RPM)'
    : formatInfo.type === 'vinyl_single'
    ? 'Compacto / Single (7 polegadas, 33/45 RPM)'
    : formatInfo.type === 'vinyl_10'
    ? 'Vinil 10" Polegadas'
    : formatInfo.type === 'cd'
    ? 'CD Áudio Padrão'
    : formatInfo.type === 'dvd'
    ? 'DVD Vídeo/Áudio'
    : 'LP (12 polegadas, 33 ⅓ RPM)';

  const mlYear = release?.year ? String(release.year) : 'Não informado';
  const mlTrackCount = release?.tracklist?.length ? String(release.tracklist.length) : 'Não informado';
  const mlGenre = release?.genres?.length ? release.genres.join(', ') : (release?.styles?.length ? release.styles.join(', ') : 'Rock / MPB');
  const mlLabel = release?.label || 'Independente';
  const mlCountry = release?.country || 'Brasil';
  const mlAlbumCount = particularities.isDoubleAlbum ? '2' : (particularities.isBoxSet ? '3' : '1');
  const mlPackaging = particularities.isGatefold
    ? 'Capa dupla (Gatefold)'
    : particularities.isBoxSet
    ? 'Caixa rígida (Box Set)'
    : formatInfo.type === 'cd'
    ? 'Caixa acrílica padrão'
    : 'Capa simples de papelão com plásticos novos';

  const priceNum = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
  const priceFormatted = priceNum.toFixed(2);

  // Calcula duração aproximada em minutos se houver duração nas faixas
  let totalDurationMinutes = 0;
  if (release?.tracklist && Array.isArray(release.tracklist)) {
    for (const t of release.tracklist) {
      if (t.duration) {
        const parts = t.duration.split(':').map((p: string) => parseInt(p, 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          totalDurationMinutes += parts[0] + parts[1] / 60;
        } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          totalDurationMinutes += parts[0] * 60 + parts[1] + parts[2] / 60;
        }
      }
    }
  }
  const mlDurationFormatted = totalDurationMinutes > 0 ? `${Math.round(totalDurationMinutes)} m` : 'Não se aplica (marcar opção)';

  const mlDiskFormatShort = formatInfo.type === 'vinyl_single' ? 'compacto' : formatInfo.type === 'vinyl_12_single' ? 'single' : formatInfo.type === 'cd' ? 'cd' : 'lp';
  const mlDiskSize = formatInfo.type === 'vinyl_single' ? '7' : formatInfo.type === 'vinyl_10' ? '10' : formatInfo.type === 'cd' ? '5' : '12';
  const mlDiskSpeed = formatInfo.type === 'vinyl_single' ? '45 rpm' : formatInfo.type === 'cd' ? 'Não se aplica' : (formatInfo.defaultSpeed || '33,3 rpm');

  const shippingDims = formatInfo.type === 'vinyl_single'
    ? '20 cm x 20 cm x 2 cm | Peso: 150 g'
    : formatInfo.type === 'vinyl_10'
    ? '28 cm x 28 cm x 2 cm | Peso: 300 g'
    : formatInfo.type === 'cd' || formatInfo.type === 'dvd'
    ? '15 cm x 15 cm x 2 cm | Peso: 120 g'
    : formatInfo.type === 'cassette'
    ? '14 cm x 10 cm x 3 cm | Peso: 100 g'
    : '34 cm x 34 cm x 4 cm | Peso: 500 g';

  return [
    `============================================================`,
    `ROTEIRO DE CADASTRO MERCADO LIVRE - VALDIR DISCOS`,
    `Disco: ${artist} - ${album}`,
    `Localização Física no Acervo: ${locDisplay}`,
    `============================================================`,
    `INSTRUÇÃO: Este arquivo segue a ordem exata das telas de cadastro do Mercado Livre.`,
    `Basta ir recortando (copiando e colando) cada valor diretamente no formulário do Mercado Livre.`,
    ``,
    `------------------------------------------------------------`,
    `TELA 1: O QUE VOCÊ QUER ANUNCIAR?`,
    `------------------------------------------------------------`,
    `ARTISTA / BANDA / INTÉRPRETE:`,
    `${artist}`,
    ``,
    `NOME DO ÁLBUM / TÍTULO:`,
    `${album}`,
    ``,
    `------------------------------------------------------------`,
    `TELA 2: CONDIÇÃO E CATEGORIA`,
    `------------------------------------------------------------`,
    `CONDIÇÃO DO PRODUTO:`,
    `${mlCondition}`,
    ``,
    `CATEGORIA:`,
    `${mlCategory}`,
    ``,
    `------------------------------------------------------------`,
    `TELA 3: TÍTULO DO ANÚNCIO (MÁXIMO 60 CARACTERES)`,
    `------------------------------------------------------------`,
    `TÍTULO (COM LOCALIZAÇÃO FIXADA):`,
    `${cleanTitleRedundancies(title, 'mercadolivre')}`,
    ``,
    `------------------------------------------------------------`,
    `TELA 4: FOTOS DO PRODUTO (SEQUÊNCIA RECOMENDADA)`,
    `------------------------------------------------------------`,
    `Foto 1: Capa Frontal (fundo limpo)`,
    `Foto 2: Contracapa (Verso)`,
    `Foto 3: Selo Central Lado A`,
    `Foto 4: Selo Central Lado B`,
    `Foto 5: Encarte / Letras (se houver)`,
    `Foto 6: Mídia / Superfície do Vinil`,
    ``,
    `------------------------------------------------------------`,
    `TELA 5: CARACTERÍSTICAS SECUNDÁRIAS / FICHA TÉCNICA`,
    `------------------------------------------------------------`,
    `[Campos da Tela "Características secundárias":]`,
    `1. QUANTIDADE DE CANÇÕES:`,
    `${mlTrackCount}`,
    ``,
    `2. FORMATO DO DISCO:`,
    `${mlDiskFormatShort}`,
    ``,
    `3. GÊNEROS MUSICAIS:`,
    `${mlGenre}`,
    ``,
    `4. DURAÇÃO TOTAL DO ÁLBUM:`,
    `${mlDurationFormatted}`,
    ``,
    `5. TAMANHO:`,
    `${mlDiskSize} " (polegadas)`,
    ``,
    `6. ANO DE LANÇAMENTO:`,
    `${mlYear}`,
    ``,
    `7. VELOCIDADE DE ROTAÇÃO:`,
    `${mlDiskSpeed}`,
    ``,
    `[Atributos adicionais da Ficha Técnica / Características Principais:]`,
    `- FORMATO DO ÁLBUM: ${mlFormatAlbum}`,
    `- FORMATO FÍSICO / TIPO: ${mlPhysicalFormat}`,
    `- QUANTIDADE DE DISCOS NO PACOTE: ${mlAlbumCount}`,
    `- GRAVADORA / SELO / COMPANHIA: ${mlLabel}`,
    `- ORIGEM / PAÍS: ${mlCountry}`,
    `- TIPO DE EMBALAGEM: ${mlPackaging}`,
    `- CÓDIGO UNIVERSAL (EAN/UPC): Não se aplica`,
    `- É KIT?: Não`,
    `- COM FAIXAS ADICIONAIS?: Não`,
    ``,
    `------------------------------------------------------------`,
    `TELA 6: PREÇO E ESTOQUE`,
    `------------------------------------------------------------`,
    `PREÇO DE VENDA:`,
    `R$ ${priceFormatted}`,
    ``,
    `QUANTIDADE EM ESTOQUE:`,
    `1`,
    ``,
    `MODALIDADE SUGERIDA:`,
    `Clássico (~14% taxa) ou Premium (~19% taxa com parcelamento sem juros)`,
    ``,
    `------------------------------------------------------------`,
    `TELA 7: ENVIO E GARANTIA (MERCADO ENVIOS)`,
    `------------------------------------------------------------`,
    `DIMENSÕES E PESO DO PACOTE:`,
    `${shippingDims}`,
    ``,
    `GARANTIA DO VENDEDOR:`,
    `Garantia do vendedor: 30 dias`,
    ``,
    `------------------------------------------------------------`,
    `TELA 8: DESCRIÇÃO COMPLETA DO ANÚNCIO`,
    `------------------------------------------------------------`,
    `${description}`,
    ``,
    `============================================================`,
    `FIM DO ROTEIRO MERCADO LIVRE - VALDIR DISCOS`,
    `============================================================`
  ].join('\n');
}

/**
 * Limpa e padroniza o código da gaveta / localização de estoque.
 * Remove rigorosamente qualquer menção a "LOC:", "Loc:", "loc:", "Localização", "Gaveta", "Gav:" e colchetes.
 * Exemplo: "LOC: 4" -> "4", "[Loc: GAV-01]" -> "GAV-01", "Gaveta 12" -> "12"
 */
export function cleanLocationCode(drawer?: string | null): string {
  if (!drawer) return '';
  return String(drawer)
    .trim()
    .replace(/^\[?\s*(?:loc(?:aliza[çc][ãa]o)?|gav(?:eta)?|local|estoque)[\s:.-]*/i, '')
    .replace(/\]\s*$/, '')
    .trim();
}

/**
 * Retorna a tag de localização para inclusão em títulos.
 * NUNCA inclui "LOC:" ou "Loc:" para economizar caracteres preciosos.
 * Exemplo: "4" -> " [4]", "GAV-01" -> " [GAV-01]", "cx01" -> " [cx01]", vazio -> ""
 */
export function formatLocationTag(drawer?: string | null): string {
  const code = cleanLocationCode(drawer);
  return code ? ` [${code}]` : '';
}

/**
 * Elimina todas as redundâncias e desperdícios de caracteres em um título de marketplace (especialmente Mercado Livre).
 * - Remove "LOC:", "Loc:", "loc:", "Gav:" de dentro do título ou de tags como "[Loc: cx01]" -> "[cx01]", "loc: cx01" -> "[cx01]"
 * - Remove prefixos redundantes triplos como "Disco De Vinil LP " -> "LP "
 * - Remove "Disco Vinil LP " -> "LP "
 * - Remove "Vinil LP " -> "LP "
 * - Remove redundâncias de artistas genéricos em coletâneas ("Vários Artistas -", "Various Artists -", "Coletânea -")
 * - Enxuga termos de condição longos no Mercado Livre: "[APENAS DISCO/MÍDIA]" -> "[SEM CAPA]"
 * - Remove espaços duplos e colchetes duplicados/vazios
 */
export function cleanTitleRedundancies(title: string, platform: 'mercadolivre' | 'shopee' = 'mercadolivre'): string {
  if (!title) return '';
  let cleaned = title;

  // 1a. Converte qualquer tag com "Loc:" entre colchetes para código puro: [loc: cx01] -> [cx01]
  cleaned = cleaned.replace(/\[\s*(?:loc(?:aliza[çc][ãa]o)?|gav(?:eta)?|local)[\s:.-]*([^\]]+)\]/gi, '[$1]');
  // 1b. Remove menção a "loc: [X]" -> "[X]"
  cleaned = cleaned.replace(/\b(?:loc(?:aliza[çc][ãa]o)?|gav(?:eta)?|local)[\s:.-]+(\[[^\]]+\])/gi, '$1');
  // 1c. Converte menção solta a "- loc: X" ou "loc: X" no final do título para "[X]"
  cleaned = cleaned.replace(/(?:[-–—]\s*)?\b(?:loc(?:aliza[çc][ãa]o)?|gav(?:eta)?|local)[\s:.-]+([a-zA-Z0-9_-]+)\s*$/gi, ' [$1]');
  // 1d. Se houver "loc: X" no meio do título, converte para "[X]"
  cleaned = cleaned.replace(/(?:[-–—]\s*)?\b(?:loc(?:aliza[çc][ãa]o)?|gav(?:eta)?|local)[\s:.-]+([a-zA-Z0-9_-]+)\b/gi, ' [$1]');
  // 1e. Remove qualquer palavra residual de "loc:", "gaveta:" com dois pontos
  cleaned = cleaned.replace(/\b(?:loc(?:aliza[çc][ãa]o)?|gav(?:eta)?|local)\s*[:]\s*/gi, '');

  // 2. Remove repetições redundantes de formato de vinil
  // "Disco de Vinil LP", "Disco De Vinil LP", "Disco Vinil LP" -> "LP"
  cleaned = cleaned.replace(/^(?:disco\s+de\s+vinil\s+lp|disco\s+vinil\s+lp)\s*[:-]?\s*/i, 'LP ');
  // "Vinil LP" -> "LP" (especialmente no Mercado Livre, onde cada caractere conta)
  cleaned = cleaned.replace(/^vinil\s+lp\s*[:-]?\s*/i, 'LP ');
  // "Disco de Vinil", "Disco Vinil" sem LP -> "Vinil"
  cleaned = cleaned.replace(/^(?:disco\s+de\s+vinil|disco\s+vinil)\s*[:-]?\s*/i, 'Vinil ');

  // 3. Substitui 'Various Artists', 'Vários Artistas' por 'VA' ou 'Coletânea'
  // Remove termos vazios/genéricos de coletânea do início se forem redundantes, ou normaliza para 'VA' / 'Coletânea'
  cleaned = cleaned.replace(/\bvarious\s+artists\b/gi, 'VA');
  cleaned = cleaned.replace(/\bv[áa]rios\s+artistas\b/gi, 'VA');
  cleaned = cleaned.replace(/^(?:v\.?a\.?|colet[âa]nea)\s*[-–—:]\s*/i, '');

  // 4. Encurta avisos de condição no Mercado Livre (onde o limite é 60 caracteres)
  if (platform === 'mercadolivre') {
    cleaned = cleaned.replace(/\[\s*apenas\s+disco(?:\/m[íi]dia)?\s*\]/gi, '[SEM CAPA]');
    cleaned = cleaned.replace(/\[\s*apenas\s+capa(?:\s*\(sem\s+disco\))?\s*\]/gi, '[SEM DISCO]');
    cleaned = cleaned.replace(/\bapenas\s+disco\s*\(sem\s+capa\)/gi, '[SEM CAPA]');
    cleaned = cleaned.replace(/\bapenas\s+capa\s*\(sem\s+disco\)/gi, '[SEM DISCO]');
    cleaned = cleaned.replace(/\[\s*sem\s+disco\s*\]/gi, '[SEM DISCO]');
    cleaned = cleaned.replace(/\[\s*sem\s+capa\s*\]/gi, '[SEM CAPA]');
  }

  // 5. Remove colchetes vazios ou duplicados (ex: "[cx01] [cx01]" -> "[cx01]")
  cleaned = cleaned.replace(/\[\s*\]/g, '');
  cleaned = cleaned.replace(/(\[[^\]]+\])\s*\1/g, '$1');

  // 6. Normaliza espaços múltiplos
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Gera ou ajusta um título otimizado e estritamente limpo de redundâncias,
 * garantindo que a localização esteja no final (se existir) SEM a palavra "LOC:".
 */
export function buildOptimizedTitle(params: {
  artist: string;
  title: string;
  formatType?: string;
  drawer?: string | null;
  platform: 'mercadolivre' | 'shopee';
  isOnlySleeve?: boolean;
  isOnlyMedia?: boolean;
  isMint?: boolean;
  year?: string | number | null;
  customBase?: string;
}): string {
  const {
    artist,
    title,
    formatType = 'vinyl_lp',
    drawer,
    platform,
    isOnlySleeve,
    isOnlyMedia,
    isMint,
    year,
    customBase
  } = params;

  const locTag = formatLocationTag(drawer); // Ex: " [4]"
  const isML = platform === 'mercadolivre';
  const maxLen = isML ? 60 : 115;

  // Prefixo super enxuto por formato (sem redundâncias como "Disco De Vinil LP")
  let prefix = '';
  if (formatType === 'cd') prefix = 'CD ';
  else if (formatType === 'dvd') prefix = 'DVD ';
  else if (formatType === 'cassette') prefix = isML ? 'K7 ' : 'Fita K7 ';
  else if (formatType === 'vinyl_single') prefix = isML ? 'Compacto ' : 'Compacto 7" ';
  else if (formatType === 'vinyl_12_single') prefix = isML ? 'Single ' : 'Single 12" ';
  else if (formatType === 'vinyl_10') prefix = isML ? 'Vinil 10" ' : 'Vinil 10" ';
  else prefix = 'LP '; // LP 12" padrão

  // Sufixo de condição super compacto
  let condSuffix = '';
  if (isOnlySleeve) {
    condSuffix = isML ? ' [SEM DISCO]' : ' [APENAS CAPA]';
  } else if (isOnlyMedia) {
    condSuffix = isML ? ' [SEM CAPA]' : ' [APENAS DISCO]';
  } else if (isMint && !isML) {
    condSuffix = ' NOVO LACRADO';
  }

  // Base do título
  let base = '';
  if (customBase) {
    base = cleanTitleRedundancies(customBase, platform);
    // Remove qualquer prefixo já existente para não duplicar
    base = base.replace(new RegExp(`^${prefix.trim()}\\s*`, 'i'), '').trim();
    // Remove qualquer tag de loc já existente (colchetes ou solta no fim)
    base = base.replace(/\s*\[\s*(?:loc:?\s*)?[^\]]+\]\s*$/gi, '').trim();
    base = base.replace(/(?:[-–—]\s*)?\b(?:loc(?:aliza[çc][ãa]o)?|gav(?:eta)?|local)[\s:.-]*[a-zA-Z0-9_-]+\s*$/gi, '').trim();
  } else {
    // Monta base com Artista - Título
    const cleanArt = (artist || '').trim();
    const cleanTit = (title || '').trim();
    const yearStr = (!isML && year) ? ` (${year})` : '';

    const isVA = /^(?:various\s+artists|v[áa]rios\s+artistas|colet[âa]nea)/i.test(cleanArt);
    if (isVA) {
      base = `${cleanTit}${yearStr}`.trim();
    } else if (cleanArt && cleanTit) {
      base = `${cleanArt} - ${cleanTit}${yearStr}`.trim();
    } else {
      base = `${cleanArt || cleanTit}${yearStr}`.trim();
    }
  }

  // Limita o tamanho respeitando o prefixo, condição e tag de localização
  const totalReserved = prefix.length + condSuffix.length + locTag.length;
  const avail = maxLen - totalReserved;

  if (base.length > avail) {
    // Trunca de forma inteligente
    base = base.slice(0, Math.max(8, avail - 3)).trim() + '...';
  }

  const finalTitle = `${prefix}${base}${condSuffix}${locTag}`.trim();
  return cleanTitleRedundancies(finalTitle, platform).slice(0, maxLen);
}


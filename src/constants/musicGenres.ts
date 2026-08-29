/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MajorGenreGroup {
  id: string;
  name: string;
  emoji: string;
  description: string;
  substyles: string[];
  keywords: string[];
}

export const MAJOR_GENRE_GROUPS: MajorGenreGroup[] = [
  {
    id: 'rap_hiphop',
    name: 'Rap, Hip-Hop & Trap',
    emoji: '🎤',
    description: 'Rap Nacional, Boom Bap 90s, Trap, Golden Era, Conscientious, Gangsta Rap e R&B.',
    substyles: [
      'Rap Nacional',
      'Hip-Hop 90s / Golden Era',
      'Boom Bap',
      'Trap',
      'Gangsta Rap',
      'Conscientious Rap',
      'R&B / Contemporary Soul',
      'Miami Bass / Bass Music',
      'Drill',
      'Jazz Rap / Hip-Hop Jazz',
      'Freestyle / Electro Rap',
      'Instrumental Hip-Hop / Beatmaking',
      'Turntablism / Scratch',
      'Hardcore Hip-Hop',
      'Underground Rap',
      'G-Funk (West Coast)',
      'East Coast Hardcore',
      'Lo-Fi Hip Hop / Chillhop',
      'Grime / UK Drill',
      'Rap SP (Racionais, Sabotage, 509-E)',
      'Rap RJ (Funk & Rap Carioca, MV Bill)',
      'Rap DF / Brasília (Câmbio Negro, GOG)',
      'Rap RS / Nativista Urbano',
      'Gospel Rap / Rap Cristão'
    ],
    keywords: ['rap', 'hip hop', 'hip-hop', 'hiphop', 'trap', 'boom bap', 'r&b', 'miami bass', 'drill', 'turntablism', 'beatmaking', 'racionais', 'sabotage', 'tupac', 'notorious', 'emicida', 'black alien', 'mv bill', 'g-funk']
  },
  {
    id: 'rock',
    name: 'Rock & Rock Clássico',
    emoji: '🎸',
    description: 'Classic Rock, Rock Progressivo, Rock Psicodélico, Hard Rock, Glam e Folk Rock.',
    substyles: [
      'Classic Rock',
      'Hard Rock',
      'Rock Progressivo (Prog Rock)',
      'Rock Psicodélico (Psychedelic)',
      'Rock Nacional / BRock 80',
      'Blues Rock',
      'Folk Rock',
      'Southern Rock',
      'Glam Rock',
      'Garage Rock',
      'Pop Rock',
      'Krautrock',
      'Surf Rock',
      'Art Rock',
      'Space Rock'
    ],
    keywords: ['rock', 'classic rock', 'prog', 'progressive rock', 'psychedelic', 'hard rock', 'folk rock', 'blues rock', 'glam', 'pink floyd', 'led zeppelin', 'beatles', 'rolling stones', 'mutantes', 'raul seixas']
  },
  {
    id: 'heavy_metal',
    name: 'Heavy Metal & Punk',
    emoji: '⚡',
    description: 'Heavy Metal Tradicional, Thrash Metal, Death Metal, Doom, Power Metal e Punk Rock.',
    substyles: [
      'Heavy Metal Tradicional',
      'Thrash Metal',
      'Death Metal',
      'Black Metal',
      'Doom Metal',
      'Power Metal / Speed Metal',
      'Metal Progressivo',
      'Nu Metal / Alternative Metal',
      'Heavy Rock 70s',
      'Punk Rock',
      'Hardcore Punk',
      'Pós-Punk / Gothic Rock',
      'Grunge',
      'Stoner Rock / Sludge'
    ],
    keywords: ['metal', 'heavy metal', 'thrash', 'death metal', 'black metal', 'doom', 'power metal', 'punk', 'hardcore', 'post-punk', 'gothic', 'grunge', 'iron maiden', 'black sabbath', 'metallica', 'sepultura']
  },
  {
    id: 'mpb',
    name: 'MPB & Música Brasileira',
    emoji: '🇧🇷',
    description: 'Bossa Nova, Tropicália, Samba-Canção, Choro, Forró Tradicional, Baião e Clube da Esquina.',
    substyles: [
      'MPB Clássica',
      'Bossa Nova',
      'Tropicália / Tropicalismo',
      'Clube da Esquina',
      'Samba-Canção',
      'Choro / Chorinho',
      'Forró Tradicional / Pé de Serra',
      'Baião / Xote / Xaxado',
      'Maracatu / Coco',
      'Manguebeat',
      'Jovem Guarda',
      'Brega / Cafona',
      'Vanguarda Paulista',
      'Música Nordestina',
      'Violão Brasileiro Instrumental'
    ],
    keywords: ['mpb', 'bossa nova', 'tropicalia', 'tropicalismo', 'samba-cancao', 'choro', 'chorinho', 'forro', 'baiao', 'xote', 'maracatu', 'manguebeat', 'clube da esquina', 'jovem guarda', 'caetano', 'gilberto gil', 'elis regina', 'chico buarque', 'gal costa', 'milton nascimento']
  },
  {
    id: 'samba_pagode',
    name: 'Samba & Pagode',
    emoji: '🥁',
    description: 'Samba de Raiz, Samba-Enredo, Partido Alto, Pagode 90, Samba-Rock e Samba de Gafieira.',
    substyles: [
      'Samba de Raiz',
      'Samba-Enredo (Carnaval)',
      'Partido Alto',
      'Pagode Anos 90',
      'Samba-Rock',
      'Samba-Choro',
      'Samba de Gafieira',
      'Samba Exaltação',
      'Pagode Romântico',
      'Samba de Breque',
      'Velha Guarda do Samba'
    ],
    keywords: ['samba', 'pagode', 'partido alto', 'samba-enredo', 'samba de raiz', 'samba-rock', 'cartola', 'admiran', 'clara nunes', 'beth carvalho', 'zecapagodinho', 'fundo de quintal', 'alcione', 'jorge aragao']
  },
  {
    id: 'jazz_blues',
    name: 'Jazz & Blues',
    emoji: '🎷',
    description: 'Bebop, Hard Bop, Cool Jazz, Jazz Fusion, Chicago Blues, Delta Blues e Vocal Jazz.',
    substyles: [
      'Bebop',
      'Hard Bop',
      'Cool Jazz',
      'Jazz Fusion',
      'Free Jazz / Avant-Garde',
      'Modal Jazz',
      'Vocal Jazz / Standard',
      'Swing / Big Band',
      'Chicago Blues',
      'Delta Blues',
      'Soul Jazz',
      'Latin Jazz / Afro-Cuban',
      'Smooth Jazz',
      'Modern Creative Jazz'
    ],
    keywords: ['jazz', 'blues', 'bebop', 'hard bop', 'cool jazz', 'fusion', 'chicago blues', 'delta blues', 'miles davis', 'john coltrane', 'bill evans', 'thelonious monk', 'b.b. king', 'muddy waters', 'chet baker']
  },
  {
    id: 'eletronica',
    name: 'Eletrônica, Synth & Dance',
    emoji: '🎛️',
    description: 'House, Techno, Trance, Drum & Bass, Synthwave, Electro, Italo Disco e Ambient.',
    substyles: [
      'House / Deep House / Tech House',
      'Techno / Acid Techno / Minimal',
      'Trance / Psytrance / Progressive',
      'Drum & Bass / Jungle',
      'Synthwave / Retrowave / Darksynth',
      'Electro / Electro-Funk',
      'Italo Disco',
      'Eurodance 90s',
      'Ambient / Chillout / Drone',
      'Downtempo / Trip-Hop',
      'Breakbeat / Big Beat',
      'IDM / Experimental Electronic',
      'Industrial / EBM',
      'Hardcore Electronic / Gabber'
    ],
    keywords: ['electronic', 'eletronica', 'techno', 'house', 'trance', 'drum and bass', 'dnb', 'jungle', 'synthwave', 'electro', 'italo disco', 'eurodance', 'ambient', 'trip-hop', 'kraftwerk', 'daft punk', 'prodigy']
  },
  {
    id: 'reggae_dub',
    name: 'Reggae, Dub & Ska',
    emoji: '🟢',
    description: 'Roots Reggae, Dub, Dancehall, Rocksteady, Ska e Reggae Nacional.',
    substyles: [
      'Roots Reggae',
      'Dub',
      'Dancehall / Ragga',
      'Rocksteady',
      'Ska / 2-Tone',
      'Reggae Nacional',
      'Lovers Rock',
      'Dub Poetry',
      'Sound System Culture'
    ],
    keywords: ['reggae', 'dub', 'ska', 'dancehall', 'rocksteady', 'roots reggae', 'bob marley', 'peter tosh', 'lee perry', 'king tubby', 'tribo de jah', 'natiruts']
  },
  {
    id: 'soul_funk_disco',
    name: 'Soul, Funk & Disco',
    emoji: '🪩',
    description: 'Funk Clássico 70s, Disco Music, Soul Music, Motown, Northern Soul e Funk Melody.',
    substyles: [
      'Funk Clássico 70s / P-Funk',
      'Disco Music',
      'Soul Music',
      'Motown Sound',
      'Northern Soul',
      'Neo Soul',
      'Funk Melody / Freestyle',
      'Funk Carioca Original / Charme',
      'Boogie / Post-Disco',
      'Soul Ballad / R&B 70s'
    ],
    keywords: ['soul', 'funk', 'disco', 'motown', 'p-funk', 'boogie', 'neo soul', 'james brown', 'tim maia', 'george clinton', 'stevie wonder', 'aretha franklin', 'marvin gaye', 'earth wind and fire']
  },
  {
    id: 'sertanejo_regional',
    name: 'Sertanejo & Regional',
    emoji: '🌾',
    description: 'Sertanejo Raiz, Moda de Viola, Música Gaúcha, Nativista, Milonga e Chamamé.',
    substyles: [
      'Sertanejo Raiz / Moda de Viola',
      'Sertanejo Clássico 80s / 90s',
      'Música Nativista Gaúcha',
      'Milonga / Chamamé',
      'Vanerão / Vaneira',
      'Música Caipira',
      'Rasqueado',
      'Polca Paraguaia / Guarânia'
    ],
    keywords: ['sertanejo', 'moda de viola', 'caipira', 'gaucho', 'nativista', 'milonga', 'chamame', 'vanerao', 'tião carreiro', 'tonico e tinoco', 'milionario e jose rico', 'teixeirinha', 'chitaozinho']
  },
  {
    id: 'pop_newwave',
    name: 'Pop, New Wave & 80s',
    emoji: '⭐',
    description: '80s Pop, Synth-Pop, New Wave, Post-Punk, Indie Pop e Dream Pop.',
    substyles: [
      '80s Pop Clássico',
      'Synth-Pop',
      'New Wave',
      'Post-Punk',
      'Indie Pop / Indie Rock',
      'Dream Pop / Shoegaze',
      'Pop 70s / 60s',
      'Europop',
      'Dance Pop'
    ],
    keywords: ['pop', 'new wave', 'synth-pop', 'synthpop', 'post-punk', 'indie', 'madonna', 'michael jackson', 'depeche mode', 'new order', 'the cure', 'duranduran']
  },
  {
    id: 'instrumental_soundtracks',
    name: 'Instrumental, Erudito & Trilhas',
    emoji: '🎻',
    description: 'Trilhas Sonoras de Filmes/Novelas, Música Clássica/Erudita, Orquestral e New Age.',
    substyles: [
      'Trilha Sonora de Cinema (OST)',
      'Trilha Sonora de Novela (Nacional / Internacional)',
      'Música Clássica / Erudita (Barroco, Clássico, Romântico)',
      'Instrumental Brasileiro / Violão Solo',
      'Orquestral / Big Band Instrumental',
      'New Age / Meditação',
      'Easy Listening / Lounge'
    ],
    keywords: ['soundtrack', 'trilha sonora', 'ost', 'classical', 'classica', 'erudito', 'instrumental', 'violao', 'orquestral', 'morricone', 'john williams', 'bach', 'beethoven', 'chopin']
  },
  {
    id: 'latin_world',
    name: 'Música Latina & World Music',
    emoji: '🌎',
    description: 'Salsa, Cumbia, Bolero, Tango, Mambo, Merengue, Flamenco, Chicha e ritmos afro-caribenhos.',
    substyles: [
      'Bolero Tradicional',
      'Tango Argentino',
      'Salsa / Salsa Dura',
      'Cumbia (Colombiana, Peruana, Chicha)',
      'Mambo / Cha-cha-chá',
      'Merengue',
      'Bachata',
      'Flamenco / Rumba',
      'Afrobeat / Highlife',
      'Música Folclórica Andina',
      'Reggaeton Clássico'
    ],
    keywords: ['latina', 'latin', 'salsa', 'cumbia', 'bolero', 'tango', 'mambo', 'merengue', 'flamenco', 'afrobeat', 'fania', 'gardel', 'piazzolla', 'celia cruz', 'buena vista']
  },
  {
    id: 'gospel_religioso',
    name: 'Gospel & Religioso',
    emoji: '🕊️',
    description: 'Gospel Nacional, Louvor & Adoração, Harpa Cristã, Black Gospel e Coral.',
    substyles: [
      'Gospel Tradicional / Harpa Cristã',
      'Louvor & Adoração (Praise)',
      'Gospel Contemporâneo',
      'Black Gospel / Spiritual',
      'Rock Gospel / Metal Cristão',
      'Coral Evangélico / Orquestrado',
      'Música Católica Tradicional / Pe. Zezinho'
    ],
    keywords: ['gospel', 'cristao', 'cristã', 'louvor', 'adoracao', 'adoração', 'harpa crista', 'harpa', 'coral', 'religioso', 'evangelico']
  }
];

// Key for persistent custom substyles registered by users in their browser
const CUSTOM_SUBSTYLES_KEY = 'valdir_custom_music_substyles_v1';

/**
 * Retrieves all custom substyles registered dynamically by the user
 */
export function getSavedCustomSubstyles(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SUBSTYLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a new custom substyle dynamically so it becomes available in subsequent registrations
 */
export function saveCustomSubstyle(substyle: string): string[] {
  const clean = substyle.trim();
  if (!clean) return getSavedCustomSubstyles();
  
  try {
    const current = getSavedCustomSubstyles();
    if (!current.some(s => s.toLowerCase() === clean.toLowerCase())) {
      const updated = [...current, clean];
      localStorage.setItem(CUSTOM_SUBSTYLES_KEY, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch {
    return [];
  }
}

/**
 * Returns all available substyles (curated + user-added)
 */
export function getAllAvailableSubstyles(): string[] {
  const base = MAJOR_GENRE_GROUPS.flatMap(g => g.substyles);
  const custom = getSavedCustomSubstyles();
  const set = new Set<string>();
  
  base.forEach(s => set.add(s));
  custom.forEach(s => set.add(s));
  
  return Array.from(set);
}

/**
 * Matches a release's genres/styles against the major genre group
 */
export function matchMajorGenre(genres: string[] = [], styles: string[] = [], targetGroupId: string): boolean {
  if (targetGroupId === 'all') return true;
  
  const group = MAJOR_GENRE_GROUPS.find(g => g.id === targetGroupId);
  if (!group) return false;
  
  const allTerms = [...genres, ...styles].map(s => (s || '').toLowerCase().trim());
  if (allTerms.length === 0) return false;
  
  return group.keywords.some(kw => {
    return allTerms.some(term => term.includes(kw) || kw.includes(term));
  });
}

import { CuratedPlaylist } from '../types';

export const CURATED_PLAYLISTS: CuratedPlaylist[] = [
  {
    id: 'pl-samba-rock-raiz',
    title: 'Samba-Rock & Suingue de Baile - Curadoria Valdir',
    curator: 'Valdir Discos • Santa Maria / RS',
    description: 'A nata do samba-rock, samba-soul e suingue dos anos 70 e 80. Seleção pesada com Jorge Ben, Bebeto, Trio Mocotó, Originais do Samba e Marku Ribas.',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    youtubeMusicUrl: 'https://music.youtube.com/search?q=Samba+Rock+Classicos+Anos+70',
    spotifyUrl: 'https://open.spotify.com/search/Samba%20Rock%20Classicos',
    embedYoutubeId: 'dQw4w9WgXcQ',
    genre: 'Samba-Rock',
    tracksCount: 28,
    totalDuration: '1h 48min',
    tags: ['Samba-Rock', 'Bebeto', 'Jorge Ben', 'Suingue', 'Baile'],
    featuredTracks: [
      { title: 'Menina Carolina', artist: 'Bebeto', duration: '03:42' },
      { title: 'Zazueira', artist: 'Marku Ribas', duration: '03:15' },
      { title: 'Mas Que Nada', artist: 'Jorge Ben', duration: '03:02' },
      { title: 'Não Adianta', artist: 'Trio Mocotó', duration: '03:40' },
      { title: 'Esperanças Perdidas', artist: 'Os Originais do Samba', duration: '03:28' }
    ]
  },
  {
    id: 'pl-mpb-rara-70',
    title: 'Raridades e Pérolas da MPB dos Anos 70',
    curator: 'Valdir Discos • Santa Maria / RS',
    description: 'Discos prensados nos tempos de ouro da música brasileira. Psiquedelia, bossa moderna, arranjos de cordas lendários de Rogério Duprat e Arthur Verocai.',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    youtubeMusicUrl: 'https://music.youtube.com/search?q=MPB+Raridades+Anos+70+Psicodelia',
    spotifyUrl: 'https://open.spotify.com/search/MPB%20Raridades%20Anos%2070',
    genre: 'MPB / Psicodelia',
    tracksCount: 32,
    totalDuration: '2h 10min',
    tags: ['MPB Rara', 'Arthur Verocai', 'Som Imaginário', 'Lô Borges', 'Clube da Esquina'],
    featuredTracks: [
      { title: 'Na Boca do Sol', artist: 'Arthur Verocai', duration: '02:54' },
      { title: 'Trem Azul', artist: 'Lô Borges', duration: '03:26' },
      { title: 'Gita', artist: 'Raul Seixas', duration: '04:50' },
      { title: 'Canto de Ossanha', artist: 'Baden Powell & Vinicius', duration: '03:22' },
      { title: 'Feira Moderna', artist: 'Som Imaginário', duration: '03:40' }
    ]
  },
  {
    id: 'pl-gauchos-nativismo',
    title: 'Vozes e Milongas do Sul - Santa Maria no Vinil',
    curator: 'Valdir Discos • Santa Maria / RS',
    description: 'A alma nativista gaúcha registrada em vinil. Clássicos dos festivais da Califórnia da Canção Nativa e Coxilha Nativista, com acordeons de 8 baixos e violões missioneirros.',
    coverImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
    youtubeMusicUrl: 'https://music.youtube.com/search?q=Musica+Gaucha+Nativista+California+da+Cancao',
    spotifyUrl: 'https://open.spotify.com/search/Musica%20Gaucha%20Nativista',
    genre: 'Nativista Gaúcha',
    tracksCount: 24,
    totalDuration: '1h 35min',
    tags: ['Santa Maria RS', 'Nativismo', 'Milonga', 'Borghettinho', 'Teixeirinha'],
    featuredTracks: [
      { title: 'Gaudêncio Sete Luas', artist: 'Luiz Carlos Borges', duration: '04:12' },
      { title: 'Milonga Para as Missões', artist: 'Renato Borghetti', duration: '03:45' },
      { title: 'Querência Amada', artist: 'Teixeirinha', duration: '03:18' },
      { title: 'Desgarrados', artist: 'Mario Barbará', duration: '04:30' },
      { title: 'Veterano', artist: 'Leopoldo Rassier', duration: '03:50' }
    ]
  },
  {
    id: 'pl-boogie-funk-brasil',
    title: 'Boogie, Soul & Flashback Nacional (1976-1985)',
    curator: 'Valdir Discos • Santa Maria / RS',
    description: 'Para quem ama a pista de dança com linha de baixo marcante, sintetizadores analógicos Minimoog e produções de Lincoln Olivetti.',
    coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    youtubeMusicUrl: 'https://music.youtube.com/search?q=Brazilian+Boogie+Funk+Lincoln+Olivetti',
    spotifyUrl: 'https://open.spotify.com/search/Brazilian%20Boogie%20Funk',
    genre: 'Boogie & Funk',
    tracksCount: 30,
    totalDuration: '1h 55min',
    tags: ['Boogie', 'Soul', 'Disco', 'Lincoln Olivetti', 'Tim Maia'],
    featuredTracks: [
      { title: 'Sossego', artist: 'Tim Maia', duration: '03:44' },
      { title: 'Chega Mais', artist: 'Rita Lee', duration: '03:50' },
      { title: 'Eva', artist: 'Robson Jorge & Lincoln Olivetti', duration: '05:40' },
      { title: 'Bicicleta', artist: 'Marcos Valle', duration: '04:35' },
      { title: 'Dança do Dragão', artist: 'Banda Black Rio', duration: '03:15' }
    ]
  }
];

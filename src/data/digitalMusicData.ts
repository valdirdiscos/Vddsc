import { DigitalAlbumProduct } from '../types';

export const DIGITAL_ALBUM_PRODUCTS: DigitalAlbumProduct[] = [
  {
    id: 'dig-tim-racional-1',
    title: 'Tim Maia Racional Vol. 1 (Digital Master 24-bit/96kHz)',
    artist: 'Tim Maia',
    year: 1975,
    genre: 'Soul & Funk Brasileiro',
    coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    description: 'Obra-prima rara da fase Racional digitalizada direto de prensagem original Seroma em mesa Technics SL-1200MK7 com cápsula Ortofon 2M Black. Áudio limpo, dinâmico e preservado sem compressão excessiva.',
    albumPrice: 24.90,
    originalPrice: 35.00,
    audioFormats: ['WAV', 'FLAC', 'MP3'],
    ripSource: 'Rip de Vinil Original Seroma 1975 • Technics SL-1200MK7 + Preamp Cambridge Audio Duo • 24-bit / 96kHz Lossless',
    isHiRes: true,
    fileSizeMB: 480,
    badge: 'Master 24-bit Hi-Res',
    tags: ['Soul', 'Funk', 'Racional', 'Raridade'],
    youtubeMusicUrl: 'https://music.youtube.com/search?q=Tim+Maia+Racional+Vol+1',
    spotifyUrl: 'https://open.spotify.com/search/Tim%20Maia%20Racional%20Vol%201',
    tracks: [
      {
        id: 'tr-tim-01',
        trackNumber: 1,
        title: 'Imunização Racional (Que Beleza)',
        artist: 'Tim Maia',
        duration: '04:08',
        individualPrice: 4.50,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz Lossless',
        bpm: 104,
        key: 'A Minor'
      },
      {
        id: 'tr-tim-02',
        trackNumber: 2,
        title: 'Bom Senso',
        artist: 'Tim Maia',
        duration: '05:07',
        individualPrice: 4.50,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz Lossless',
        bpm: 98,
        key: 'D Major'
      },
      {
        id: 'tr-tim-03',
        trackNumber: 3,
        title: 'O Grão Mestre Varonil',
        artist: 'Tim Maia',
        duration: '03:12',
        individualPrice: 4.50,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz Lossless',
        bpm: 110,
        key: 'G Major'
      },
      {
        id: 'tr-tim-04',
        trackNumber: 4,
        title: 'Contacto Com O Mundo Racional',
        artist: 'Tim Maia',
        duration: '03:04',
        individualPrice: 4.50,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz Lossless',
        bpm: 116,
        key: 'E Minor'
      },
      {
        id: 'tr-tim-05',
        trackNumber: 5,
        title: 'Universo Em Desencanto',
        artist: 'Tim Maia',
        duration: '04:14',
        individualPrice: 4.50,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz Lossless',
        bpm: 92,
        key: 'C Major'
      }
    ]
  },
  {
    id: 'dig-jorge-ben-tabua',
    title: 'A Tábua de Esmeralda (Audiophile Vinyl Rip)',
    artist: 'Jorge Ben',
    year: 1974,
    genre: 'Samba-Rock / Alquimia',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    description: 'Um dos discos mais aclamados da história da música brasileira. Digitalização analógica de alta fidelidade com graves profundos do violão e percussão viva.',
    albumPrice: 22.90,
    originalPrice: 30.00,
    audioFormats: ['WAV', 'FLAC', 'MP3'],
    ripSource: 'Prensagem Philips 1974 Stereo • Cápsula Shure M44-7 • Interface Audient iD14 24-bit/96kHz',
    isHiRes: true,
    fileSizeMB: 512,
    badge: 'Gravação Audiófila',
    tags: ['Samba-Rock', 'Jorge Ben', 'Violão', 'Clássico'],
    youtubeMusicUrl: 'https://music.youtube.com/search?q=Jorge+Ben+A+Tabua+de+Esmeralda',
    spotifyUrl: 'https://open.spotify.com/search/Jorge%20Ben%20A%20Tabua%20de%20Esmeralda',
    tracks: [
      {
        id: 'tr-jb-01',
        trackNumber: 1,
        title: 'Os Alquimistas Estão Chegando Os Alquimistas',
        artist: 'Jorge Ben',
        duration: '03:14',
        individualPrice: 3.90,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz',
        bpm: 112
      },
      {
        id: 'tr-jb-02',
        trackNumber: 2,
        title: 'O Homem Da Gravata Florida',
        artist: 'Jorge Ben',
        duration: '03:05',
        individualPrice: 3.90,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz',
        bpm: 106
      },
      {
        id: 'tr-jb-03',
        trackNumber: 3,
        title: 'Errare Humanum Est',
        artist: 'Jorge Ben',
        duration: '04:50',
        individualPrice: 3.90,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz',
        bpm: 90
      },
      {
        id: 'tr-jb-04',
        trackNumber: 4,
        title: 'Menina Mulher Da Pele Preta',
        artist: 'Jorge Ben',
        duration: '02:56',
        individualPrice: 3.90,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz',
        bpm: 120
      },
      {
        id: 'tr-jb-05',
        trackNumber: 5,
        title: 'Zumbi',
        artist: 'Jorge Ben',
        duration: '03:30',
        individualPrice: 3.90,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz',
        bpm: 96
      }
    ]
  },
  {
    id: 'dig-gauchos-vinil-vol1',
    title: 'Gauchismo & Milonga no Vinil - Sessão Santa Maria RS',
    artist: 'Vários Artistas Nativistas',
    year: 1982,
    genre: 'Música Regional Gaúcha',
    coverImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
    description: 'Curadoria especial do acervo de Santa Maria - RS: milongas raras, chamamés e vaneirões digitalizados direto de LPs históricos do Rio Grande do Sul.',
    albumPrice: 19.90,
    originalPrice: 28.00,
    audioFormats: ['WAV', 'FLAC', 'MP3'],
    ripSource: 'Acervo Valdir Discos Santa Maria RS • Vinis Originais Som/Chantecler • 24-bit/48kHz',
    isHiRes: true,
    fileSizeMB: 390,
    badge: 'Tradição RS',
    tags: ['Gaúcho', 'Milonga', 'Santa Maria RS', 'Acervo Histórico'],
    youtubeMusicUrl: 'https://music.youtube.com/search?q=Musica+Nativista+Gaucha+Milonga',
    spotifyUrl: 'https://open.spotify.com/search/Musica%20Nativista%20Gaucha',
    tracks: [
      {
        id: 'tr-rs-01',
        trackNumber: 1,
        title: 'Milonga para as Missões',
        artist: 'Renato Borghetti & Amigos',
        duration: '03:45',
        individualPrice: 3.50,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 48kHz'
      },
      {
        id: 'tr-rs-02',
        trackNumber: 2,
        title: 'Vento Negro',
        artist: 'Fito Paez & Gaúchos',
        duration: '04:10',
        individualPrice: 3.50,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 48kHz'
      },
      {
        id: 'tr-rs-03',
        trackNumber: 3,
        title: 'Desgarrados',
        artist: 'Mario Barbará',
        duration: '04:30',
        individualPrice: 3.50,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 48kHz'
      },
      {
        id: 'tr-rs-04',
        trackNumber: 4,
        title: 'Canto dos Livres',
        artist: 'Cenair Maicá',
        duration: '03:55',
        individualPrice: 3.50,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 48kHz'
      }
    ]
  },
  {
    id: 'dig-boogie-brasil-70',
    title: 'Brazilian Boogie & Disco Funk 1977-1984',
    artist: 'Valdir Discos Selection',
    year: 1981,
    genre: 'Boogie / Funk 70s & 80s',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    description: 'Coletânea de compactos e 12 polegadas raríssimos de pista do baile black nacional. Prensagens originais de época tratadas contra ruídos para DJs e colecionadores.',
    albumPrice: 26.90,
    originalPrice: 38.00,
    audioFormats: ['WAV', 'FLAC', 'MP3'],
    ripSource: 'Prensagens 12" Maxi-Single Promo • Technics 1200 + Ortofon Concorde Digital • 24-bit/96kHz',
    isHiRes: true,
    fileSizeMB: 540,
    badge: 'Seleção DJ Raridade',
    tags: ['Boogie', 'Disco', 'Baile Black', '12 Polegadas'],
    youtubeMusicUrl: 'https://music.youtube.com/search?q=Brazilian+Boogie+Funk+70s',
    spotifyUrl: 'https://open.spotify.com/search/Brazilian%20Boogie%20Funk',
    tracks: [
      {
        id: 'tr-bg-01',
        trackNumber: 1,
        title: 'Baile dos Ratos (Extended 12" Mix)',
        artist: 'Banda Black Rio',
        duration: '05:22',
        individualPrice: 4.90,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz',
        bpm: 118
      },
      {
        id: 'tr-bg-02',
        trackNumber: 2,
        title: 'Estrelar (Special Dance Edit)',
        artist: 'Marcos Valle',
        duration: '05:08',
        individualPrice: 4.90,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz',
        bpm: 122
      },
      {
        id: 'tr-bg-03',
        trackNumber: 3,
        title: 'Voar (Versão Estendida)',
        artist: 'Robson Jorge & Lincoln Olivetti',
        duration: '04:45',
        individualPrice: 4.90,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz',
        bpm: 114
      },
      {
        id: 'tr-bg-04',
        trackNumber: 4,
        title: 'A Noite Vai Chegar',
        artist: 'Lady Zu',
        duration: '04:15',
        individualPrice: 4.90,
        audioFormats: ['WAV', 'FLAC', 'MP3'],
        sampleRate: '24-bit / 96kHz',
        bpm: 126
      }
    ]
  }
];

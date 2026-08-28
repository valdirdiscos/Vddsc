import { SavedListing } from '../types';

export const SEED_LISTINGS: SavedListing[] = [
  {
    id: 'listing-clube-da-esquina-1972',
    barcode: 'VD-001972',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    status: 'available',
    drawer: 'Gaveta A1 - MPB Clássicos',
    quantity: 1,
    salesChannels: ['online_store', 'physical_store'],
    isOnlineExclusive: true,
    onlineExclusiveDetails: 'Prensagem original Odeon 1972 com capa dupla gatefold e encarte duplo completo. Matriz estereofônica audiófila preservada.',
    isDoubleAlbum: true,
    isGatefold: true,
    isBoxSet: false,
    isSpecialEdition: true,
    hasInsert: true,
    specialEditionDetails: 'Álbum Duplo Gatefold Odeon Estéreo 1972 com encartes originais',
    release: {
      id: 101,
      title: 'Clube da Esquina',
      artist: 'Milton Nascimento & Lô Borges',
      year: 1972,
      country: 'Brasil',
      label: 'Odeon',
      catno: 'SMOB-1017/18',
      coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
      genres: ['MPB', 'Psicodelia', 'Folk'],
      styles: ['MPB', 'Bossa Nova', 'Psychedelic Rock'],
      formats: [{ name: 'Vinyl', qty: '2', descriptions: ['LP', 'Album', 'Gatefold'] }],
      tracklist: [
        { position: 'A1', title: 'Tudo Que Você Podia Ser', duration: '2:56' },
        { position: 'A2', title: 'Cais', duration: '2:45' },
        { position: 'A3', title: 'O Trem Azul', duration: '4:05' },
        { position: 'B1', title: 'Cravo e Canela', duration: '2:31' },
        { position: 'C1', title: 'San Vicente', duration: '2:46' },
        { position: 'D1', title: 'Um Girassol Da Cor Do Seu Cabelo', duration: '4:12' }
      ]
    },
    condition: {
      mediaCondition: 'NM',
      mediaDetails: 'Discos com brilho original impecável, reprodução silenciosa.',
      sleeveCondition: 'EX',
      sleeveDetails: 'Capa dupla gatefold sem amassados nem fitas adesivas.',
      hasInsert: true,
      insertCondition: 'NM',
      insertDetails: 'Encarte duplo original intacto.'
    },
    pricing: {
      costPrice: 280,
      basePriceBrl: 580,
      exchangeRate: 5.6,
      useExchange: false,
      shopeeCommissionPercent: 14,
      shopeeFixedFee: 4,
      packagingCost: 5,
      profitMarginPercent: 25,
      mode: 'direct',
      directPrice: 580
    },
    shopee: {
      title: 'LP Duplo Milton Nascimento Lô Borges Clube da Esquina 1972 Gatefold',
      description: 'Exemplar de colecionador. Álbum duplo original Odeon 1972 com capa dupla e encarte duplo.',
      suggestedPrice: 580,
      hashtags: ['#vinil', '#mpb', '#clubedaesquina', '#raridade']
    }
  },
  {
    id: 'listing-led-zeppelin-box-remasters',
    barcode: 'VD-004481',
    createdAt: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
    status: 'available',
    drawer: 'Gaveta B3 - Hard Rock / Box',
    quantity: 1,
    salesChannels: ['online_store'],
    isOnlineExclusive: true,
    onlineExclusiveDetails: 'Box Set de Luxo com 4 LPs em vinil virgem audiófilo de 180g remasterizados sob supervisão de Jimmy Page.',
    isDoubleAlbum: true,
    isBoxSet: true,
    isSpecialEdition: true,
    isGatefold: true,
    hasInsert: true,
    specialEditionDetails: 'Box Set Luxo 4xLP 180g + Livreto Ilustrado 36 Páginas',
    release: {
      id: 102,
      title: 'Led Zeppelin Box Set (Remasters Deluxe)',
      artist: 'Led Zeppelin',
      year: 1990,
      country: 'Reino Unido / UK',
      label: 'Atlantic',
      catno: '7567-82144-1',
      coverImage: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80',
      genres: ['Rock', 'Hard Rock', 'Blues Rock'],
      styles: ['Classic Rock', 'Heavy Rock'],
      formats: [{ name: 'Vinyl', qty: '4', descriptions: ['LP', 'Box Set', 'Compilation', 'Remastered'] }],
      tracklist: [
        { position: 'A1', title: 'Whole Lotta Love', duration: '5:34' },
        { position: 'A2', title: 'Heartbreaker', duration: '4:14' },
        { position: 'B1', title: 'Stairway To Heaven', duration: '8:02' },
        { position: 'C1', title: 'Kashmir', duration: '8:32' }
      ]
    },
    condition: {
      mediaCondition: 'M',
      mediaDetails: '4 LPs lacrados / novos sem qualquer sinal de uso.',
      sleeveCondition: 'NM',
      sleeveDetails: 'Box rígido impecável com livro interno intacto.',
      hasInsert: true,
      insertCondition: 'NM',
      insertDetails: 'Livreto ilustrado de 36 páginas perfeito.'
    },
    pricing: {
      costPrice: 420,
      basePriceBrl: 890,
      exchangeRate: 5.6,
      useExchange: false,
      shopeeCommissionPercent: 14,
      shopeeFixedFee: 4,
      packagingCost: 8,
      profitMarginPercent: 30,
      mode: 'direct',
      directPrice: 890
    },
    shopee: {
      title: 'Box Set 4 LPs Led Zeppelin Remasters Deluxe Vinil 180g Livreto',
      description: 'Caixa de colecionador Led Zeppelin com 4 LPs audiófilos.',
      suggestedPrice: 890,
      hashtags: ['#ledzeppelin', '#rock', '#boxset', '#vinildecolecao']
    }
  },
  {
    id: 'listing-pink-floyd-dark-side',
    barcode: 'VD-007391',
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    status: 'available',
    drawer: 'Gaveta A2 - Rock Prog',
    quantity: 1,
    salesChannels: ['online_store', 'physical_store'],
    isOnlineExclusive: false,
    isDoubleAlbum: false,
    isBoxSet: false,
    isGatefold: true,
    isSpecialEdition: false,
    hasInsert: true,
    specialEditionDetails: 'Capa Dupla Gatefold com Encarte e Pôsteres Originais',
    release: {
      id: 103,
      title: 'The Dark Side of the Moon',
      artist: 'Pink Floyd',
      year: 1973,
      country: 'Reino Unido / UK',
      label: 'Harvest',
      catno: 'SHVL-804',
      coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      genres: ['Rock', 'Progressive Rock'],
      styles: ['Psychedelic Rock', 'Art Rock'],
      formats: [{ name: 'Vinyl', qty: '1', descriptions: ['LP', 'Gatefold'] }],
      tracklist: [
        { position: 'A1', title: 'Speak To Me / Breathe', duration: '3:58' },
        { position: 'A2', title: 'Time', duration: '7:05' },
        { position: 'B1', title: 'Money', duration: '6:22' },
        { position: 'B2', title: 'Us And Them', duration: '7:49' }
      ]
    },
    condition: {
      mediaCondition: 'EX',
      mediaDetails: 'Vinil muito limpo, riscos levíssimos superficiais.',
      sleeveCondition: 'EX',
      sleeveDetails: 'Capa dupla com o famoso prisma, ótima conservação.',
      hasInsert: true,
      insertCondition: 'EX',
      insertDetails: 'Pôsteres e adesivos inclusos.'
    },
    pricing: {
      costPrice: 120,
      basePriceBrl: 260,
      exchangeRate: 5.6,
      useExchange: false,
      shopeeCommissionPercent: 14,
      shopeeFixedFee: 4,
      packagingCost: 4,
      profitMarginPercent: 20,
      mode: 'direct',
      directPrice: 260
    },
    shopee: {
      title: 'LP Pink Floyd The Dark Side of the Moon Capa Dupla Gatefold Harvest',
      description: 'Clássico absoluto do rock progressivo com capa dupla e encartes.',
      suggestedPrice: 260,
      hashtags: ['#pinkfloyd', '#progrock', '#darksideofthemoon']
    }
  },
  {
    id: 'listing-the-beatles-white-album',
    barcode: 'VD-006899',
    createdAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
    status: 'available',
    drawer: 'Gaveta A3 - Beatles & British Invasion',
    quantity: 1,
    salesChannels: ['online_store'],
    isOnlineExclusive: true,
    onlineExclusiveDetails: 'Edição numerada com capa dupla gatefold em relevo, incluindo 4 retratos em foto-card e pôster lírico completo.',
    isDoubleAlbum: true,
    isBoxSet: false,
    isGatefold: true,
    isSpecialEdition: true,
    hasInsert: true,
    specialEditionDetails: 'Álbum Duplo Gatefold Numerado com 4 Fotos dos Beatles + Pôster',
    release: {
      id: 104,
      title: 'The Beatles (White Album)',
      artist: 'The Beatles',
      year: 1968,
      country: 'Reino Unido / UK',
      label: 'Apple Records',
      catno: 'PCS-7067/8',
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      genres: ['Rock', 'Pop Rock'],
      styles: ['Psychedelic Rock', 'Experimental', 'Blues Rock'],
      formats: [{ name: 'Vinyl', qty: '2', descriptions: ['LP', 'Album', 'Numbered', 'Gatefold'] }],
      tracklist: [
        { position: 'A1', title: 'Back in the U.S.S.R.', duration: '2:43' },
        { position: 'A2', title: 'Dear Prudence', duration: '3:56' },
        { position: 'B1', title: 'While My Guitar Gently Weeps', duration: '4:45' },
        { position: 'C1', title: 'Birthday', duration: '2:42' },
        { position: 'D1', title: 'Revolution 1', duration: '4:15' }
      ]
    },
    condition: {
      mediaCondition: 'NM',
      mediaDetails: 'Ambos os discos em estado brilhante quase novo.',
      sleeveCondition: 'EX',
      sleeveDetails: 'Capa branca limpa com número estampado em baixo-relevo.',
      hasInsert: true,
      insertCondition: 'NM',
      insertDetails: 'Quatro retratos originais e pôster lírico completos.'
    },
    pricing: {
      costPrice: 220,
      basePriceBrl: 490,
      exchangeRate: 5.6,
      useExchange: false,
      shopeeCommissionPercent: 14,
      shopeeFixedFee: 4,
      packagingCost: 5,
      profitMarginPercent: 25,
      mode: 'direct',
      directPrice: 490
    },
    shopee: {
      title: 'LP Duplo The Beatles White Album Álbum Branco Numerado Gatefold',
      description: 'Edição de colecionador álbum duplo com fotos individuais e pôster.',
      suggestedPrice: 490,
      hashtags: ['#thebeatles', '#whitealbum', '#vinilduplo', '#raro']
    }
  },
  {
    id: 'listing-tim-maia-racional-1',
    barcode: 'VD-001975',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    status: 'available',
    drawer: 'Gaveta A1 - Soul / Funk Brasil',
    quantity: 1,
    salesChannels: ['online_store'],
    isOnlineExclusive: true,
    onlineExclusiveDetails: 'Raridade suprema do soul brasileiro. Prensagem independente Seroma 1975.',
    isDoubleAlbum: false,
    isBoxSet: false,
    isGatefold: false,
    isSpecialEdition: true,
    hasInsert: true,
    specialEditionDetails: 'Tiragem Original Rara Selo Seroma 1975',
    release: {
      id: 105,
      title: 'Tim Maia Racional Vol. 1',
      artist: 'Tim Maia',
      year: 1975,
      country: 'Brasil',
      label: 'Seroma',
      catno: 'SR-1001',
      coverImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
      genres: ['Funk / Soul', 'MPB'],
      styles: ['Soul', 'Funk', 'Disco'],
      formats: [{ name: 'Vinyl', qty: '1', descriptions: ['LP', 'Album'] }],
      tracklist: [
        { position: 'A1', title: 'Imunização Racional (Que Beleza)', duration: '4:08' },
        { position: 'A2', title: 'O Caminho do Bem', duration: '6:04' },
        { position: 'B1', title: 'Bom Senso', duration: '5:07' }
      ]
    },
    condition: {
      mediaCondition: 'VG+',
      mediaDetails: 'Marcas estéticas de época, áudio vigoroso sem pulos.',
      sleeveCondition: 'VG',
      sleeveDetails: 'Capa simples com leve desgaste natural do tempo.',
      hasInsert: true,
      insertCondition: 'VG+',
      insertDetails: 'Acompanha folheto Seroma.'
    },
    pricing: {
      costPrice: 400,
      basePriceBrl: 850,
      exchangeRate: 5.6,
      useExchange: false,
      shopeeCommissionPercent: 14,
      shopeeFixedFee: 4,
      packagingCost: 5,
      profitMarginPercent: 25,
      mode: 'direct',
      directPrice: 850
    },
    shopee: {
      title: 'LP Tim Maia Racional Vol. 1 Original Seroma 1975 Raro',
      description: 'Clássico atemporal da fase Universo em Desencanto com Que Beleza.',
      suggestedPrice: 850,
      hashtags: ['#timmaia', '#racional', '#soulbrasil', '#raridade']
    }
  },
  {
    id: 'listing-elis-regina-tom-jobim',
    barcode: 'VD-001974',
    createdAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    status: 'available',
    drawer: 'Gaveta A1 - MPB Clássicos',
    quantity: 1,
    salesChannels: ['online_store', 'physical_store'],
    isOnlineExclusive: false,
    isDoubleAlbum: false,
    isBoxSet: false,
    isGatefold: true,
    isSpecialEdition: true,
    hasInsert: true,
    specialEditionDetails: 'Edição Especial Audiófila em Vinil Pesado 180g Capa Dupla',
    release: {
      id: 106,
      title: 'Elis & Tom',
      artist: 'Elis Regina & Antonio Carlos Jobim',
      year: 1974,
      country: 'Brasil',
      label: 'Philips',
      catno: '6349 112',
      coverImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
      genres: ['MPB', 'Bossa Nova'],
      styles: ['Bossa Nova', 'Samba'],
      formats: [{ name: 'Vinyl', qty: '1', descriptions: ['LP', 'Album', 'Gatefold'] }],
      tracklist: [
        { position: 'A1', title: 'Águas de Março', duration: '3:32' },
        { position: 'A2', title: 'Pois É', duration: '1:43' },
        { position: 'B1', title: 'Corcovado', duration: '3:56' },
        { position: 'B2', title: 'Retrato em Branco e Preto', duration: '3:03' }
      ]
    },
    condition: {
      mediaCondition: 'NM',
      mediaDetails: 'Vinil 180g audiófilo em perfeito estado.',
      sleeveCondition: 'NM',
      sleeveDetails: 'Capa dupla com acabamento fosco e laminação preservada.',
      hasInsert: true,
      insertCondition: 'NM',
      insertDetails: 'Encarte com letras e fichas técnicas.'
    },
    pricing: {
      costPrice: 80,
      basePriceBrl: 195,
      exchangeRate: 5.6,
      useExchange: false,
      shopeeCommissionPercent: 14,
      shopeeFixedFee: 4,
      packagingCost: 4,
      profitMarginPercent: 20,
      mode: 'direct',
      directPrice: 195
    },
    shopee: {
      title: 'LP Elis & Tom - Elis Regina e Antonio Carlos Jobim Capa Dupla',
      description: 'O encontro histórico da bossa e MPB em vinil de alta fidelidade.',
      suggestedPrice: 195,
      hashtags: ['#elisregina', '#tomjobim', '#bossanova', '#aguasdemarco']
    }
  },
  {
    id: 'listing-clube-da-esquina-cd-duplo',
    barcode: 'VD-002231',
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    status: 'available',
    drawer: 'Gaveta C1 - CDs Raros',
    quantity: 1,
    salesChannels: ['online_store', 'physical_store'],
    isOnlineExclusive: false,
    isDoubleAlbum: true,
    isBoxSet: false,
    isGatefold: false,
    isSpecialEdition: true,
    hasInsert: true,
    specialEditionDetails: 'CD Duplo Digipak Remasterizado com Livreto Expandido',
    release: {
      id: 107,
      title: 'Clube da Esquina (CD Duplo Digipak)',
      artist: 'Milton Nascimento & Lô Borges',
      year: 1994,
      country: 'Brasil',
      label: 'EMI / Odeon',
      catno: '829983 2',
      coverImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
      genres: ['MPB'],
      styles: ['MPB', 'Bossa Nova'],
      formats: [{ name: 'CD', qty: '2', descriptions: ['Album', 'Digipak', 'Remastered'] }],
      tracklist: [
        { position: '1-1', title: 'Tudo Que Você Podia Ser', duration: '2:56' },
        { position: '1-2', title: 'Cais', duration: '2:45' },
        { position: '2-1', title: 'San Vicente', duration: '2:46' },
        { position: '2-2', title: 'Um Girassol Da Cor Do Seu Cabelo', duration: '4:12' }
      ]
    },
    condition: {
      mediaCondition: 'NM',
      mediaDetails: 'Mídias ópticas sem qualquer risco.',
      sleeveCondition: 'NM',
      sleeveDetails: 'Estojo digipak duplo em excelente conservação.',
      hasInsert: true,
      insertCondition: 'NM',
      insertDetails: 'Livreto de 24 páginas intacto.'
    },
    pricing: {
      costPrice: 40,
      basePriceBrl: 85,
      exchangeRate: 5.6,
      useExchange: false,
      shopeeCommissionPercent: 14,
      shopeeFixedFee: 4,
      packagingCost: 3,
      profitMarginPercent: 20,
      mode: 'direct',
      directPrice: 85
    },
    shopee: {
      title: 'CD Duplo Milton Nascimento Clube da Esquina Digipak Raro',
      description: 'Versão em CD duplo digipak remasterizado.',
      suggestedPrice: 85,
      hashtags: ['#cdduplo', '#clubedaesquina', '#mpb', '#digipak']
    }
  },
  {
    id: 'listing-garimpo-bargain-1',
    barcode: 'VD-000882',
    createdAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
    status: 'available',
    drawer: 'Gaveta G1 - Garimpo Oportunidades',
    quantity: 1,
    salesChannels: ['online_store', 'physical_store'],
    isGarimpo: true,
    garimpoDetails: 'Risco superficial na faixa B2 com estalinho suave, capa com marca de fita na lombada.',
    isOnlineExclusive: false,
    isDoubleAlbum: false,
    isBoxSet: false,
    isGatefold: false,
    isSpecialEdition: false,
    hasInsert: false,
    release: {
      id: 108,
      title: 'Samba Esquema Novo',
      artist: 'Jorge Ben',
      year: 1963,
      country: 'Brasil',
      label: 'Philips',
      catno: 'P 632.161 L',
      coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      genres: ['Latin', 'Samba', 'Bossa Nova'],
      styles: ['Samba'],
      formats: [{ name: 'Vinyl', qty: '1', descriptions: ['LP', 'Album'] }],
      tracklist: [
        { position: 'A1', title: 'Mas, Que Nada!', duration: '3:02' },
        { position: 'A2', title: 'Tim Dom Dom', duration: '2:21' },
        { position: 'B1', title: 'Chove Chuva', duration: '3:06' }
      ]
    },
    condition: {
      mediaCondition: 'VG',
      mediaDetails: 'Prensagem de época com marcas estéticas e chiado leve.',
      sleeveCondition: 'G+',
      sleeveDetails: 'Capa com desgaste nas bordas e durex antigo.',
      hasInsert: false
    },
    pricing: {
      costPrice: 15,
      basePriceBrl: 35,
      exchangeRate: 5.6,
      useExchange: false,
      shopeeCommissionPercent: 14,
      shopeeFixedFee: 4,
      packagingCost: 4,
      profitMarginPercent: 20,
      mode: 'direct',
      directPrice: 35
    },
    shopee: {
      title: 'LP Jorge Ben Samba Esquema Novo Philips Garimpo Oportunidade',
      description: 'Clássico de estreia de Jorge Ben no garimpo com Mas Que Nada.',
      suggestedPrice: 35,
      hashtags: ['#garimpo', '#jorgeben', '#samba', '#vinilbarato']
    }
  }
];

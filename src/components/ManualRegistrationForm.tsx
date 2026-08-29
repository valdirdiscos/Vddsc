import React, { useState, useEffect } from 'react';
import { 
  Disc, 
  Plus, 
  Upload, 
  X, 
  FileText, 
  Sparkles, 
  DollarSign, 
  Layers, 
  Check, 
  ListPlus,
  AlertCircle,
  Flame,
  Star,
  Users,
  Percent,
  Tag,
  Gift
} from 'lucide-react';
import { DiscogsRelease, ConditionSelection, PricingConfig, Track } from '../types';
import { GOLDMINE_VINYL_MEDIA, GOLDMINE_VINYL_SLEEVE } from '../constants';
import { isVariousArtistsAlbum } from '../utils/formatHelper';
import { MAJOR_GENRE_GROUPS, getAllAvailableSubstyles, saveCustomSubstyle } from '../constants/musicGenres';

interface ManualRegistrationFormProps {
  onComplete: (data: {
    release: DiscogsRelease;
    condition: ConditionSelection;
    pricing: PricingConfig;
    drawer: string;
    description: string;
    coverImage?: string;
    isGarimpo?: boolean;
    garimpoDetails?: string;
    isOnlineExclusive?: boolean;
    onlineExclusiveDetails?: string;
    isDoubleAlbum?: boolean;
    isBoxSet?: boolean;
    isSpecialEdition?: boolean;
    isGatefold?: boolean;
    specialEditionDetails?: string;
  }) => void;
  onCancel?: () => void;
}

export const ManualRegistrationForm: React.FC<ManualRegistrationFormProps> = ({
  onComplete,
  onCancel
}) => {
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [label, setLabel] = useState('');
  const [catno, setCatno] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [mediaFormat, setMediaFormat] = useState('Vinyl, LP, Album');
  const [price, setPrice] = useState('80');
  const [costPrice, setCostPrice] = useState('0');
  const [drawer, setDrawer] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Garimpo Flag & Reason
  const [isGarimpo, setIsGarimpo] = useState(false);
  const [garimpoDetails, setGarimpoDetails] = useState('');

  // Online Exclusive Flag (Rare items sold only on site)
  const [isOnlineExclusive, setIsOnlineExclusive] = useState(false);
  const [onlineExclusiveDetails, setOnlineExclusiveDetails] = useState('');

  // Particularidades Especiais (Álbum Duplo, Box Set, Edição Especial, Gatefold)
  const [isDoubleAlbum, setIsDoubleAlbum] = useState(false);
  const [isBoxSet, setIsBoxSet] = useState(false);
  const [isSpecialEdition, setIsSpecialEdition] = useState(false);
  const [isGatefold, setIsGatefold] = useState(false);
  const [specialEditionDetails, setSpecialEditionDetails] = useState('');

  // Condition
  const [mediaCond, setMediaCond] = useState('VG+');
  const [mediaDetails, setMediaDetails] = useState('Mídia em ótimo estado. Poucos riscos superficiais normais de uso que não afetam a reprodução.');
  const [sleeveCond, setSleeveCond] = useState('VG+');
  const [sleeveDetails, setSleeveDetails] = useState('Capa conservada com leves desgastes naturais nas pontas.');
  const [hasInsert, setHasInsert] = useState(false);
  const [insertDetails, setInsertDetails] = useState('');

  const [customDescription, setCustomDescription] = useState('');
  const [tracksText, setTracksText] = useState('');

  // Promoção, Desconto % e Bônus
  const [promoActive, setPromoActive] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number>(15);
  const [promoBadge, setPromoBadge] = useState('15% OFF');
  const [bonusDescription, setBonusDescription] = useState('Bônus: Plásticos protetores novos inclusos');

  // Gêneros e Sub-estilos Musicais (Grandes Grupos como Rap, Rock, MPB, etc.)
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Música Brasileira']);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('rap_hiphop');
  const [newSubstyleInput, setNewSubstyleInput] = useState('');
  const [availableSubstyles, setAvailableSubstyles] = useState<string[]>([]);

  useEffect(() => {
    setAvailableSubstyles(getAllAvailableSubstyles());
  }, []);

  const handleAddCustomSubstyle = () => {
    if (!newSubstyleInput.trim()) return;
    const clean = newSubstyleInput.trim();
    saveCustomSubstyle(clean);
    setAvailableSubstyles(getAllAvailableSubstyles());
    if (!selectedStyles.includes(clean)) {
      setSelectedStyles(prev => [...prev, clean]);
    }
    setNewSubstyleInput('');
  };

  const [formError, setFormError] = useState<string | null>(null);
  const [isEnrichingVa, setIsEnrichingVa] = useState(false);
  const [vaEnrichFeedback, setVaEnrichFeedback] = useState<string | null>(null);

  const handleAutoIdentifyVaTracks = async () => {
    if (!tracksText.trim()) return;
    setIsEnrichingVa(true);
    setVaEnrichFeedback(null);

    try {
      const rawLines = tracksText.split('\n').map(l => l.trim()).filter(Boolean);
      const parsedTracks: Track[] = rawLines.map((line, idx) => {
        const durationMatch = line.match(/\(([^)]+)\)$/) || line.match(/\[([^\]]+)\]$/);
        const duration = durationMatch ? durationMatch[1].trim() : undefined;
        const cleanLine = durationMatch ? line.replace(durationMatch[0], '').trim() : line;
        
        const posMatch = cleanLine.match(/^([A-Z0-9]+[.-]?|\d+[.-]?)\s+(.+)$/i);
        let position = `${idx + 1}`;
        let trackTitle = cleanLine;
        if (posMatch) {
          position = posMatch[1].replace(/[.-]$/, '').trim();
          trackTitle = posMatch[2].trim();
        }

        let trackArtist: string | undefined = undefined;
        const splitMatch = trackTitle.match(/^(.+?)\s+[-–—:]\s+(.+)$/);
        if (splitMatch) {
          trackArtist = splitMatch[1].trim();
          trackTitle = splitMatch[2].trim();
        }

        return {
          position,
          title: trackTitle,
          duration: duration || '03:30',
          artist: trackArtist
        };
      });

      const res = await fetch('/api/enrich-va-artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumTitle: title || 'Coletânea V.A.',
          albumArtist: artist || 'Vários Artistas',
          tracklist: parsedTracks
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.tracklist) && data.tracklist.length > 0) {
        const formattedLines = data.tracklist.map((t: Track) => {
          const art = t.artist ? `${t.artist} - ` : '';
          const dur = t.duration ? ` (${t.duration})` : '';
          const pos = t.position ? `${t.position}. ` : '';
          return `${pos}${art}${t.title}${dur}`;
        });
        setTracksText(formattedLines.join('\n'));
        setVaEnrichFeedback('✓ Artistas de cada faixa identificados com sucesso pela IA!');
        setTimeout(() => setVaEnrichFeedback(null), 4500);
      } else {
        setVaEnrichFeedback(data.error || 'Não foi possível identificar todos os artistas.');
      }
    } catch (err: any) {
      setVaEnrichFeedback('Erro de conexão ao identificar artistas.');
    } finally {
      setIsEnrichingVa(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist.trim() || !title.trim()) {
      setFormError('Por favor, informe pelo menos o Artista e o Nome do Álbum.');
      return;
    }

    setFormError(null);

    // Parse tracks from text
    const isVA = isVariousArtistsAlbum(artist);
    const parsedTracks: Track[] = tracksText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map((line, idx) => {
        let pos = String(idx + 1);
        let tTitle = line;
        let dur = '';
        let art = '';

        const durMatch = line.match(/[\(\[]\s*(\d{1,2}:\d{2})\s*[\)\]]/);
        if (durMatch) {
          dur = durMatch[1];
          tTitle = line.replace(durMatch[0], '').trim();
        }

        const posMatch = tTitle.match(/^([A-Da-d]?\d{1,2})[\.\-\s:]+\s*/);
        if (posMatch) {
          pos = posMatch[1].toUpperCase();
          tTitle = tTitle.substring(posMatch[0].length).trim();
        }

        // Match artist if separated by " - " or " – " or " — " or " / "
        const sepMatch = tTitle.match(/^(.+?)\s+[-–—/]\s+(.+)$/);
        if (sepMatch) {
          art = sepMatch[1].trim();
          tTitle = sepMatch[2].trim();
        }

        return {
          position: pos,
          title: tTitle || `Faixa ${idx + 1}`,
          duration: dur || '03:30',
          artist: art || undefined
        };
      });

    const parsedPrice = parseFloat(price.replace(',', '.')) || 80;
    const parsedCost = parseFloat(costPrice.replace(',', '.')) || 0;

    const originalRefPrice = parsedPrice;
    const finalSalePrice = promoActive && discountPercent > 0 
      ? Math.round(parsedPrice * (1 - discountPercent / 100))
      : parsedPrice;

    const newRelease: DiscogsRelease = {
      id: `manual_${Date.now()}`,
      artist: artist.trim(),
      title: title.trim(),
      year: year.trim() || new Date().getFullYear().toString(),
      label: label.trim() || 'Independente',
      catno: catno.trim() || 'VD-001',
      country: country.trim() || 'Brasil',
      genres: selectedGenres.length > 0 ? selectedGenres : ['Música Brasileira', 'Vinil'],
      styles: selectedStyles.length > 0 ? selectedStyles : [],
      formats: [{
        name: mediaFormat,
        qty: '1',
        descriptions: [mediaFormat]
      }],
      tracklist: parsedTracks.length > 0 ? parsedTracks : [
        { position: 'A1', title: 'Lado A - Faixa 1', duration: '03:30' },
        { position: 'A2', title: 'Lado A - Faixa 2', duration: '03:45' },
        { position: 'B1', title: 'Lado B - Faixa 1', duration: '04:10' },
        { position: 'B2', title: 'Lado B - Faixa 2', duration: '03:20' }
      ],
      coverImage: coverImage || 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80',
      notes: customDescription.trim() || 'Disco da coleção Valdir Discos.',
      lowestPriceUsd: finalSalePrice,
      isManual: true
    };

    const condition: ConditionSelection = {
      mediaCondition: mediaCond,
      mediaDetails,
      sleeveCondition: sleeveCond,
      sleeveDetails,
      hasInsert,
      insertCondition: hasInsert ? 'VG+' : undefined,
      insertDetails: hasInsert ? insertDetails || 'Encarte original em bom estado.' : undefined
    };

    const pricing: PricingConfig = {
      basePriceBrl: finalSalePrice,
      costPrice: parsedCost,
      exchangeRate: 5.6,
      useExchange: false,
      shopeeCommissionPercent: 14,
      shopeeFixedFee: 4.0,
      packagingCost: 4.0,
      profitMarginPercent: 30,
      mode: 'direct',
      directPrice: finalSalePrice,
      promoActive: promoActive,
      discountPercent: promoActive ? discountPercent : undefined,
      originalPrice: promoActive ? originalRefPrice : undefined,
      promoPrice: promoActive ? finalSalePrice : undefined,
      promoBadge: promoActive ? promoBadge : undefined,
      bonusDescription: promoActive ? bonusDescription : undefined
    };

    onComplete({
      release: newRelease,
      condition,
      pricing,
      drawer: drawer.trim(),
      description: customDescription.trim(),
      coverImage,
      isGarimpo,
      garimpoDetails: isGarimpo ? garimpoDetails.trim() : undefined,
      isOnlineExclusive,
      onlineExclusiveDetails: isOnlineExclusive ? onlineExclusiveDetails.trim() : undefined,
      isDoubleAlbum: isDoubleAlbum || undefined,
      isBoxSet: isBoxSet || undefined,
      isSpecialEdition: isSpecialEdition || undefined,
      isGatefold: isGatefold || undefined,
      specialEditionDetails: specialEditionDetails.trim() ? specialEditionDetails.trim() : undefined
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6" id="manual-registration-card">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Disc className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Cadastro Manual Direto de Disco</h2>
            <p className="text-xs text-slate-400">Preencha as informações do produto para cadastrar no acervo e gerar anúncios instantaneamente.</p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Artista / Banda <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setArtist('Various Artists')}
                className="text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                title="Definir como coletânea de vários artistas"
              >
                <Users className="h-3 w-3" />
                Coletânea / V.A.
              </button>
            </div>
            <input
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Ex: Tim Maia, Elis Regina, Various Artists..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Título do Álbum / LP <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Racional Vol. 1, The Dark Side of the Moon..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>
        </div>

        {/* Technical details & Format */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ano</label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="1975"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Gravadora / Selo</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Philips, Som Livre..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Formato</label>
            <select
              value={mediaFormat}
              onChange={(e) => setMediaFormat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            >
              <option value="Vinyl, LP, Album">Vinil LP (12")</option>
              <option value="Vinyl, 7&quot;, Single">Compacto Simples (7")</option>
              <option value="Vinyl, 7&quot;, EP">Compacto Duplo (7" EP)</option>
              <option value="Vinyl, 12&quot;, Maxi-Single">Maxi Single (12")</option>
              <option value="CD, Album">CD (Mídia Óptica)</option>
              <option value="DVD, Video">DVD</option>
              <option value="Cassette, Album">Fita Cassete (K7)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">País de Origem</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Brasil"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>
        </div>

        {/* Pricing, Cost & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-indigo-600" />
              Preço Base / Original (R$)
            </label>
            <input
              type="number"
              step="0.50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="80.00"
              className="w-full px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-sm font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-slate-400" />
              Custo Pago (R$)
            </label>
            <input
              type="number"
              step="0.50"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
              <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-extrabold">LOC</span>
              Gaveta / Local
            </label>
            <input
              type="text"
              value={drawer}
              onChange={(e) => setDrawer(e.target.value)}
              placeholder="Ex: Gaveta 4..."
              className="w-full px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>
        </div>

        {/* Promoção, Bônus e Desconto Porcentagem (% OFF) */}
        <div className={`p-4 rounded-2xl border transition-all ${
          promoActive 
            ? 'bg-rose-50/70 border-rose-200 shadow-xs' 
            : 'bg-slate-50/70 border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/50">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={promoActive}
                onChange={(e) => setPromoActive(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
              />
              <div>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-rose-600" />
                  Ativar Promoção com Destaque de Porcentagem (% OFF) e Bônus
                </span>
                <p className="text-[11px] text-slate-500">
                  Aplica desconto percentual no produto com selo no card do site e descrição de bônus.
                </p>
              </div>
            </label>

            {promoActive && (
              <span className="px-2.5 py-1 bg-rose-600 text-white text-xs font-black rounded-lg uppercase tracking-wider shrink-0 shadow-xs">
                {promoBadge || `${discountPercent}% OFF`}
              </span>
            )}
          </div>

          {promoActive && (
            <div className="pt-3.5 space-y-4">
              {/* Quick % buttons & calculated price preview */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-7 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">Selecione a porcentagem de desconto:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[10, 15, 20, 25, 30, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setDiscountPercent(pct);
                          setPromoBadge(`${pct}% OFF`);
                        }}
                        className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                          discountPercent === pct
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {pct}% OFF
                      </button>
                    ))}
                    <div className="flex items-center gap-1 pl-1">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={discountPercent}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          setDiscountPercent(v);
                          setPromoBadge(`${v}% OFF`);
                        }}
                        className="w-14 px-1.5 py-1 bg-white border border-rose-300 rounded-lg text-xs font-bold text-rose-900 text-center"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-5 p-3 bg-white rounded-xl border border-rose-200 text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Preço com Desconto no Site:</span>
                  <div className="flex items-baseline justify-end gap-2">
                    <span className="text-xs line-through text-slate-400 font-mono">
                      R$ {(parseFloat(price.replace(',', '.')) || 80).toFixed(2)}
                    </span>
                    <span className="text-lg font-black text-rose-600 font-mono">
                      R$ {(Math.round((parseFloat(price.replace(',', '.')) || 80) * (1 - discountPercent / 100))).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 block">
                    Economia de R$ {((parseFloat(price.replace(',', '.')) || 80) - Math.round((parseFloat(price.replace(',', '.')) || 80) * (1 - discountPercent / 100))).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Selo e Bônus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-rose-600" />
                    Texto do Selo / Etiqueta Promocional
                  </label>
                  <input
                    type="text"
                    value={promoBadge}
                    onChange={(e) => setPromoBadge(e.target.value)}
                    placeholder="Ex: 15% OFF, PROMOÇÃO DA SEMANA, QUEIMA"
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Gift className="h-3.5 w-3.5 text-amber-600" />
                    Bônus / Brinde Oferecido
                  </label>
                  <input
                    type="text"
                    value={bonusDescription}
                    onChange={(e) => setBonusDescription(e.target.value)}
                    placeholder="Ex: Bônus: Plásticos protetores novos inclusos"
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grandes Grupos Musicais e Sub-estilos */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Disc className="h-3.5 w-3.5 text-indigo-600" />
              Grandes Grupos Musicais & Sub-estilos
            </span>
            <p className="text-[11px] text-slate-500">
              Escolha os grandes grupos musicais (ex: Rap, Rock, MPB, Samba) e selecione ou cadastre novos sub-estilos.
            </p>
          </div>

          {/* Major Groups Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {MAJOR_GENRE_GROUPS.map((grp) => {
              const isGroupActive = activeGroupFilter === grp.id;
              const isGroupSelected = selectedGenres.includes(grp.name);
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => {
                    setActiveGroupFilter(grp.id);
                    if (!selectedGenres.includes(grp.name)) {
                      setSelectedGenres(prev => [...prev, grp.name]);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isGroupActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : isGroupSelected
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <span>{grp.emoji}</span>
                  <span>{grp.name}</span>
                  {isGroupSelected && <Check className="h-3 w-3 text-indigo-600" />}
                </button>
              );
            })}
          </div>

          {/* Sub-styles of the active group */}
          {(() => {
            const currentGroup = MAJOR_GENRE_GROUPS.find(g => g.id === activeGroupFilter) || MAJOR_GENRE_GROUPS[0];
            return (
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Sub-estilos rápidos de {currentGroup.emoji} {currentGroup.name}:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {currentGroup.substyles.map((sub) => {
                    const isSelected = selectedStyles.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedStyles(prev => prev.filter(s => s !== sub));
                          } else {
                            setSelectedStyles(prev => [...prev, sub]);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                        }`}
                      >
                        {isSelected ? `✓ ${sub}` : `+ ${sub}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Selected Substyles Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700">Sub-estilos selecionados neste disco:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedStyles.map((style) => (
                <span
                  key={style}
                  onClick={() => setSelectedStyles(prev => prev.filter(s => s !== style))}
                  className="px-2 py-0.5 bg-indigo-50 text-indigo-800 font-bold text-xs rounded-md border border-indigo-200 flex items-center gap-1 cursor-pointer hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
                  title="Clique para remover"
                >
                  <span>{style}</span>
                  <X className="h-3 w-3" />
                </span>
              ))}
              {selectedStyles.length === 0 && (
                <span className="text-xs text-slate-400 italic">Nenhum sub-estilo selecionado ainda.</span>
              )}
            </div>
          </div>

          {/* Add custom sub-style input on the fly */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newSubstyleInput}
              onChange={(e) => setNewSubstyleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSubstyle();
                }
              }}
              placeholder="Digitar novo sub-estilo (ex: Boom Bap, Trap Brasil, Heavy Metal 80, Samba-Rock...)"
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddCustomSubstyle}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              + Adicionar Sub-estilo
            </button>
          </div>
        </div>

        {/* Garimpo Option Section */}
        <div className={`p-4 rounded-xl border transition-all ${
          isGarimpo 
            ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300' 
            : 'bg-slate-50/70 border-slate-200 hover:border-orange-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isGarimpo}
                onChange={(e) => setIsGarimpo(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
              />
              <div>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Flame className={`h-4 w-4 ${isGarimpo ? 'text-orange-600 fill-orange-600' : 'text-slate-400'}`} />
                  Destacar na "Sessão Garimpo & Oportunidades"
                </span>
                <p className="text-[11px] text-slate-500">
                  Marque para itens de menor valor de mercado, pechinchas ou discos valorizados com marcas de uso/detalhes físicos.
                </p>
              </div>
            </label>
            {isGarimpo && (
              <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-black rounded-md uppercase tracking-wider shrink-0 shadow-xs">
                Ativo
              </span>
            )}
          </div>

          {isGarimpo && (
            <div className="mt-3 pt-3 border-t border-orange-200/80 space-y-1.5">
              <label className="text-xs font-bold text-orange-950">
                Motivo / Detalhes do Garimpo (Exibido para o cliente):
              </label>
              <input
                type="text"
                value={garimpoDetails}
                onChange={(e) => setGarimpoDetails(e.target.value)}
                placeholder="Ex: Preço promocional de desapego / Disco com marcas superficiais / Capa com desgaste natural"
                className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-xs text-orange-950 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}
        </div>

        {/* Online Exclusive (Rare Records) Option Section */}
        <div className={`p-4 rounded-xl border transition-all ${
          isOnlineExclusive 
            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300' 
            : 'bg-slate-50/70 border-slate-200 hover:border-amber-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isOnlineExclusive}
                onChange={(e) => setIsOnlineExclusive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
              />
              <div>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Star className={`h-4 w-4 ${isOnlineExclusive ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                  ⭐ Marcar como Disco Raro — Exclusivo da Loja Online
                </span>
                <p className="text-[11px] text-slate-500">
                  Marque para discos raros, primeiras prensagens ou itens de colecionador destinados à venda exclusiva pelo site.
                </p>
              </div>
            </label>
            {isOnlineExclusive && (
              <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-md uppercase tracking-wider shrink-0 shadow-xs">
                Exclusivo
              </span>
            )}
          </div>

          {isOnlineExclusive && (
            <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-1.5">
              <label className="text-xs font-bold text-amber-950">
                Detalhes da Raridade / Exclusividade (Exibido para o cliente no site):
              </label>
              <input
                type="text"
                value={onlineExclusiveDetails}
                onChange={(e) => setOnlineExclusiveDetails(e.target.value)}
                placeholder="Ex: Primeira prensagem original de 1972 / Exemplar raro com encarte de época impecável"
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}
        </div>

        {/* Particularidades Importantes do Álbum (Álbum Duplo, Box Set, Edição Especial, Gatefold) */}
        <div className={`p-4 rounded-xl border transition-all ${
          isDoubleAlbum || isBoxSet || isSpecialEdition || isGatefold || specialEditionDetails
            ? 'bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-slate-50 border-indigo-200 ring-1 ring-indigo-300/40'
            : 'bg-slate-50/70 border-slate-200 hover:border-indigo-200'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-3">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>💿</span>
              Particularidades Especiais do Álbum (Destaque na Fotinho / Capa)
            </span>
            {(isDoubleAlbum || isBoxSet || isSpecialEdition || isGatefold || specialEditionDetails) && (
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-md uppercase tracking-wider">
                Com Destaque
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Indica visualmente na capa/foto da loja quando o álbum for duplo, box, edição especial ou tiver outra particularidade importante.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={isDoubleAlbum}
                onChange={(e) => setIsDoubleAlbum(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>💿💿</span> Álbum Duplo / Multi-Disco
              </span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={isBoxSet}
                onChange={(e) => setIsBoxSet(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>📦</span> Box Set / Caixa Especial
              </span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={isGatefold}
                onChange={(e) => setIsGatefold(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>📖</span> Capa Dupla (Gatefold)
              </span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={isSpecialEdition}
                onChange={(e) => setIsSpecialEdition(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>✨</span> Edição Especial / Deluxe / Limitada
              </span>
            </label>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/70 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">
              Outra particularidade ou detalhe importante (ex: "Vinil Colorido Azul", "Com Pôster", "Prensagem 180g Audiófilo"):
            </label>
            <input
              type="text"
              value={specialEditionDetails}
              onChange={(e) => setSpecialEditionDetails(e.target.value)}
              placeholder="Ex: Vinil Colorido Azul Translúcido / Prensagem Japonesa com OBI / Acompanha Livreto..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Condition Section */}
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de Conservação</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Estado da Mídia (Disco):</label>
              <select
                value={mediaCond}
                onChange={(e) => setMediaCond(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                {GOLDMINE_VINYL_MEDIA.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={mediaDetails}
                onChange={(e) => setMediaDetails(e.target.value)}
                placeholder="Detalhes da mídia..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Estado da Capa:</label>
              <select
                value={sleeveCond}
                onChange={(e) => setSleeveCond(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                {GOLDMINE_VINYL_SLEEVE.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={sleeveDetails}
                onChange={(e) => setSleeveDetails(e.target.value)}
                placeholder="Detalhes da capa..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Description & Tracklist */}
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-600" />
              Descrição e Observações do Disco
            </label>
            <textarea
              rows={4}
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Ex: Disco original de época, higienizado, toca limpo. Acompanha plásticos novos."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ListPlus className="h-3.5 w-3.5 text-indigo-600" />
                Faixas / Músicas (Opcional - Cole uma música por linha)
              </label>
              
              <div className="flex items-center gap-2">
                {tracksText.trim() && (
                  <button
                    type="button"
                    onClick={handleAutoIdentifyVaTracks}
                    disabled={isEnrichingVa}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    title="Usar Inteligência Artificial para descobrir e formatar o artista de cada faixa deste álbum"
                  >
                    <Sparkles className={`h-3.5 w-3.5 text-indigo-600 ${isEnrichingVa ? 'animate-spin' : ''}`} />
                    <span>{isEnrichingVa ? 'Identificando...' : 'Identificar Artistas (IA V.A.)'}</span>
                  </button>
                )}
                {isVariousArtistsAlbum(artist) && (
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    V.A. (Artista - Faixa)
                  </span>
                )}
              </div>
            </div>

            {vaEnrichFeedback && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{vaEnrichFeedback}</span>
              </div>
            )}

            <textarea
              rows={4}
              value={tracksText}
              onChange={(e) => setTracksText(e.target.value)}
              placeholder={isVariousArtistsAlbum(artist) 
                ? "A1. Raul Seixas - Metamorfose Ambulante (03:50)\nA2. Tim Maia - Gostava Tanto de Você (04:15)\nB1. Rita Lee - Ovelha Negra (05:20)"
                : "A1. Nome da Música 1 (03:40)\nA2. Nome da Música 2 (04:15)\nB1. Nome da Música 3 (03:20)"
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {isVariousArtistsAlbum(artist) && (
              <p className="text-[11px] text-teal-700 font-medium">
                💡 Para coletâneas / V.A., o sistema identifica o artista de cada faixa automaticamente separando por "Artista - Faixa" ou use o botão com IA acima!
              </p>
            )}
          </div>
        </div>

        {/* Cover Photo Upload */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Foto da Capa (Opcional)
          </label>
          <div className="flex items-center gap-4">
            {coverImage ? (
              <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200">
                <img src={coverImage} alt="Capa" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full cursor-pointer shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : null}
            <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200">
              <Upload className="h-4 w-4 text-indigo-600" />
              <span>Enviar Foto da Capa</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all cursor-pointer"
          >
            <Check className="h-4 w-4" />
            Cadastrar Disco & Abrir no Gerador
          </button>
        </div>
      </form>
    </div>
  );
};

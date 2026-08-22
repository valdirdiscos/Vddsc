import React, { useState } from 'react';
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
  Flame
} from 'lucide-react';
import { DiscogsRelease, ConditionSelection, PricingConfig, Track } from '../types';
import { GOLDMINE_VINYL_MEDIA, GOLDMINE_VINYL_SLEEVE } from '../constants';

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
  const [drawer, setDrawer] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Garimpo Flag & Reason
  const [isGarimpo, setIsGarimpo] = useState(false);
  const [garimpoDetails, setGarimpoDetails] = useState('');

  // Condition
  const [mediaCond, setMediaCond] = useState('VG+');
  const [mediaDetails, setMediaDetails] = useState('Mídia em ótimo estado. Poucos riscos superficiais normais de uso que não afetam a reprodução.');
  const [sleeveCond, setSleeveCond] = useState('VG+');
  const [sleeveDetails, setSleeveDetails] = useState('Capa conservada com leves desgastes naturais nas pontas.');
  const [hasInsert, setHasInsert] = useState(false);
  const [insertDetails, setInsertDetails] = useState('');

  // Description / Notes
  const [customDescription, setCustomDescription] = useState('');
  const [tracksText, setTracksText] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

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
    const parsedTracks: Track[] = tracksText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map((line, idx) => {
        let pos = String(idx + 1);
        let tTitle = line;
        let dur = '';

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

        return {
          position: pos,
          title: tTitle || `Faixa ${idx + 1}`,
          duration: dur || '03:30'
        };
      });

    const parsedPrice = parseFloat(price.replace(',', '.')) || 80;

    const newRelease: DiscogsRelease = {
      id: `manual_${Date.now()}`,
      artist: artist.trim(),
      title: title.trim(),
      year: year.trim() || new Date().getFullYear().toString(),
      label: label.trim() || 'Independente',
      catno: catno.trim() || 'VD-001',
      country: country.trim() || 'Brasil',
      genres: ['Música Brasileira', 'Vinil'],
      styles: [],
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
      lowestPriceUsd: parsedPrice,
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
      basePriceBrl: parsedPrice,
      exchangeRate: 5.6,
      useExchange: false,
      shopeeCommissionPercent: 14,
      shopeeFixedFee: 4.0,
      packagingCost: 3.5,
      profitMarginPercent: 30,
      mode: 'direct',
      directPrice: parsedPrice
    };

    onComplete({
      release: newRelease,
      condition,
      pricing,
      drawer: drawer.trim(),
      description: customDescription.trim(),
      coverImage,
      isGarimpo,
      garimpoDetails: isGarimpo ? garimpoDetails.trim() : undefined
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
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Artista / Banda <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Ex: Tim Maia, Elis Regina, Pink Floyd..."
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

        {/* Pricing & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-indigo-600" />
              Preço de Venda (R$)
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
            <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
              <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-extrabold">LOC</span>
              Gaveta / Localização Física
            </label>
            <input
              type="text"
              value={drawer}
              onChange={(e) => setDrawer(e.target.value)}
              placeholder="Ex: Gaveta 4, Prateleira B..."
              className="w-full px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
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
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ListPlus className="h-3.5 w-3.5 text-indigo-600" />
              Faixas / Músicas (Opcional - Cole uma música por linha)
            </label>
            <textarea
              rows={3}
              value={tracksText}
              onChange={(e) => setTracksText(e.target.value)}
              placeholder={"A1. Música 1 (03:40)\nA2. Música 2 (04:15)\nB1. Música 3 (03:20)"}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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

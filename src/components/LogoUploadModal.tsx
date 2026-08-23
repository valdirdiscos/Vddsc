import React, { useState } from 'react';
import { 
  Upload, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Image as ImageIcon, 
  RefreshCw,
  Sparkles,
  RotateCcw,
  Eye
} from 'lucide-react';
import { useLogos } from '../hooks/useLogos';
import { setActiveLogo, resetActiveLogo } from '../assets/logos';

interface LogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LogoUploadModal: React.FC<LogoUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { logoBadge, logoColor, logoBw } = useLogos();
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (type: 'badge' | 'color' | 'bw', file: File) => {
    setError(null);
    setSuccess(null);
    setLoading(type);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          
          // 1. Instantly update client-side state and storage for immediate UI refresh
          setActiveLogo(type, base64);

          // 2. Persist to server disk in both JPG and PNG formats
          const res = await fetch('/api/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, dataBase64: base64 })
          });

          const data = await res.json();
          if (!res.ok || data.error) {
            console.warn('Servidor gravou em cache:', data?.error);
          }

          const labelMap = {
            badge: 'Selo Circular Retrô',
            color: 'Valdir Colorido (Mascote)',
            bw: 'Traço Monocromático P&B'
          };

          setSuccess(`✓ Arte do ${labelMap[type]} atualizada e aplicada em tempo real!`);
          if (onSuccess) onSuccess();
        } catch (err: any) {
          setError(err.message || 'Falha ao salvar a imagem');
        } finally {
          setLoading(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Falha ao processar arquivo');
      setLoading(null);
    }
  };

  const handleReset = (type: 'badge' | 'color' | 'bw') => {
    resetActiveLogo(type);
    setSuccess(`Logo restaurado para o arquivo padrão.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-800">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                Atualizar Logotipos Oficiais
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Envie suas imagens direto do celular ou computador
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Uploader Slots */}
        <div className="space-y-3.5">
          
          {/* Slot 1: Retro Badge */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <img 
                  src={logoBadge} 
                  alt="Selo" 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">1. Selo Circular Retrô</span>
                <span className="text-[10px] text-slate-500 block">Com faixa "Disco é cultura."</span>
                <button
                  type="button"
                  onClick={() => handleReset('badge')}
                  className="text-[10px] text-amber-700 hover:underline flex items-center gap-1 mt-0.5 font-medium cursor-pointer"
                >
                  <RotateCcw className="h-2.5 w-2.5" /> Restaurar original
                </button>
              </div>
            </div>

            <label className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs active:scale-95 transition-all shrink-0">
              <span>{loading === 'badge' ? 'Enviando...' : 'Escolher Foto'}</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                disabled={!!loading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload('badge', f);
                }}
              />
            </label>
          </div>

          {/* Slot 2: Color Character */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <img 
                  src={logoColor} 
                  alt="Mascote" 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">2. Mascote Colorido</span>
                <span className="text-[10px] text-slate-500 block">Valdir com camisa terracota</span>
                <button
                  type="button"
                  onClick={() => handleReset('color')}
                  className="text-[10px] text-orange-700 hover:underline flex items-center gap-1 mt-0.5 font-medium cursor-pointer"
                >
                  <RotateCcw className="h-2.5 w-2.5" /> Restaurar original
                </button>
              </div>
            </div>

            <label className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs active:scale-95 transition-all shrink-0">
              <span>{loading === 'color' ? 'Enviando...' : 'Escolher Foto'}</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                disabled={!!loading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload('color', f);
                }}
              />
            </label>
          </div>

          {/* Slot 3: BW Linework */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <img 
                  src={logoBw} 
                  alt="Traço P&B" 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">3. Traço Monocromático</span>
                <span className="text-[10px] text-slate-500 block">Linhas P&B para etiquetas</span>
                <button
                  type="button"
                  onClick={() => handleReset('bw')}
                  className="text-[10px] text-slate-600 hover:underline flex items-center gap-1 mt-0.5 font-medium cursor-pointer"
                >
                  <RotateCcw className="h-2.5 w-2.5" /> Restaurar original
                </button>
              </div>
            </div>

            <label className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs active:scale-95 transition-all shrink-0">
              <span>{loading === 'bw' ? 'Enviando...' : 'Escolher Foto'}</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                disabled={!!loading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload('bw', f);
                }}
              />
            </label>
          </div>

        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Concluir e Salvar</span>
          </button>
        </div>

      </div>
    </div>
  );
};

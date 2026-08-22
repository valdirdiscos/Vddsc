import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  X, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Store,
  Sparkles,
  Disc,
  Users
} from 'lucide-react';
import { LOGO_BADGE } from '../assets/logos';
import { useAuth, MASTER_ADMIN_EMAIL } from '../context/AuthContext';

interface IntranetAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const IntranetAuthModal: React.FC<IntranetAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { loginWithGoogle, switchUserWithPin, currentUser, isStaff, isMasterAdmin } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMethod, setAuthMethod] = useState<'pin' | 'google'>('pin');

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPin = pin.trim();
    if (!cleanPin) {
      setError('Por favor, digite o PIN de acesso.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = switchUserWithPin(cleanPin);
      if (ok) {
        setPin('');
        onSuccess();
        onClose();
      } else {
        setError('PIN incorreto ou não autorizado. Tente novamente ou use a conta Google do Administrador.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao validar credenciais.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Google login failed or closed:', err);
      setError(err.message || 'A autenticação via Google foi cancelada ou não autorizada.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setError(null);
    }
  };

  const handleKeypadBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleKeypadClear = () => {
    setPin('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Dark Luxury Theme */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar e voltar à loja"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-13 h-13 rounded-2xl bg-amber-500/10 p-1 border border-amber-400/30 shrink-0 overflow-hidden shadow-lg shadow-amber-500/20">
              <img 
                src={LOGO_BADGE} 
                alt="Valdir Discos" 
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = "/valdir-logo-badge.jpg";
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Acesso Restrito
                </span>
                <span className="text-[10px] text-amber-300/80 font-serif italic">Disco é cultura.</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                Intranet & Gestão da Loja
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Área exclusiva para administração de produtos, estoque, frente de caixa (PDV) e relatórios.
          </p>
        </div>

        {/* Tab switchers between PIN and Google */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('pin');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              authMethod === 'pin'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-600" />
            <span>Entrar com PIN</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('google');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              authMethod === 'google'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-3.5 w-3.5" />
            <span>Conta Google</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {authMethod === 'pin' ? (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Digite o PIN do Administrador ou Colaborador:
                </label>
                <div className="relative max-w-[200px] mx-auto">
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ''));
                      setError(null);
                    }}
                    placeholder="••••"
                    autoFocus
                    className="w-full text-center text-2xl tracking-[0.5em] font-mono font-black py-3 bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-900 border-2 border-slate-300 focus:border-amber-500 rounded-2xl focus:outline-hidden transition-all shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium pt-1">
                  Dica: Utilize o PIN Master ou o PIN individual da equipe
                </p>
              </div>

              {/* Touch keypad for rapid entry (POS / Mobile / Tablet friendly) */}
              <div className="max-w-[240px] mx-auto grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="h-11 rounded-xl bg-slate-100 hover:bg-amber-100 active:bg-amber-200 text-slate-900 font-black text-base transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
                  title="Limpar PIN"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-amber-100 active:bg-amber-200 text-slate-900 font-black text-base transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
                  title="Apagar dígito"
                >
                  ⌫
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !pin}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>{isSubmitting ? 'Verificando...' : 'Liberar Acesso à Intranet'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 mx-auto flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">
                  Acesso com E-mail Administrativo
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Faça login com a sua conta Google associada a <strong>{MASTER_ADMIN_EMAIL}</strong> ou outro e-mail com privilégios cadastrados.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-800 rounded-2xl font-bold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-98"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                <span>{isSubmitting ? 'Conectando...' : 'Entrar com Conta Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar para a Loja Virtual</span>
          </button>

          <span className="text-[10px] text-slate-400 font-medium">
            🔒 Valdir Discos Security
          </span>
        </div>
      </div>
    </div>
  );
};

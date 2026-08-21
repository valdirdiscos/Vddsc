import React, { useState } from 'react';
import { ShieldAlert, KeyRound, X, Check, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminPinOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
  requiredRole?: string;
}

export const AdminPinOverrideModal: React.FC<AdminPinOverrideModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Esta operação requer autorização de Administrador.',
  requiredRole = 'Administrador'
}) => {
  const { verifyMasterPin, quickSwitchRole, loginWithGoogle } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (verifyMasterPin(pin)) {
      onSuccess();
      onClose();
      setPin('');
    } else {
      setError('PIN incorreto. Apenas administradores autorizados.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Autorização Necessária</h3>
              <p className="text-[11px] text-slate-400">Nível Mínimo: {requiredRole}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {actionTitle} Digite a <strong>Senha / PIN do Administrador (Master)</strong> para autorizar esta ação.
          </p>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                PIN de Autorização Master
              </label>
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Ex: 1975"
                className="w-full text-center text-xl tracking-widest font-mono font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                Autorizar
              </button>
            </div>
          </form>

          <div className="border-t border-slate-100 pt-3 text-center">
            <button
              type="button"
              onClick={async () => {
                try {
                  await loginWithGoogle();
                  onSuccess();
                  onClose();
                } catch {}
              }}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-3 w-3" />
              Ou faça login com conta Google de Administrador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

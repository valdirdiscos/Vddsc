import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ChevronDown, 
  Lock, 
  LogOut, 
  LogIn, 
  KeyRound, 
  Users, 
  UserCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import { UserRole } from '../types';

interface UserHeaderBadgeProps {
  onOpenAccessModal: () => void;
  onLogoutAndLock?: () => void;
  onOpenPinModal?: () => void;
}

export const UserHeaderBadge: React.FC<UserHeaderBadgeProps> = ({ 
  onOpenAccessModal,
  onLogoutAndLock,
  onOpenPinModal
}) => {
  const { 
    currentUser, 
    userRole, 
    isMasterAdmin, 
    isStaff,
    loginWithGoogle, 
    logout
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleMeta = ROLE_LABELS[userRole] || ROLE_LABELS.visitante;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    if (onLogoutAndLock) {
      onLogoutAndLock();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Clickable Header Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all cursor-pointer shadow-xs text-left group"
        title="Controle de Acesso da Equipe"
      >
        <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <span>{roleMeta.icon}</span>
          )}
        </div>

        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors truncate max-w-[130px]">
              {currentUser?.displayName?.split(' ')[0] || 'Equipe'}
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md border ${roleMeta.badgeColor}`}>
              {roleMeta.label.split(' ')[0]}
            </span>
          </div>
        </div>

        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
          {/* User Info Block */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {currentUser?.displayName?.charAt(0).toUpperCase() || 'V'}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.displayName || 'Equipe Valdir Discos'}
                </h4>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {currentUser?.email || 'Acesso Autorizado'}
                </p>
              </div>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Nível de Acesso
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${roleMeta.badgeColor}`}>
                {roleMeta.icon} {roleMeta.label}
              </span>
            </div>
          </div>

          {/* Action Links */}
          <div className="pt-1 border-t border-slate-100 space-y-1">
            {onOpenPinModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenPinModal();
                }}
                className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <KeyRound className="h-4 w-4 text-amber-600" />
                <span>Trocar Operador (Digitar PIN)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAccessModal();
              }}
              className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <Users className="h-4 w-4 text-indigo-600" />
              <span>Gerenciar Equipe & Permissões</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setIsOpen(false);
                try {
                  await loginWithGoogle();
                } catch (e) {
                  console.warn('Google login popup cancelled or error:', e);
                }
              }}
              className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-3.5 w-3.5" />
              <span>Autenticar com Google (Master)</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-all cursor-pointer border-t border-slate-100 mt-1"
            >
              <LogOut className="h-4 w-4 text-rose-600" />
              <span>Bloquear Terminal & Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

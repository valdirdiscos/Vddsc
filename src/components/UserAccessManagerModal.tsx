import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Users, 
  UserPlus, 
  KeyRound, 
  Trash2, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  Sparkles, 
  AlertCircle, 
  Crown, 
  Briefcase, 
  Package, 
  Eye,
  Info
} from 'lucide-react';
import { useAuth, ROLE_LABELS, ROLE_PERMISSIONS, MASTER_ADMIN_EMAIL } from '../context/AuthContext';
import { UserRole, UserProfile } from '../types';

interface UserAccessManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserAccessManagerModal: React.FC<UserAccessManagerModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    userRole, 
    isMasterAdmin, 
    allUsers, 
    saveUser, 
    deleteUser, 
    quickSwitchRole,
    switchUserWithPin,
    loginWithGoogle,
    logout,
    verifyMasterPin
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'roles_matrix' | 'terminal_pin'>('users');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('operador');
  const [formPin, setFormPin] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Pin switch test
  const [testPin, setTestPin] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormRole('operador');
    setFormPin('');
    setFormError(null);
    setIsAddingUser(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUserId(user.uid);
    setFormName(user.displayName);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormPin(user.customPin || '');
    setFormError(null);
    setIsAddingUser(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Informe o nome do colaborador.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Informe um e-mail válido.');
      return;
    }

    try {
      await saveUser({
        uid: editingUserId || undefined,
        displayName: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        customPin: formPin.trim() || undefined,
        isActive: true
      });

      setFormSuccess(editingUserId ? 'Colaborador atualizado!' : 'Novo colaborador cadastrado com sucesso!');
      setIsAddingUser(false);
      setTimeout(() => setFormSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar colaborador.');
    }
  };

  const handleDelete = async (uid: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja revogar o acesso de "${name}"?`)) return;
    try {
      await deleteUser(uid);
      setFormSuccess('Acesso revogado.');
      setTimeout(() => setFormSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Não foi possível excluir.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Controle de Acessos & Níveis de Autorização
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Segurança RBAC
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Defina permissões para Administrador, Vendedores/Operadores, Estoquistas e Consulta.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-xs font-bold px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Equipe & Colaboradores ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('roles_matrix')}
            className={`pb-3 text-xs font-bold px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roles_matrix'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            Matriz de Permissões por Cargo
          </button>
          <button
            onClick={() => setActiveTab('terminal_pin')}
            className={`pb-3 text-xs font-bold px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'terminal_pin'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Troca Rápida de Operador (PIN)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* TAB 1: USERS LIST & MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Usuários Cadastrados
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Colaboradores autorizados com acesso ao sistema do Valdir Discos.
                  </p>
                </div>
                {isMasterAdmin && !isAddingUser && (
                  <button
                    onClick={handleOpenAdd}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Novo Colaborador
                  </button>
                )}
              </div>

              {/* Add / Edit Form */}
              {isAddingUser && (
                <form onSubmit={handleSubmitUser} className="p-4 bg-slate-50 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-bold text-indigo-900">
                      {editingUserId ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingUser(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {formError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ex: João Silva (Balcão)"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">E-mail (Google Login)</label>
                      <input
                        type="email"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="joao@gmail.com"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Nível de Autorização (Cargo)</label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as UserRole)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                      >
                        <option value="admin">👑 Administrador (Acesso Total)</option>
                        <option value="operador">💼 Operador / Vendedor (PDV e Vendas)</option>
                        <option value="estoquista">📦 Estoquista / Catalogador (Discos & Etiquetas)</option>
                        <option value="visitante">👁️ Modo Consulta (Somente Leitura)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        PIN de Acesso Rápido (4 Dígitos)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={formPin}
                        onChange={(e) => setFormPin(e.target.value)}
                        placeholder="Ex: 1234 (opcional)"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingUser(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                    >
                      Salvar Colaborador
                    </button>
                  </div>
                </form>
              )}

              {/* Users Cards List */}
              <div className="space-y-2.5">
                {allUsers.map((u) => {
                  const roleMeta = ROLE_LABELS[u.role] || ROLE_LABELS.visitante;
                  const isCurrent = currentUser?.email?.toLowerCase() === u.email?.toLowerCase();
                  const isValdirMaster = u.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

                  return (
                    <div
                      key={u.uid}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent 
                          ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {u.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{u.displayName}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.2 rounded-md">
                                Você
                              </span>
                            )}
                            {isValdirMaster && (
                              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-md border border-amber-200">
                                Master
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${roleMeta.badgeColor}`}>
                          {roleMeta.icon} {roleMeta.label}
                        </span>

                        {u.customPin && (
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200" title="PIN de terminal">
                            PIN: {u.customPin}
                          </span>
                        )}

                        {isMasterAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Editar cargo e PIN"
                            >
                              Editar
                            </button>
                            {!isValdirMaster && (
                              <button
                                onClick={() => handleDelete(u.uid, u.displayName)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Revogar acesso"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ROLES MATRIX */}
          {activeTab === 'roles_matrix' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Níveis de Autorização e Permissões do Sistema
                </h3>
                <p className="text-[11px] text-slate-500">
                  Veja com clareza o que cada colaborador tem autorização para fazer.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(['admin', 'operador', 'estoquista', 'visitante'] as UserRole[]).map((r) => {
                  const meta = ROLE_LABELS[r];
                  const perms = ROLE_PERMISSIONS[r];
                  const isCurrent = userRole === r;

                  return (
                    <div
                      key={r}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{meta.icon}</span>
                          <div>
                            <h4 className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                              {meta.label}
                            </h4>
                          </div>
                        </div>
                        {isCurrent ? (
                          <span className="text-[10px] font-black uppercase bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                            Seu Cargo Atual
                          </span>
                        ) : (
                          <button
                            onClick={() => quickSwitchRole(r)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs hover:bg-slate-50 cursor-pointer"
                          >
                            Simular Perfil
                          </button>
                        )}
                      </div>

                      <p className={`text-[11px] mb-3 ${isCurrent ? 'text-slate-300' : 'text-slate-600'}`}>
                        {meta.description}
                      </p>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between py-1 border-t border-slate-200/40">
                          <span>Cadastrar / Anunciar Discos:</span>
                          <span className={perms.canCreateListings ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                            {perms.canCreateListings ? '✓ Sim' : '✕ Não'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-t border-slate-200/40">
                          <span>Operar Caixa / Registrar Vendas (PDV):</span>
                          <span className={perms.canOperatePOS ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                            {perms.canOperatePOS ? '✓ Sim' : '✕ Não'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-t border-slate-200/40">
                          <span>Gerenciar e Cadastrar Clientes:</span>
                          <span className={perms.canManageCustomers ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                            {perms.canManageCustomers ? '✓ Sim' : '✕ Não'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-t border-slate-200/40">
                          <span>Emitir Etiquetas / QR Code Térmico:</span>
                          <span className={perms.canPrintLabels ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                            {perms.canPrintLabels ? '✓ Sim' : '✕ Não'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-t border-slate-200/40">
                          <span>Ver Custos, Margens & Lucro:</span>
                          <span className={perms.canViewFinancialMargins ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                            {perms.canViewFinancialMargins ? '✓ Sim' : '✕ Bloqueado'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-t border-slate-200/40">
                          <span>Alterar Taxas & Precificação Global:</span>
                          <span className={perms.canEditPricingSettings ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                            {perms.canEditPricingSettings ? '✓ Sim' : '✕ Bloqueado'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-t border-slate-200/40">
                          <span>Excluir Registros / Deletar Discos:</span>
                          <span className={perms.canDeleteListings ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                            {perms.canDeleteListings ? '✓ Sim' : '✕ Bloqueado'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-t border-slate-200/40">
                          <span>Gerenciar Usuários & Acessos:</span>
                          <span className={perms.canManageUsers ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                            {perms.canManageUsers ? '✓ Sim' : '✕ Bloqueado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: TERMINAL QUICK PIN SWITCH */}
          {activeTab === 'terminal_pin' && (
            <div className="space-y-4 max-w-md mx-auto py-2">
              <div className="text-center space-y-1">
                <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-1">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Troca Rápida de Operador no Caixa</h3>
                <p className="text-xs text-slate-500">
                  Digite seu PIN de 4 dígitos para assumir o terminal do PDV imediatamente.
                </p>
              </div>

              {pinMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  pinMessage.includes('sucesso') 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <Info className="h-4 w-4 shrink-0" />
                  <span>{pinMessage}</span>
                </div>
              )}

              <div className="space-y-3">
                <input
                  type="password"
                  maxLength={6}
                  value={testPin}
                  onChange={(e) => setTestPin(e.target.value)}
                  placeholder="Digite seu PIN (Ex: 1975)"
                  className="w-full text-center text-2xl tracking-widest font-mono font-bold px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-indigo-600 focus:bg-white focus:outline-none"
                />

                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTestPin(prev => prev + num)}
                      className="py-3 text-sm font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-all cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTestPin('')}
                    className="py-3 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestPin(prev => prev + '0')}
                    className="py-3 text-sm font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-all cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const success = switchUserWithPin(testPin);
                      if (success) {
                        setPinMessage('PIN autenticado com sucesso! Operador alterado.');
                        setTestPin('');
                      } else {
                        setPinMessage('PIN incorreto ou não cadastrado.');
                      }
                    }}
                    className="py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Logado como:</span>
            <strong className="text-slate-800">{currentUser?.displayName}</strong>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_LABELS[userRole].badgeColor}`}>
              {ROLE_LABELS[userRole].icon} {ROLE_LABELS[userRole].label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loginWithGoogle}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-3.5 w-3.5" />
              Login Google
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-slate-500 hover:text-rose-600 font-bold transition-colors cursor-pointer"
            >
              Sair
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

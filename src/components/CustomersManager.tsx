import React, { useState } from 'react';
import { 
  User, Plus, Search, Phone, Instagram, MapPin, 
  Trash2, Edit3, Save, X, ExternalLink, Calendar, 
  DollarSign, Disc, Check, AlertCircle, ShoppingBag, FolderLock,
  Globe, Mail, Heart, Package, ShieldCheck, MessageCircle,
  FileText, ArrowUpRight, Clock, Truck
} from 'lucide-react';
import { Customer, SavedListing, CustomerAccount } from '../types';
import { useCustomerAuth } from '../context/CustomerAuthContext';

interface CustomersManagerProps {
  customers: Customer[];
  listings: SavedListing[];
  onAddCustomer: (customer: Customer) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onUpdateListing: (listing: SavedListing) => Promise<void>;
}

export function CustomersManager({ 
  customers = [], 
  listings = [], 
  onAddCustomer, 
  onDeleteCustomer,
  onUpdateListing 
}: CustomersManagerProps) {
  const { allCustomerAccounts, allOnlineOrders } = useCustomerAuth();

  // Filter mode: 'all' | 'online' | 'crm'
  const [sourceFilter, setSourceFilter] = useState<'all' | 'online' | 'crm'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected Customer Unified ID
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Form editing states for manual CRM
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formInstagram, setFormInstagram] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Merge CRM Customers and Online Customer Accounts into unified customer view items
  const unifiedCustomers = React.useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      email?: string;
      phone?: string;
      instagram?: string;
      city?: string;
      state?: string;
      cpf?: string;
      address?: any;
      wishlist?: string[];
      favoriteGenres?: string[];
      notes?: string;
      source: 'online' | 'crm';
      createdAt: string;
      account?: CustomerAccount;
      crmCustomer?: Customer;
    }> = [];

    // Add Online Accounts
    allCustomerAccounts.forEach(acc => {
      list.push({
        id: acc.id,
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        city: acc.address?.city,
        state: acc.address?.state,
        cpf: acc.cpf,
        address: acc.address,
        wishlist: acc.wishlist || [],
        favoriteGenres: acc.favoriteGenres || [],
        source: 'online',
        createdAt: acc.createdAt || new Date().toISOString(),
        account: acc
      });
    });

    // Add CRM Customers (only if not already duplicated by ID)
    customers.forEach(c => {
      const existing = list.find(item => item.id === c.id || (item.phone && c.phone && item.phone.replace(/\D/g, '') === c.phone.replace(/\D/g, '')));
      if (!existing) {
        list.push({
          id: c.id,
          name: c.name,
          phone: c.phone,
          instagram: c.instagram,
          city: c.city,
          state: c.state,
          notes: c.notes,
          source: 'crm',
          createdAt: c.createdAt,
          crmCustomer: c
        });
      }
    });

    return list;
  }, [allCustomerAccounts, customers]);

  // Auto-select first customer
  React.useEffect(() => {
    if (unifiedCustomers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(unifiedCustomers[0].id);
    }
  }, [unifiedCustomers, selectedCustomerId]);

  // Filter customers based on search and source
  const filteredCustomers = unifiedCustomers.filter(c => {
    if (sourceFilter === 'online' && c.source !== 'online') return false;
    if (sourceFilter === 'crm' && c.source !== 'crm') return false;

    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true;

    return (
      c.name.toLowerCase().includes(searchLower) ||
      (c.email && c.email.toLowerCase().includes(searchLower)) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.city && c.city.toLowerCase().includes(searchLower)) ||
      (c.cpf && c.cpf.includes(searchTerm))
    );
  });

  const selectedUnified = unifiedCustomers.find(c => c.id === selectedCustomerId);

  // Orders for selected customer
  const customerOnlineOrders = React.useMemo(() => {
    if (!selectedUnified) return [];
    return allOnlineOrders.filter(
      ord => ord.customerId === selectedUnified.id || 
             (selectedUnified.email && ord.customerEmail?.toLowerCase() === selectedUnified.email.toLowerCase()) ||
             (selectedUnified.phone && ord.customerPhone && ord.customerPhone.replace(/\D/g, '') === selectedUnified.phone.replace(/\D/g, ''))
    );
  }, [selectedUnified, allOnlineOrders]);

  // Listings for selected customer
  const customerListings = listings.filter(item => item.customerId === selectedCustomerId);
  const activeReservations = customerListings.filter(item => item.status === 'reserved');
  const purchaseHistory = customerListings.filter(item => item.status === 'sold');

  const totalSpentPhysical = purchaseHistory.reduce((sum, item) => sum + (item.saleDetails?.salePrice || 0), 0);
  const totalSpentOnline = customerOnlineOrders.reduce((sum, ord) => sum + ord.totalAmount, 0);
  const totalSpentAll = totalSpentPhysical + totalSpentOnline;
  const totalOrdersCount = customerOnlineOrders.length + purchaseHistory.length;

  // Open form for adding a new customer
  const handleOpenAdd = () => {
    setFormId(`crm_${Date.now()}`);
    setFormName('');
    setFormPhone('');
    setFormInstagram('');
    setFormCity('');
    setFormState('');
    setFormNotes('');
    setErrorMsg('');
    setIsAdding(true);
    setIsEditing(false);
  };

  // Open form for editing current customer
  const handleOpenEdit = () => {
    if (!selectedUnified) return;
    setFormId(selectedUnified.id);
    setFormName(selectedUnified.name);
    setFormPhone(selectedUnified.phone || '');
    setFormInstagram(selectedUnified.instagram || '');
    setFormCity(selectedUnified.city || '');
    setFormState(selectedUnified.state || '');
    setFormNotes(selectedUnified.notes || '');
    setErrorMsg('');
    setIsEditing(true);
    setIsAdding(false);
  };

  // Save Customer (Add or Update)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('O nome do cliente é obrigatório.');
      return;
    }

    const cleanInstagram = formInstagram.trim().replace(/^@/, '');

    const newCustomer: Customer = {
      id: formId,
      name: formName.trim(),
      phone: formPhone.trim() || undefined,
      instagram: cleanInstagram || undefined,
      city: formCity.trim() || undefined,
      state: formState.trim().toUpperCase() || undefined,
      notes: formNotes.trim() || undefined,
      createdAt: selectedUnified && isEditing ? selectedUnified.createdAt : new Date().toISOString()
    };

    try {
      await onAddCustomer(newCustomer);
      setIsAdding(false);
      setIsEditing(false);
      setSelectedCustomerId(newCustomer.id);
    } catch (err) {
      setErrorMsg('Erro ao salvar o cliente no banco.');
    }
  };

  // Delete Customer
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza de que deseja remover este cliente? As listagens associadas permanecerão, mas perderão a referência do cliente.')) {
      try {
        const linked = listings.filter(item => item.customerId === id);
        for (const item of linked) {
          await onUpdateListing({
            ...item,
            customerId: undefined,
            customerName: undefined
          });
        }
        await onDeleteCustomer(id);
        setSelectedCustomerId(unifiedCustomers.length > 1 ? unifiedCustomers.find(c => c.id !== id)?.id || null : null);
      } catch (err) {
        console.error('Erro ao deletar cliente', err);
      }
    }
  };

  // Release a reservation from customer
  const releaseReservation = async (item: SavedListing) => {
    if (window.confirm(`Liberar a reserva do álbum "${item.release.title}"?`)) {
      await onUpdateListing({
        ...item,
        status: 'available',
        customerId: undefined,
        customerName: undefined
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="customers-manager-panel">
      {/* Sidebar: Search and Clients list */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col h-[750px]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              Área de Clientes (Intranet)
            </h3>
            <p className="text-[10px] text-slate-500">Acompanhe todos os dados cadastrados e histórico.</p>
          </div>
          
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo</span>
          </button>
        </div>

        {/* Source Filter Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 border border-slate-200">
          <button
            type="button"
            onClick={() => setSourceFilter('all')}
            className={`py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer text-center ${
              sourceFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Todos ({unifiedCustomers.length})
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('online')}
            className={`py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              sourceFilter === 'online'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Globe className="h-3 w-3" />
            <span>Online ({allCustomerAccounts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('crm')}
            className={`py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              sourceFilter === 'crm'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Balcão</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, fone, cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
          />
        </div>

        {/* Clients list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <User className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Nenhum cliente encontrado.</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-[10px] text-indigo-600 font-bold hover:underline mt-1 cursor-pointer"
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            filteredCustomers.map(c => {
              const isActive = c.id === selectedCustomerId;
              const cl = listings.filter(item => item.customerId === c.id);
              const activeRes = cl.filter(item => item.status === 'reserved').length;
              const onlineCount = allOnlineOrders.filter(ord => ord.customerId === c.id || (c.email && ord.customerEmail === c.email)).length;

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomerId(c.id);
                    setIsEditing(false);
                    setIsAdding(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-xs' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 block truncate">{c.name}</span>
                      {c.source === 'online' && (
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[9px] font-black uppercase">
                          Web
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      {c.email && <span className="truncate">{c.email}</span>}
                      {!c.email && c.phone && <span className="truncate">{c.phone}</span>}
                      {c.city && <span>• {c.city}/{c.state || 'RS'}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {onlineCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 text-[9px] font-black rounded-md">
                        {onlineCount} Ped
                      </span>
                    )}
                    {activeRes > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded-md">
                        {activeRes} Res
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Details Panel / Forms */}
      <div className="lg:col-span-7 space-y-4">
        {isAdding || isEditing ? (
          <form onSubmit={handleSaveCustomer} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-4 w-4 text-indigo-500" />
                {isAdding ? 'Cadastrar Novo Cliente' : 'Editar Dados do Cliente'}
              </h4>
              <button 
                type="button" 
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(false);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">WhatsApp / Telefone</label>
                <input
                  type="text"
                  placeholder="Ex: (55) 99999-9999"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Instagram (Sem @)</label>
                <input
                  type="text"
                  placeholder="Ex: carlossilva_vinil"
                  value={formInstagram}
                  onChange={(e) => setFormInstagram(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Cidade</label>
                <input
                  type="text"
                  placeholder="Ex: Santa Maria"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Estado (UF)</label>
                <input
                  type="text"
                  placeholder="Ex: RS"
                  maxLength={2}
                  value={formState}
                  onChange={(e) => setFormState(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Observações / Preferências</label>
                <textarea
                  placeholder="Ex: Colecionador de MPB anos 70 e Rock Gaúcho. Prefere edições originais."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-100 transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                Salvar Cadastro
              </button>
            </div>
          </form>
        ) : selectedUnified ? (
          <div className="space-y-4">
            {/* Customer Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg">
                    {selectedUnified.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 leading-tight">{selectedUnified.name}</h3>
                      {selectedUnified.source === 'online' ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Conta Online
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-black uppercase">
                          Balcão / CRM
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      Cadastrado em {new Date(selectedUnified.createdAt).toLocaleDateString('pt-BR')} • ID: <code className="font-mono text-[9px]">{selectedUnified.id}</code>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {selectedUnified.phone && (
                    <a
                      href={`https://wa.me/${selectedUnified.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${selectedUnified.name}! Aqui é o Valdir da Valdir Discos.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      title="Chamar no WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {selectedUnified.source === 'crm' && (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenEdit}
                        className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedUnified.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-bold text-red-600 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Excluir</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Information Grid: All allowed customer info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg text-indigo-500 border border-slate-100">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none mb-1">WhatsApp / Fone</span>
                    {selectedUnified.phone ? (
                      <span className="text-xs font-bold text-slate-800 block truncate">{selectedUnified.phone}</span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Não informado</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg text-indigo-500 border border-slate-100">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none mb-1">E-mail Cadastrado</span>
                    {selectedUnified.email ? (
                      <span className="text-xs font-bold text-slate-800 block truncate">{selectedUnified.email}</span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Não informado</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg text-indigo-500 border border-slate-100">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none mb-1">CPF Registrado</span>
                    {selectedUnified.cpf ? (
                      <span className="text-xs font-mono font-bold text-slate-800 block truncate">{selectedUnified.cpf}</span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Não informado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[9px] uppercase font-black text-slate-500 block tracking-wider flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-amber-600" />
                  Endereço Completo de Envio & Entrega:
                </span>
                {selectedUnified.address ? (
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>{selectedUnified.address.street}</strong>, nº {selectedUnified.address.number || 'S/N'}
                    {selectedUnified.address.complement && ` (${selectedUnified.address.complement})`} • {selectedUnified.address.neighborhood || ''} • <strong>{selectedUnified.address.city || selectedUnified.city || 'Santa Maria'}/{selectedUnified.address.state || selectedUnified.state || 'RS'}</strong> • CEP: <span className="font-mono font-bold">{selectedUnified.address.cep || 'N/I'}</span>
                  </p>
                ) : selectedUnified.city ? (
                  <p className="text-xs text-slate-700">
                    {selectedUnified.city} - {selectedUnified.state || 'RS'} (Endereço de rua não cadastrado)
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">Nenhum endereço cadastrado por este cliente.</p>
                )}
              </div>

              {/* Wishlist and favorite genres */}
              {selectedUnified.wishlist && selectedUnified.wishlist.length > 0 && (
                <div className="p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-black text-rose-900 block tracking-wider flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 fill-rose-600 text-rose-600" />
                    Lista de Desejos do Cliente ({selectedUnified.wishlist.length} {selectedUnified.wishlist.length === 1 ? 'item' : 'itens'} favoritados no site):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUnified.wishlist.map((listingId, idx) => {
                      const item = listings.find(l => l.id === listingId);
                      return (
                        <span key={idx} className="px-2 py-1 bg-white border border-rose-200 rounded-lg text-xs font-bold text-slate-800 shadow-xs flex items-center gap-1">
                          <Disc className="h-3 w-3 text-amber-600" />
                          {item ? `${item.release.artist} - ${item.release.title}` : `Disco ID #${listingId}`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedUnified.notes && (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-amber-800 block tracking-wider mb-1">Preferências & Observações Internas</span>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedUnified.notes}</p>
                </div>
              )}
            </div>

            {/* Financial Summary Card */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 border border-emerald-200">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest block mb-0.5">Total Investido na Loja</span>
                  <strong className="text-lg font-black text-slate-900 leading-none">R$ {totalSpentAll.toFixed(2).replace('.', ',')}</strong>
                </div>
              </div>

              <div className="bg-indigo-50/40 border border-indigo-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 border border-indigo-200">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block mb-0.5">Pedidos / Compras</span>
                  <strong className="text-lg font-black text-slate-900 leading-none">{totalOrdersCount} {totalOrdersCount === 1 ? 'Pedido' : 'Pedidos'}</strong>
                </div>
              </div>
            </div>

            {/* Online Orders History */}
            {customerOnlineOrders.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-600" />
                  Histórico de Pedidos Online do Site ({customerOnlineOrders.length})
                </h4>

                <div className="space-y-2">
                  {customerOnlineOrders.map(ord => (
                    <div key={ord.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900">{ord.orderNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            ord.paymentStatus === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                          <span className="text-slate-400">• {new Date(ord.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">
                          {ord.items.length} {ord.items.length === 1 ? 'item' : 'itens'}: {ord.items.map(i => i.title).join(', ')}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-slate-900 block text-xs">
                          R$ {ord.totalAmount.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {ord.deliveryType === 'shipping' ? 'Envio Correios' : 'Retirada Balcão'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Reservations */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FolderLock className="h-4 w-4 text-amber-500" />
                Reservas Ativas no Balcão ({activeReservations.length})
              </h4>

              {activeReservations.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Nenhum disco reservado para este cliente no momento.</p>
              ) : (
                <div className="space-y-2">
                  {activeReservations.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {item.release.coverImage && item.release.coverImage.trim() !== '' ? (
                          <img 
                            src={item.release.coverImage} 
                            alt={item.release.title} 
                            className="h-9 w-9 object-cover rounded-lg border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                            <Disc className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-slate-700 block truncate">{item.release.title}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{item.release.artist} • R$ {item.pricing?.directPrice || item.pricing?.basePriceBrl}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => releaseReservation(item)}
                        className="px-2.5 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-all cursor-pointer"
                      >
                        Liberar Reserva
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
            <User className="h-12 w-12 text-slate-300 mb-3" />
            <h4 className="text-sm font-black text-slate-700 uppercase mb-1">Nenhum Cliente Selecionado</h4>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              Crie um novo cliente ou escolha um existente para ver detalhes cadastrais, pedidos e histórico.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Cadastrar Novo Cliente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

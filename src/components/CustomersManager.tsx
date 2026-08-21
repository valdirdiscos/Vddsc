import React, { useState } from 'react';
import { 
  User, Plus, Search, Phone, Instagram, MapPin, 
  Trash2, Edit3, Save, X, ExternalLink, Calendar, 
  DollarSign, Disc, Check, AlertCircle, ShoppingBag, FolderLock
} from 'lucide-react';
import { Customer, SavedListing } from '../types';

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
  // State for search and active selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    (customers && customers.length > 0) ? customers[0].id : null
  );

  // Form editing states
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

  // Auto-select first customer if none is selected and customers list changed
  React.useEffect(() => {
    if (customers && customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  // Filter customers based on search
  const filteredCustomers = (customers || []).filter(c => {
    const searchLower = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(searchLower) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.instagram && c.instagram.toLowerCase().includes(searchLower)) ||
      (c.city && c.city.toLowerCase().includes(searchLower))
    );
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Calculations for selected customer
  const customerListings = listings.filter(item => item.customerId === selectedCustomerId);
  const activeReservations = customerListings.filter(item => item.status === 'reserved');
  const purchaseHistory = customerListings.filter(item => item.status === 'sold');

  const totalSpent = purchaseHistory.reduce((sum, item) => sum + (item.saleDetails?.salePrice || 0), 0);
  const totalItemsBought = purchaseHistory.length;

  // Open form for adding a new customer
  const handleOpenAdd = () => {
    setFormId(Date.now().toString());
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
    if (!selectedCustomer) return;
    setFormId(selectedCustomer.id);
    setFormName(selectedCustomer.name);
    setFormPhone(selectedCustomer.phone || '');
    setFormInstagram(selectedCustomer.instagram || '');
    setFormCity(selectedCustomer.city || '');
    setFormState(selectedCustomer.state || '');
    setFormNotes(selectedCustomer.notes || '');
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
      createdAt: selectedCustomer && isEditing ? selectedCustomer.createdAt : new Date().toISOString()
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
        // Safe dissociation of listings associated with this customer
        const linked = listings.filter(item => item.customerId === id);
        for (const item of linked) {
          await onUpdateListing({
            ...item,
            customerId: undefined,
            customerName: undefined
          });
        }
        await onDeleteCustomer(id);
        setSelectedCustomerId(customers.length > 1 ? customers.find(c => c.id !== id)?.id || null : null);
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
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col h-[700px]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-500" />
              Banco de Clientes
            </h3>
            <p className="text-[10px] text-slate-500">Cadastre e acompanhe os seus compradores frequentes.</p>
          </div>
          
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Cliente
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, fone, cidade..."
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
              <p className="text-xs font-bold text-slate-500">Nenhum cliente cadastrado ou encontrado.</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-[10px] text-indigo-600 font-bold hover:underline mt-1"
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
              const soldCount = cl.filter(item => item.status === 'sold').length;

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
                      ? 'bg-indigo-50/50 border-indigo-200/80 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <span className="text-xs font-bold text-slate-800 block truncate">{c.name}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      {c.city && (
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin className="h-3 w-3" />
                          {c.city} - {c.state}
                        </span>
                      )}
                      {c.phone && <span className="truncate">{c.phone}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {activeRes > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded-md">
                        {activeRes} Res
                      </span>
                    )}
                    {soldCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-md">
                        {soldCount} Compra{soldCount > 1 ? 's' : ''}
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
                  placeholder="Ex: Daniel de Souza"
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
                  placeholder="Ex: (11) 99999-9999"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Instagram (Sem @)</label>
                <input
                  type="text"
                  placeholder="Ex: daniel_discos"
                  value={formInstagram}
                  onChange={(e) => setFormInstagram(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Cidade</label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Estado (UF)</label>
                <input
                  type="text"
                  placeholder="Ex: SP"
                  maxLength={2}
                  value={formState}
                  onChange={(e) => setFormState(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Observações / Preferências</label>
                <textarea
                  placeholder="Ex: Gosta de jazz clássico e rock progressivo. Prefere prensagens japonesas."
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
        ) : selectedCustomer ? (
          <div className="space-y-4">
            {/* Customer Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 leading-tight">{selectedCustomer.name}</h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Cliente desde {new Date(selectedCustomer.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
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
                    onClick={() => handleDelete(selectedCustomer.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-bold text-red-600 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Excluir</span>
                  </button>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg text-indigo-500 border border-slate-100">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none mb-1">WhatsApp</span>
                    {selectedCustomer.phone ? (
                      <a 
                        href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        referrerPolicy="no-referrer"
                        className="text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-1 truncate"
                      >
                        {selectedCustomer.phone}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Não cadastrado</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg text-indigo-500 border border-slate-100">
                    <Instagram className="h-3.5 w-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none mb-1">Instagram</span>
                    {selectedCustomer.instagram ? (
                      <a 
                        href={`https://instagram.com/${selectedCustomer.instagram}`} 
                        target="_blank" 
                        referrerPolicy="no-referrer"
                        className="text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-1 truncate"
                      >
                        @{selectedCustomer.instagram}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Não cadastrado</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg text-indigo-500 border border-slate-100">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none mb-1">Localização</span>
                    {selectedCustomer.city ? (
                      <span className="text-xs font-bold text-slate-700 block truncate">
                        {selectedCustomer.city} - {selectedCustomer.state || 'UF'}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Não cadastrado</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div className="p-3.5 bg-amber-50/50 border border-amber-100/80 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-amber-700/80 block tracking-wider mb-1">Preferências & Observações</span>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>

            {/* Financial Summary Card */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-0.5">Total Investido</span>
                  <strong className="text-lg font-black text-slate-800 leading-none">R$ {totalSpent.toFixed(2)}</strong>
                </div>
              </div>

              <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">Discos Adquiridos</span>
                  <strong className="text-lg font-black text-slate-800 leading-none">{totalItemsBought} {totalItemsBought === 1 ? 'Álbum' : 'Álbuns'}</strong>
                </div>
              </div>
            </div>

            {/* Active Reservations */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FolderLock className="h-4 w-4 text-amber-500" />
                Reservas Ativas ({activeReservations.length})
              </h4>

              {activeReservations.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Nenhum disco reservado para este cliente.</p>
              ) : (
                <div className="space-y-2">
                  {activeReservations.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {item.release.coverImage && item.release.coverImage.trim() !== '' ? (
                          <img 
                            src={item.release.coverImage} 
                            alt={item.release.title} 
                            className="h-9 w-9 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <Disc className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-slate-700 block truncate">{item.release.title}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{item.release.artist} • R$ {item.shopee?.suggestedPrice || item.pricing.directPrice || item.pricing.basePriceBrl}</span>
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

            {/* Purchase History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-emerald-500" />
                Histórico de Compras ({purchaseHistory.length})
              </h4>

              {purchaseHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Nenhuma compra registrada para este cliente.</p>
              ) : (
                <div className="space-y-2">
                  {purchaseHistory.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {item.release.coverImage && item.release.coverImage.trim() !== '' ? (
                          <img 
                            src={item.release.coverImage} 
                            alt={item.release.title} 
                            className="h-9 w-9 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <Disc className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-slate-700 block truncate">{item.release.title}</span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            Comprado em {item.saleDetails?.soldAt ? new Date(item.saleDetails.soldAt).toLocaleDateString('pt-BR') : 'Data Indisponível'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <strong className="text-xs font-black text-slate-800 block">R$ {item.saleDetails?.salePrice.toFixed(2)}</strong>
                        <span className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded block text-center max-w-fit ml-auto mt-0.5">
                          {item.saleDetails?.platform}
                        </span>
                      </div>
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
              Crie um novo cliente ou escolha um existente para ver detalhes, reservas e financeiro.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Cadastrar Primeiro Cliente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  Download,
  X,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Copy,
  FileText,
  User,
  MapPin,
  Package,
  Disc,
  ExternalLink,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { SavedListing } from '../types';
import {
  CorreiosDeclarationData,
  CorreiosDeclarationItem,
  DEFAULT_VALDIR_SENDER,
  exportCorreiosDeclarationToPdf,
} from '../utils/correiosDeclaration';
import { cleanLocationCode } from '../utils/formatHelper';

interface CorreiosDeclarationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialListing?: SavedListing | null;
  initialOrder?: {
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    shippingAddress?: {
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      cep?: string;
    };
    items?: Array<{
      title: string;
      artist?: string;
      price: number;
      quantity?: number;
    }>;
  } | null;
  allListings?: SavedListing[];
}

export const CorreiosDeclarationModal: React.FC<CorreiosDeclarationModalProps> = ({
  isOpen,
  onClose,
  initialListing,
  initialOrder,
  allListings = [],
}) => {
  // Destinatário
  const [destNome, setDestNome] = useState('');
  const [destDoc, setDestDoc] = useState('');
  const [destCep, setDestCep] = useState('');
  const [destLogradouro, setDestLogradouro] = useState('');
  const [destNumero, setDestNumero] = useState('');
  const [destComplemento, setDestComplemento] = useState('');
  const [destBairro, setDestBairro] = useState('');
  const [destCidade, setDestCidade] = useState('');
  const [destUf, setDestUf] = useState('');
  const [destTelefone, setDestTelefone] = useState('');

  // Remetente
  const [remetente, setRemetente] = useState(DEFAULT_VALDIR_SENDER);

  // Itens da declaração
  const [itens, setItens] = useState<CorreiosDeclarationItem[]>([]);

  // Pedido e observações
  const [orderNumber, setOrderNumber] = useState('');

  // Controle de busca de discos para adicionar
  const [showDiscSearch, setShowDiscSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [copied, setCopied] = useState(false);

  // Carrega dados iniciais do disco ou do pedido quando o modal é aberto
  useEffect(() => {
    if (!isOpen) return;

    if (initialOrder) {
      setOrderNumber(initialOrder.orderNumber || `PED-${Date.now().toString().slice(-6)}`);
      setDestNome(initialOrder.customerName || '');
      setDestTelefone(initialOrder.customerPhone || '');

      if (initialOrder.shippingAddress) {
        setDestLogradouro(initialOrder.shippingAddress.street || '');
        setDestNumero(initialOrder.shippingAddress.number || '');
        setDestComplemento(initialOrder.shippingAddress.complement || '');
        setDestBairro(initialOrder.shippingAddress.neighborhood || '');
        setDestCidade(initialOrder.shippingAddress.city || '');
        setDestUf(initialOrder.shippingAddress.state || '');
        setDestCep(initialOrder.shippingAddress.cep || '');
      }

      if (initialOrder.items && initialOrder.items.length > 0) {
        setItens(
          initialOrder.items.map((it, idx) => ({
            id: `item-${idx}-${Date.now()}`,
            descricao: `Disco de Vinil LP: ${it.artist ? `${it.artist} - ` : ''}${it.title}`,
            quantidade: it.quantity || 1,
            valorUnitario: Number(it.price) || 0,
          }))
        );
      }
    } else if (initialListing) {
      setOrderNumber(`DISCO-${initialListing.id.slice(-6).toUpperCase()}`);
      const loc = cleanLocationCode(initialListing.drawer);
      const locTag = loc ? ` [${loc}]` : '';
      const mediaCond = initialListing.condition?.mediaCondition || 'VG+';
      const price = Number(initialListing.pricing?.basePriceBrl) || 0;

      setItens([
        {
          id: `disc-${initialListing.id}`,
          descricao: `Disco de Vinil LP: ${initialListing.release.artist} - ${initialListing.release.title} (${mediaCond})${locTag}`,
          quantidade: 1,
          valorUnitario: price,
        },
      ]);
    } else if (itens.length === 0) {
      setOrderNumber(`ENV-${Date.now().toString().slice(-6)}`);
      setItens([
        {
          id: 'item-1',
          descricao: 'Disco de Vinil LP Colecionador',
          quantidade: 1,
          valorUnitario: 50,
        },
      ]);
    }
  }, [isOpen, initialListing, initialOrder]);

  // Totais
  const totalQtd = useMemo(() => {
    return itens.reduce((acc, curr) => acc + (Number(curr.quantidade) || 0), 0);
  }, [itens]);

  const totalVal = useMemo(() => {
    return itens.reduce((acc, curr) => acc + (Number(curr.quantidade) || 0) * (Number(curr.valorUnitario) || 0), 0);
  }, [itens]);

  // Consulta automática de CEP via ViaCEP
  const handleLookupCep = async (cepToLookup: string) => {
    const cleanCep = cepToLookup.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setDestLogradouro(data.logradouro || '');
        setDestBairro(data.bairro || '');
        setDestCidade(data.localidade || '');
        setDestUf(data.uf || '');
      }
    } catch (err) {
      console.error('Erro ao consultar CEP:', err);
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Manipulação de Itens
  const handleAddItemFromDisc = (listing: SavedListing) => {
    const loc = cleanLocationCode(listing.drawer);
    const locTag = loc ? ` [${loc}]` : '';
    const mediaCond = listing.condition?.mediaCondition || 'VG+';
    const price = Number(listing.pricing?.basePriceBrl) || 0;

    const newItem: CorreiosDeclarationItem = {
      id: `disc-${listing.id}-${Date.now()}`,
      descricao: `Disco de Vinil LP: ${listing.release.artist} - ${listing.release.title} (${mediaCond})${locTag}`,
      quantidade: 1,
      valorUnitario: price,
    };

    setItens((prev) => [...prev, newItem]);
    setShowDiscSearch(false);
    setSearchQuery('');
  };

  const handleAddManualItem = () => {
    setItens((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        descricao: 'Disco de Vinil LP',
        quantidade: 1,
        valorUnitario: 30,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItens((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof CorreiosDeclarationItem, value: any) => {
    setItens((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          return { ...it, [field]: value };
        }
        return it;
      })
    );
  };

  // Discos filtrados para o modal de pesquisa
  const filteredDiscs = useMemo(() => {
    if (!searchQuery.trim()) return allListings.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return allListings
      .filter((l) => {
        const art = (l.release.artist || '').toLowerCase();
        const tit = (l.release.title || '').toLowerCase();
        const loc = (l.drawer || '').toLowerCase();
        const bar = (l.barcode || '').toLowerCase();
        return art.includes(q) || tit.includes(q) || loc.includes(q) || bar.includes(q);
      })
      .slice(0, 15);
  }, [allListings, searchQuery]);

  // Monta objeto de dados para impressão ou PDF
  const declarationPayload: CorreiosDeclarationData = useMemo(() => {
    return {
      orderNumber,
      remetente,
      destinatario: {
        nome: destNome || 'Cliente Valdir Discos',
        doc: destDoc,
        logradouro: destLogradouro,
        numero: destNumero,
        complemento: destComplemento,
        bairro: destBairro,
        cidade: destCidade,
        uf: destUf,
        cep: destCep,
        telefone: destTelefone,
      },
      itens,
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
    };
  }, [
    orderNumber,
    remetente,
    destNome,
    destDoc,
    destLogradouro,
    destNumero,
    destComplemento,
    destBairro,
    destCidade,
    destUf,
    destCep,
    destTelefone,
    itens,
  ]);

  const handleDownloadPdf = () => {
    const filename = `declaracao_correios_${(destNome || 'destinatario').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${orderNumber || 'envio'}.pdf`;
    exportCorreiosDeclarationToPdf(declarationPayload, filename);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsAppText = () => {
    const lines = [
      `📦 *DECLARAÇÃO DE ENVIO - VALDIR DISCOS*`,
      `*Remetente:* ${remetente.nome} (${remetente.cidade}/${remetente.uf})`,
      `*Destinatário:* ${destNome || 'Cliente'}`,
      `*Endereço de Entrega:* ${destLogradouro}, ${destNumero}${destComplemento ? ` - ${destComplemento}` : ''} - ${destBairro}, ${destCidade}/${destUf} - CEP: ${destCep}`,
      ``,
      `🎵 *ITENS DA ENCOMENDA:*`,
      ...itens.map((it, idx) => `${idx + 1}. ${it.descricao} (Qtd: ${it.quantidade}) - R$ ${(it.valorUnitario * it.quantidade).toFixed(2).replace('.', ',')}`),
      ``,
      `💰 *Total Declarado:* R$ ${totalVal.toFixed(2).replace('.', ',')}`,
      `🛡️ Encomenda com embalagem blindada reforçada sob medida e plástico bolha duplo.`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-6xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Oculto na impressão */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-400 text-blue-950 rounded-2xl shadow-sm font-black text-xs flex items-center gap-1.5">
              <Package className="h-5 w-5" />
              <span>CORREIOS</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Declaração de Conteúdo Oficial</h2>
              <p className="text-xs text-blue-200">
                Portaria nº 2.610/2018 - Valdir Discos (Envios de Balcão, WhatsApp e Marketplace)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyWhatsAppText}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Copiar dados para enviar pelo WhatsApp"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar WhatsApp'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Baixar Declaração em PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Baixar PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-yellow-500/20 cursor-pointer"
              title="Imprimir direto na impressora"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors ml-1 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Area - Grid de 2 Colunas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:p-0 print:overflow-visible">
          {/* Coluna Esquerda: Edição e Controles (Oculta ao Imprimir) */}
          <div className="lg:col-span-5 space-y-4 print:hidden">
            {/* Destinatário */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-600" /> 1. Destinatário (Comprador)
                </span>
                <span className="text-[10px] text-slate-500">Dados da postagem</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nome Completo</label>
                  <input
                    type="text"
                    value={destNome}
                    onChange={(e) => setDestNome(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">CPF / CNPJ</label>
                    <input
                      type="text"
                      value={destDoc}
                      onChange={(e) => setDestDoc(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={destTelefone}
                      onChange={(e) => setDestTelefone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">CEP</label>
                    <input
                      type="text"
                      value={destCep}
                      onChange={(e) => {
                        setDestCep(e.target.value);
                        if (e.target.value.replace(/\D/g, '').length === 8) {
                          handleLookupCep(e.target.value);
                        }
                      }}
                      onBlur={() => handleLookupCep(destCep)}
                      placeholder="97000-000"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Logradouro (Rua / Av.)
                    </label>
                    <input
                      type="text"
                      value={destLogradouro}
                      onChange={(e) => setDestLogradouro(e.target.value)}
                      placeholder="Rua das Flores"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Número</label>
                    <input
                      type="text"
                      value={destNumero}
                      onChange={(e) => setDestNumero(e.target.value)}
                      placeholder="123"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Complemento</label>
                    <input
                      type="text"
                      value={destComplemento}
                      onChange={(e) => setDestComplemento(e.target.value)}
                      placeholder="Apto 101 / Bloco B"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Bairro</label>
                    <input
                      type="text"
                      value={destBairro}
                      onChange={(e) => setDestBairro(e.target.value)}
                      placeholder="Centro"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cidade</label>
                    <input
                      type="text"
                      value={destCidade}
                      onChange={(e) => setDestCidade(e.target.value)}
                      placeholder="Porto Alegre"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">UF</label>
                    <input
                      type="text"
                      value={destUf}
                      onChange={(e) => setDestUf(e.target.value.toUpperCase())}
                      maxLength={2}
                      placeholder="RS"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Itens do Pacote */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Disc className="h-3.5 w-3.5 text-blue-600" /> 2. Discos & Itens no Pacote
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowDiscSearch(true)}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Do Acervo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    + Avulso
                  </button>
                </div>
              </div>

              {/* Lista editável de itens */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {itens.map((it, idx) => (
                  <div key={it.id} className="p-2 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black text-slate-400">#{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.id)}
                        className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                        title="Remover item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={it.descricao}
                      onChange={(e) => handleUpdateItem(it.id, 'descricao', e.target.value)}
                      placeholder="Descrição do disco"
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-slate-500">Qtd:</span>
                        <input
                          type="number"
                          min={1}
                          value={it.quantidade}
                          onChange={(e) => handleUpdateItem(it.id, 'quantidade', parseInt(e.target.value) || 1)}
                          className="w-16 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-center"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-slate-500">Valor (R$):</span>
                        <input
                          type="number"
                          step="0.5"
                          value={it.valorUnitario}
                          onChange={(e) => handleUpdateItem(it.id, 'valorUnitario', parseFloat(e.target.value) || 0)}
                          className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-right"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totais rápidos */}
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-900">Total: {totalQtd} disco(s)</span>
                <span className="font-black text-blue-950 text-sm">
                  R$ {totalVal.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Remetente e Pedido */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Remetente: {remetente.nome}
                </span>
                <span className="text-[10px] text-slate-500">Santa Maria / RS</span>
              </div>
              <div className="text-[11px] text-slate-600 leading-relaxed">
                {remetente.logradouro}, {remetente.numero} - {remetente.bairro}, {remetente.cidade}/{remetente.uf} • CEP: {remetente.cep} • Tel: {remetente.telefone}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Pré-visualização Fiel da Folha A4 dos Correios (Impressão Perfeita) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-start">
            <div className="w-full bg-slate-100 p-2 sm:p-4 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center print:bg-white print:p-0 print:border-0 print:shadow-none">
              <span className="text-[11px] font-semibold text-slate-500 mb-2 print:hidden">
                Visualização fiel da folha A4 (Padrão Correios Portaria 2.610/2018):
              </span>

              {/* Folha Oficial A4 */}
              <div
                id="correios-printable-sheet"
                className="w-full bg-white text-black p-6 sm:p-8 rounded-lg shadow-md border border-slate-300 font-sans text-xs leading-normal print:shadow-none print:border-0 print:p-0"
                style={{ maxWidth: '210mm', minHeight: '270mm' }}
              >
                {/* 1. Header Oficial EBCT */}
                <div className="border-2 border-black p-2 text-center mb-3">
                  <div className="font-bold text-xs uppercase tracking-wider">
                    EMPRESA BRASILEIRA DE CORREIOS E TELÉGRAFOS
                  </div>
                  <div className="font-black text-sm uppercase tracking-widest mt-0.5">
                    DECLARAÇÃO DE CONTEÚDO
                  </div>
                </div>

                {/* 2. Remetente e Destinatário */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {/* Remetente */}
                  <div className="border border-black p-2 relative text-[10px] leading-tight">
                    <div className="font-bold bg-slate-200 border-b border-black -mx-2 -mt-2 p-1 mb-1 text-[10px] uppercase">
                      REMETENTE
                    </div>
                    <div><strong>Nome:</strong> {remetente.nome}</div>
                    <div><strong>CPF/CNPJ:</strong> {remetente.doc}</div>
                    <div><strong>Endereço:</strong> {remetente.logradouro}, {remetente.numero}</div>
                    <div><strong>Bairro:</strong> {remetente.bairro}</div>
                    <div><strong>Cidade/UF:</strong> {remetente.cidade} - {remetente.uf}</div>
                    <div><strong>CEP:</strong> {remetente.cep}</div>
                    <div><strong>Telefone:</strong> {remetente.telefone}</div>
                  </div>

                  {/* Destinatário */}
                  <div className="border border-black p-2 relative text-[10px] leading-tight">
                    <div className="font-bold bg-slate-200 border-b border-black -mx-2 -mt-2 p-1 mb-1 text-[10px] uppercase">
                      DESTINATÁRIO
                    </div>
                    <div><strong>Nome:</strong> {destNome || '_______________________________________'}</div>
                    <div><strong>CPF/CNPJ:</strong> {destDoc || 'Não informado'}</div>
                    <div><strong>Endereço:</strong> {destLogradouro ? `${destLogradouro}, ${destNumero}${destComplemento ? ` - ${destComplemento}` : ''}` : '_______________________________________'}</div>
                    <div><strong>Bairro:</strong> {destBairro || '____________________'}</div>
                    <div><strong>Cidade/UF:</strong> {destCidade ? `${destCidade} - ${destUf}` : '____________________'}</div>
                    <div><strong>CEP:</strong> {destCep || '________-___'}</div>
                    <div><strong>Telefone:</strong> {destTelefone || '____________________'}</div>
                  </div>
                </div>

                {/* 3. Tabela de Bens e Discos */}
                <div className="mb-3">
                  <div className="bg-slate-200 border border-black p-1 font-bold text-[10px] uppercase">
                    IDENTIFICAÇÃO DOS BENS (MÍDIAS / DISCOS DE VINIL / ITENS)
                  </div>
                  <table className="w-full border-collapse border border-black text-[10px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1 text-center w-8">ITEM</th>
                        <th className="border border-black p-1 text-left">CONTEÚDO / DISCRIMINAÇÃO DO PRODUTO</th>
                        <th className="border border-black p-1 text-center w-12">QTD</th>
                        <th className="border border-black p-1 text-right w-24">VALOR (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((it, idx) => (
                        <tr key={it.id}>
                          <td className="border border-black p-1 text-center">{idx + 1}</td>
                          <td className="border border-black p-1">{it.descricao}</td>
                          <td className="border border-black p-1 text-center">{it.quantidade}</td>
                          <td className="border border-black p-1 text-right">
                            {((it.valorUnitario || 0) * (it.quantidade || 1)).toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      ))}
                      {/* Linhas em branco para preenchimento se tiver poucos itens */}
                      {Array.from({ length: Math.max(0, 5 - itens.length) }).map((_, i) => (
                        <tr key={`empty-${i}`}>
                          <td className="border border-black p-1 text-center text-slate-300">{itens.length + i + 1}</td>
                          <td className="border border-black p-1">&nbsp;</td>
                          <td className="border border-black p-1 text-center">&nbsp;</td>
                          <td className="border border-black p-1 text-right">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold">
                        <td colSpan={2} className="border border-black p-1 text-right">TOTAIS:</td>
                        <td className="border border-black p-1 text-center">{totalQtd}</td>
                        <td className="border border-black p-1 text-right">
                          R$ {totalVal.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 4. Declaração Legal */}
                <div className="border border-black p-2 text-[9px] leading-tight text-justify mb-3">
                  <strong>DECLARAÇÃO:</strong> Declaro que não me enquadro no conceito de contribuinte previsto no art. 4º da Lei Complementar nº 87/1996, 
                  uma vez que não realizo, com habitualidade ou em volume que caracterize intuito comercial, operações de circulação de mercadorias, 
                  a não ser as de venda de bens do meu acervo/coleção, e que o conteúdo da encomenda corresponde exatamente ao descrito nesta declaração. 
                  Estou ciente de que a falsidade de declaração configura crime previsto no art. 299 do Código Penal.
                </div>

                {/* 5. Data e Assinaturas */}
                <div className="text-[10px] mb-4">
                  Santa Maria - RS, {new Date().toLocaleDateString('pt-BR')}
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4 pb-2 text-center text-[10px]">
                  <div>
                    <div className="border-t border-black pt-1 font-bold">
                      Assinatura do Declarante / Remetente
                    </div>
                    <div className="text-[9px] text-slate-600">Valdir Discos</div>
                  </div>
                  <div>
                    <div className="border-t border-black pt-1 font-bold">
                      Assinatura do Destinatário
                    </div>
                    <div className="text-[9px] text-slate-600">Recebido em: ____/____/________</div>
                  </div>
                </div>

                {/* Rodapé Informativo */}
                <div className="border-t border-dotted border-slate-400 mt-4 pt-2 text-[8px] text-slate-500 text-center">
                  Atenção: A declaração de conteúdo deve ser afixada na parte externa da encomenda, em envelope plástico transparente (saquinho canguru).
                  <br />
                  Valdir Discos • Tradição e Cuidado no Envio de Vinil • {orderNumber ? `Pedido: ${orderNumber}` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Modal de Pesquisa de Discos do Acervo */}
      {showDiscSearch && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Disc className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Adicionar Disco à Declaração</h3>
              </div>
              <button
                onClick={() => setShowDiscSearch(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por artista, álbum ou gaveta..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {filteredDiscs.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Nenhum disco encontrado para "{searchQuery}".
                </div>
              ) : (
                filteredDiscs.map((item) => {
                  const loc = cleanLocationCode(item.drawer);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleAddItemFromDisc(item)}
                      className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {item.release.artist} - {item.release.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Cond: {item.condition?.mediaCondition || 'VG+'}</span>
                          {loc && (
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1 rounded">
                              [{loc}]
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-xs text-emerald-700 shrink-0">
                        R$ {(Number(item.pricing?.basePriceBrl) || 0).toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDiscSearch(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

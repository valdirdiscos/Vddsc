/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  X,
  CheckCircle2,
  Filter,
  Layers,
  DollarSign,
  Disc,
  FileText,
  Database,
  ArrowDownToLine,
  SlidersHorizontal,
} from 'lucide-react';
import { SavedListing } from '../types';
import { exportToExcel, exportToCSV, exportToJsonBackup } from '../utils/excelExport';

interface ExportCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  allListings: SavedListing[];
  filteredListings?: SavedListing[];
  hasActiveFilters?: boolean;
}

export const ExportCatalogModal: React.FC<ExportCatalogModalProps> = ({
  isOpen,
  onClose,
  allListings,
  filteredListings = [],
  hasActiveFilters = false,
}) => {
  const [scope, setScope] = useState<'all' | 'filtered'>(hasActiveFilters && filteredListings.length > 0 ? 'filtered' : 'all');
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'sold'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'physical_store' | 'online_store'>('all');
  const [csvDelimiter, setCsvDelimiter] = useState<';' | ','>(';');
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Calcula itens a serem exportados com base nos filtros selecionados
  const targetItems = useMemo(() => {
    let list = scope === 'filtered' && filteredListings.length > 0 ? filteredListings : allListings;

    if (statusFilter !== 'all') {
      list = list.filter((item) => (item.status || 'available') === statusFilter);
    }

    if (channelFilter !== 'all') {
      list = list.filter((item) => {
        const channels = item.salesChannels || ['physical_store'];
        return channels.includes(channelFilter);
      });
    }

    return list;
  }, [scope, allListings, filteredListings, statusFilter, channelFilter]);

  // Estatísticas do lote a exportar
  const stats = useMemo(() => {
    const totalCount = targetItems.length;
    const totalValue = targetItems.reduce((acc, curr) => acc + (Number(curr.pricing?.basePriceBrl) || 0), 0);
    const uniqueDrawers = new Set(targetItems.map(i => i.drawer).filter(Boolean)).size;
    return { totalCount, totalValue, uniqueDrawers };
  }, [targetItems]);

  if (!isOpen) return null;

  const handleExecuteExport = () => {
    if (targetItems.length === 0) return;

    setIsExporting(true);
    setSuccessMessage(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const scopeLabel = scope === 'filtered' ? 'filtrado' : 'completo';

      if (format === 'xlsx') {
        exportToExcel(targetItems, {
          filename: `valdir_discos_acervo_${scopeLabel}_${today}.xlsx`,
        });
        setSuccessMessage(`Planilha Excel gerada com sucesso (${targetItems.length} discos)!`);
      } else if (format === 'csv') {
        exportToCSV(targetItems, {
          filename: `valdir_discos_acervo_${scopeLabel}_${today}.csv`,
          csvDelimiter,
        });
        setSuccessMessage(`Arquivo CSV gerado com sucesso (${targetItems.length} discos)!`);
      } else {
        exportToJsonBackup(targetItems);
        setSuccessMessage(`Backup JSON completo gerado (${targetItems.length} registros)!`);
      }
    } catch (err: any) {
      console.error('Erro ao exportar acervo:', err);
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <FileSpreadsheet className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Exportar Acervo para Excel</h2>
              <p className="text-xs text-emerald-100">
                Gere planilhas oficiais (.xlsx), arquivos CSV ou backups JSON completos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Disc className="h-3 w-3 text-emerald-600" /> Discos
              </span>
              <span className="text-lg font-black text-slate-900 mt-0.5">
                {stats.totalCount}
              </span>
            </div>
            <div className="flex flex-col border-l border-slate-200 pl-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-emerald-600" /> Valor Balcão
              </span>
              <span className="text-lg font-black text-emerald-700 mt-0.5">
                R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex flex-col border-l border-slate-200 pl-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Layers className="h-3 w-3 text-indigo-600" /> Gavetas
              </span>
              <span className="text-lg font-black text-slate-900 mt-0.5">
                {stats.uniqueDrawers}
              </span>
            </div>
          </div>

          {/* Formato do Arquivo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" /> 1. Formato de Saída
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  format === 'xlsx'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <FileSpreadsheet className={`h-5 w-5 ${format === 'xlsx' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {format === 'xlsx' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Excel (.xlsx)</div>
                  <div className="text-[10px] text-slate-500">Planilha nativa formatada</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  format === 'csv'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <FileText className={`h-5 w-5 ${format === 'csv' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {format === 'csv' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">CSV Universal</div>
                  <div className="text-[10px] text-slate-500">UTF-8 com delimitador</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  format === 'json'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Database className={`h-5 w-5 ${format === 'json' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {format === 'json' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Backup JSON</div>
                  <div className="text-[10px] text-slate-500">Dados brutos completos</div>
                </div>
              </button>
            </div>

            {format === 'csv' && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs mt-2">
                <span className="text-slate-600">Separador de colunas no CSV:</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="delimiter"
                      checked={csvDelimiter === ';'}
                      onChange={() => setCsvDelimiter(';')}
                      className="text-emerald-600"
                    />
                    <span className="font-semibold text-slate-700">Ponto e vírgula ( ; ) Excel Brasil</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer ml-2">
                    <input
                      type="radio"
                      name="delimiter"
                      checked={csvDelimiter === ','}
                      onChange={() => setCsvDelimiter(',')}
                      className="text-emerald-600"
                    />
                    <span className="font-semibold text-slate-700">Vírgula ( , )</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Escopo da Exportação */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-500" /> 2. Escopo dos Discos
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">Todo o Acervo</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Todos os {allListings.length} títulos cadastrados
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('filtered')}
                disabled={filteredListings.length === 0}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  filteredListings.length === 0
                    ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50'
                    : scope === 'filtered'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">Filtrados na Tela</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {filteredListings.length} títulos filtrados atualmente
                </div>
              </button>
            </div>
          </div>

          {/* Filtros de Refinamento Adicionais */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todos os Status</option>
                <option value="available">Somente Disponíveis</option>
                <option value="sold">Somente Vendidos</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Canal de Venda</label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value as any)}
                className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todos os Canais</option>
                <option value="physical_store">Loja Física</option>
                <option value="online_store">Loja Online / Exclusivos</option>
              </select>
            </div>
          </div>

          {/* Lista de Colunas Inclusas */}
          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-1.5 text-xs text-slate-600">
            <div className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
              Colunas inclusas na planilha:
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              SKU/Código de Barras, Gaveta/Loc, Artista, Álbum, Formato, Ano, Gravadora, Catálogo, País, Gêneros, Estilos, Estado Mídia (Goldmine), Detalhes Mídia, Estado Capa, Detalhes Capa, Encarte, Preço Balcão, Preço Shopee, Preço ML, Estoque, Status, Canais, Garimpo, Título Otimizado Mercado Livre (até 60 caracteres), Título Otimizado Shopee (até 115 caracteres), URL Foto, Data de Cadastro.
            </p>
          </div>

          {/* Feedback Message */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleExecuteExport}
            disabled={targetItems.length === 0 || isExporting}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <ArrowDownToLine className="h-4 w-4 animate-bounce" />
                <span>Gerando Planilha...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>
                  Baixar {format.toUpperCase()} ({targetItems.length} {targetItems.length === 1 ? 'item' : 'itens'})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

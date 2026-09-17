/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { SavedListing } from '../types';
import { cleanLocationCode, buildOptimizedTitle, getListingFormatInfo } from './formatHelper';

export interface ExcelExportOptions {
  filename?: string;
  format?: 'xlsx' | 'csv';
  csvDelimiter?: ';' | ',';
  includeTitles?: boolean;
}

/**
 * Converte a lista de discos em um array de objetos estruturados para exportação em planilha.
 */
export function formatListingsForSpreadsheet(listings: SavedListing[]) {
  return listings.map((item) => {
    const formatInfo = getListingFormatInfo(item.release);
    const cleanDrawer = cleanLocationCode(item.drawer) || 'Geral';
    const genres = (item.release.genres || []).join(', ');
    const styles = (item.release.styles || []).join(', ');

    const mlTitle = buildOptimizedTitle({
      artist: item.release.artist,
      title: item.release.title,
      drawer: cleanDrawer,
      platform: 'mercadolivre',
      customBase: item.mercadolivre?.title,
      isOnlySleeve: item.condition?.isOnlySleeve,
      isOnlyMedia: item.condition?.isOnlyMedia,
      isMint: item.condition?.mediaCondition === 'M',
      year: item.release.year,
    });

    const shopeeTitle = buildOptimizedTitle({
      artist: item.release.artist,
      title: item.release.title,
      drawer: cleanDrawer,
      platform: 'shopee',
      customBase: item.shopee?.title,
      isOnlySleeve: item.condition?.isOnlySleeve,
      isOnlyMedia: item.condition?.isOnlyMedia,
      isMint: item.condition?.mediaCondition === 'M',
      year: item.release.year,
    });

    const channels: string[] = [];
    if (item.salesChannels?.includes('physical_store')) channels.push('Loja Física');
    if (item.salesChannels?.includes('online_store')) channels.push('Loja Online');
    if (channels.length === 0) channels.push('Loja Física');

    let statusText = 'Disponível';
    if (item.status === 'sold') statusText = 'Vendido';
    else if (item.status === 'reserved') statusText = 'Reservado';
    else if (item.status === 'personal') statusText = 'Coleção Pessoal';

    return {
      'Código de Barras / SKU': item.barcode || item.id,
      'Gaveta / Loc': cleanDrawer,
      'Artista': item.release.artist || '',
      'Título do Álbum': item.release.title || '',
      'Formato': formatInfo.fullLabel || formatInfo.badgeLabel || 'Vinil LP',
      'Ano': item.release.year || 'N/D',
      'Gravadora / Selo': item.release.label || 'N/D',
      'Nº Catálogo': item.release.catno || 'N/D',
      'País': item.release.country || 'Brasil',
      'Gêneros': genres,
      'Estilos': styles,
      'Condição Mídia (Goldmine)': item.condition?.mediaCondition || 'VG+',
      'Detalhes da Mídia': item.condition?.mediaDetails || '',
      'Condição Capa (Goldmine)': item.condition?.sleeveCondition || 'VG+',
      'Detalhes da Capa': item.condition?.sleeveDetails || '',
      'Encarte': item.condition?.hasInsert ? `Sim (${item.condition.insertCondition || 'VG+'})` : 'Não',
      'Detalhes do Encarte': item.condition?.insertDetails || '',
      'Preço Loja / Balcão (R$)': Number(item.pricing?.basePriceBrl || 0),
      'Preço Shopee (R$)': Number(item.shopee?.suggestedPrice || item.pricing?.basePriceBrl || 0),
      'Preço Mercado Livre (R$)': Number(item.mercadolivre?.suggestedPrice || item.pricing?.basePriceBrl || 0),
      'Quantidade': item.quantity ?? 1,
      'Status': statusText,
      'Canais de Venda': channels.join(' + '),
      'É Garimpo?': item.isGarimpo ? 'Sim' : 'Não',
      'Exclusivo Online?': item.isOnlineExclusive ? 'Sim' : 'Não',
      'Título Mercado Livre (<= 60)': mlTitle,
      'Título Shopee (<= 115)': shopeeTitle,
      'Foto de Capa (URL)': item.release.coverImage || '',
      'Data de Cadastro': item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '',
    };
  });
}

/**
 * Gera e realiza o download de uma planilha Excel nativa (.xlsx).
 */
export function exportToExcel(listings: SavedListing[], options: ExcelExportOptions = {}): void {
  const data = formatListingsForSpreadsheet(listings);
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Define larguras ideais para as colunas
  const colWidths = [
    { wch: 18 }, // Código de Barras
    { wch: 14 }, // Gaveta / Loc
    { wch: 26 }, // Artista
    { wch: 32 }, // Título
    { wch: 16 }, // Formato
    { wch: 8 },  // Ano
    { wch: 20 }, // Gravadora
    { wch: 16 }, // Catálogo
    { wch: 12 }, // País
    { wch: 22 }, // Gêneros
    { wch: 22 }, // Estilos
    { wch: 14 }, // Cond Mídia
    { wch: 24 }, // Detalhes Mídia
    { wch: 14 }, // Cond Capa
    { wch: 24 }, // Detalhes Capa
    { wch: 12 }, // Encarte
    { wch: 20 }, // Detalhes Encarte
    { wch: 16 }, // Preço Loja
    { wch: 16 }, // Preço Shopee
    { wch: 16 }, // Preço ML
    { wch: 10 }, // Qtd
    { wch: 12 }, // Status
    { wch: 20 }, // Canais
    { wch: 12 }, // Garimpo
    { wch: 14 }, // Exclusivo Online
    { wch: 45 }, // Título ML
    { wch: 55 }, // Título Shopee
    { wch: 40 }, // URL Foto
    { wch: 14 }, // Data Cadastro
  ];

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Acervo Valdir Discos');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = options.filename || `acervo_valdir_discos_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Gera e realiza o download de arquivo CSV formatado com UTF-8 BOM e delimitador selecionável.
 */
export function exportToCSV(listings: SavedListing[], options: ExcelExportOptions = {}): void {
  const data = formatListingsForSpreadsheet(listings);
  const delimiter = options.csvDelimiter || ';'; // Padrão brasileiro para abrir certinho no Excel

  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const headerRow = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(delimiter);

  const rows = data.map((row) => {
    return headers.map((key) => {
      const val = (row as any)[key];
      if (val === undefined || val === null) return '""';
      if (typeof val === 'number') {
        // Formata número com vírgula para pt-BR se delimitador for ponto e vírgula
        return delimiter === ';' ? `"${val.toFixed(2).replace('.', ',')}"` : val.toString();
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(delimiter);
  });

  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = options.filename || `acervo_valdir_discos_${dateStr}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta backup completo em JSON estruturado com todos os metadados.
 */
export function exportToJsonBackup(listings: SavedListing[]): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    storeName: 'Valdir Discos',
    totalItems: listings.length,
    version: '2.0',
    data: listings,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];

  link.setAttribute('href', url);
  link.setAttribute('download', `backup_acervo_valdir_discos_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

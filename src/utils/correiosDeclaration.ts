/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';

export interface CorreiosSender {
  nome: string;
  doc: string; // CPF ou CNPJ
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
}

export interface CorreiosRecipient {
  nome: string;
  doc: string; // CPF ou CNPJ
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
}

export interface CorreiosDeclarationItem {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface CorreiosDeclarationData {
  orderNumber?: string;
  remetente: CorreiosSender;
  destinatario: CorreiosRecipient;
  itens: CorreiosDeclarationItem[];
  observacoes?: string;
  dataEmissao?: string;
}

export const DEFAULT_VALDIR_SENDER: CorreiosSender = {
  nome: 'VALDIR DISCOS',
  doc: '91.234.567/0001-89', // CNPJ / Documento padrão da loja
  logradouro: 'Rua Venâncio Aires',
  numero: '1234',
  complemento: 'Loja Física',
  bairro: 'Centro',
  cidade: 'Santa Maria',
  uf: 'RS',
  cep: '97010-000',
  telefone: '(55) 98116-4666',
};

/**
 * Gera um PDF oficial da Declaração de Conteúdo dos Correios no padrão A4 (Portaria 2.610/2018).
 */
export function exportCorreiosDeclarationToPdf(data: CorreiosDeclarationData, filename = 'declaracao_conteudo_correios.pdf'): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2); // 182mm
  let currentY = 14;

  // 1. Cabeçalho Oficial
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.rect(marginX, currentY, contentWidth, 14, 'S');
  pdf.text('EMPRESA BRASILEIRA DE CORREIOS E TELÉGRAFOS', pageWidth / 2, currentY + 5.5, { align: 'center' });
  pdf.setFontSize(13);
  pdf.text('DECLARAÇÃO DE CONTEÚDO', pageWidth / 2, currentY + 11, { align: 'center' });
  currentY += 16;

  // 2. Quadro Remetente e Destinatário
  const halfWidth = (contentWidth - 4) / 2;
  const boxHeight = 44;

  // Remetente (Esquerda)
  pdf.rect(marginX, currentY, halfWidth, boxHeight, 'S');
  pdf.setFillColor(242, 242, 242);
  pdf.rect(marginX, currentY, halfWidth, 6, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('REMETENTE', marginX + 3, currentY + 4.2);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  let remY = currentY + 9.5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Nome:', marginX + 3, remY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.remetente.nome.substring(0, 36), marginX + 16, remY);

  remY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('CPF/CNPJ:', marginX + 3, remY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.remetente.doc || 'Não informado', marginX + 22, remY);

  remY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Endereço:', marginX + 3, remY);
  pdf.setFont('helvetica', 'normal');
  const remEnd = `${data.remetente.logradouro}, ${data.remetente.numero}${data.remetente.complemento ? ` - ${data.remetente.complemento}` : ''}`;
  pdf.text(remEnd.substring(0, 34), marginX + 20, remY);

  remY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bairro:', marginX + 3, remY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.remetente.bairro || 'Centro', marginX + 15, remY);

  remY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Cidade/UF:', marginX + 3, remY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${data.remetente.cidade} / ${data.remetente.uf}`, marginX + 21, remY);

  remY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('CEP:', marginX + 3, remY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${data.remetente.cep}   Tel: ${data.remetente.telefone}`, marginX + 12, remY);

  // Destinatário (Direita)
  const destX = marginX + halfWidth + 4;
  pdf.rect(destX, currentY, halfWidth, boxHeight, 'S');
  pdf.setFillColor(242, 242, 242);
  pdf.rect(destX, currentY, halfWidth, 6, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('DESTINATÁRIO', destX + 3, currentY + 4.2);

  let destY = currentY + 9.5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('Nome:', destX + 3, destY);
  pdf.setFont('helvetica', 'normal');
  pdf.text((data.destinatario.nome || 'Cliente').substring(0, 36), destX + 16, destY);

  destY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('CPF/CNPJ:', destX + 3, destY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.destinatario.doc || 'Não informado', destX + 22, destY);

  destY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Endereço:', destX + 3, destY);
  pdf.setFont('helvetica', 'normal');
  const destEnd = `${data.destinatario.logradouro || ''}, ${data.destinatario.numero || 'S/N'}${data.destinatario.complemento ? ` - ${data.destinatario.complemento}` : ''}`;
  pdf.text(destEnd.substring(0, 34), destX + 20, destY);

  destY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bairro:', destX + 3, destY);
  pdf.setFont('helvetica', 'normal');
  pdf.text((data.destinatario.bairro || '').substring(0, 32), destX + 15, destY);

  destY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Cidade/UF:', destX + 3, destY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${data.destinatario.cidade || ''} / ${data.destinatario.uf || ''}`, destX + 21, destY);

  destY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('CEP:', destX + 3, destY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${data.destinatario.cep || ''}   Tel: ${data.destinatario.telefone || ''}`, destX + 12, destY);

  currentY += boxHeight + 4;

  // 3. Identificação dos Bens / Discos
  pdf.setFillColor(242, 242, 242);
  pdf.rect(marginX, currentY, contentWidth, 6, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('IDENTIFICAÇÃO DOS BENS (DISCOS / MÍDIAS / ITENS POSTADOS)', marginX + 3, currentY + 4.2);
  currentY += 6;

  // Cabeçalho da Tabela
  const colItemW = 12;
  const colQtdW = 16;
  const colValW = 28;
  const colDescW = contentWidth - colItemW - colQtdW - colValW; // 126mm

  pdf.rect(marginX, currentY, contentWidth, 6, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('ITEM', marginX + 3, currentY + 4);
  pdf.text('CONTEÚDO / DISCRIMINAÇÃO DO PRODUTO', marginX + colItemW + 3, currentY + 4);
  pdf.text('QUANT.', marginX + colItemW + colDescW + 2, currentY + 4);
  pdf.text('VALOR TOTAL (R$)', marginX + colItemW + colDescW + colQtdW + 2, currentY + 4);
  currentY += 6;

  let totalQtd = 0;
  let totalVal = 0;

  // Linhas dos itens
  const rowHeight = 7;
  const maxRows = Math.max(data.itens.length, 6);

  for (let i = 0; i < maxRows; i++) {
    const item = data.itens[i];
    pdf.rect(marginX, currentY, contentWidth, rowHeight, 'S');

    // Linhas verticais separadoras
    pdf.line(marginX + colItemW, currentY, marginX + colItemW, currentY + rowHeight);
    pdf.line(marginX + colItemW + colDescW, currentY, marginX + colItemW + colDescW, currentY + rowHeight);
    pdf.line(marginX + colItemW + colDescW + colQtdW, currentY, marginX + colItemW + colDescW + colQtdW, currentY + rowHeight);

    if (item) {
      const itemSubtotal = (item.valorUnitario || 0) * (item.quantidade || 1);
      totalQtd += item.quantidade || 1;
      totalVal += itemSubtotal;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(String(i + 1), marginX + (colItemW / 2), currentY + 4.5, { align: 'center' });
      pdf.text(item.descricao.substring(0, 68), marginX + colItemW + 3, currentY + 4.5);
      pdf.text(String(item.quantidade || 1), marginX + colItemW + colDescW + (colQtdW / 2), currentY + 4.5, { align: 'center' });
      pdf.text(`R$ ${itemSubtotal.toFixed(2).replace('.', ',')}`, marginX + contentWidth - 3, currentY + 4.5, { align: 'right' });
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text(String(i + 1), marginX + (colItemW / 2), currentY + 4.5, { align: 'center' });
    }

    currentY += rowHeight;
  }

  // Linha de Totais
  pdf.setFillColor(242, 242, 242);
  pdf.rect(marginX, currentY, contentWidth, 7, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('TOTAIS:', marginX + colItemW + 3, currentY + 4.8);
  pdf.text(String(totalQtd), marginX + colItemW + colDescW + (colQtdW / 2), currentY + 4.8, { align: 'center' });
  pdf.text(`R$ ${totalVal.toFixed(2).replace('.', ',')}`, marginX + contentWidth - 3, currentY + 4.8, { align: 'right' });
  currentY += 10;

  // 4. Declaração Legal
  pdf.rect(marginX, currentY, contentWidth, 24, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('DECLARAÇÃO LEGAL:', marginX + 3, currentY + 4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);

  const legalText = 'Declaro que não me enquadro no conceito de contribuinte previsto no art. 4º da Lei Complementar nº 87/1996, uma vez que não realizo, com habitualidade ou em volume que caracterize intuito comercial, operações de circulação de mercadorias, a não ser as de venda de bens do meu acervo/coleção, e que o conteúdo da encomenda corresponde exatamente ao descrito nesta declaração. Estou ciente de que a falsidade de declaração configura crime previsto no art. 299 do Código Penal.';
  const splitLegal = pdf.splitTextToSize(legalText, contentWidth - 6);
  pdf.text(splitLegal, marginX + 3, currentY + 8.5);
  currentY += 28;

  // 5. Data e Assinaturas
  const todayStr = data.dataEmissao || new Date().toLocaleDateString('pt-BR');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`Santa Maria - RS, ${todayStr}`, marginX + 3, currentY);
  currentY += 14;

  const sigWidth = 75;
  // Assinatura Remetente
  pdf.line(marginX + 10, currentY, marginX + 10 + sigWidth, currentY);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('Assinatura do Declarante / Remetente', marginX + 10 + (sigWidth / 2), currentY + 4, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('Valdir Discos - Santa Maria / RS', marginX + 10 + (sigWidth / 2), currentY + 7.5, { align: 'center' });

  // Assinatura Destinatário
  const destSigX = marginX + contentWidth - sigWidth - 10;
  pdf.line(destSigX, currentY, destSigX + sigWidth, currentY);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('Assinatura do Destinatário', destSigX + (sigWidth / 2), currentY + 4, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('Recebido em: _____/_____/________', destSigX + (sigWidth / 2), currentY + 7.5, { align: 'center' });

  // 6. Rodapé Informativo
  currentY += 15;
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Atenção: A declaração de conteúdo deve ser afixada na parte externa da encomenda, em envelope plástico transparente.', pageWidth / 2, currentY, { align: 'center' });
  pdf.text(`Valdir Discos • Sistema Oficial de Envio e Expedição • Pedido: ${data.orderNumber || 'AVULSO'}`, pageWidth / 2, currentY + 3.5, { align: 'center' });

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

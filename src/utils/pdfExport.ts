/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { SavedListing } from '../types';

export interface ThermalPdfOptions {
  format: 'thermal-80mm' | 'thermal-58mm' | 'sticker-50x30' | 'sticker-60x40' | 'a4-sheet';
  copies?: number;
  filename?: string;
}

/**
 * Loads an image from data URL and returns its natural dimensions
 */
function loadImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

/**
 * Generates and downloads a PDF file from a thermal ticket image (PNG data URL).
 */
export async function exportThermalTicketToPdf(
  ticketImageDataUrl: string,
  options: ThermalPdfOptions
): Promise<void> {
  if (!ticketImageDataUrl) {
    throw new Error('Nenhuma imagem de etiqueta disponível para exportar em PDF.');
  }

  const { format, copies = 1, filename = 'etiqueta-termica.pdf' } = options;
  const { width: pxWidth, height: pxHeight } = await loadImageDimensions(ticketImageDataUrl);
  const aspectRatio = pxHeight / pxWidth;

  if (format === 'a4-sheet') {
    // Generate A4 document (210 x 297 mm) with centered labels or grid
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const labelWidthMm = 70; // 70mm wide on A4
    const labelHeightMm = labelWidthMm * aspectRatio;

    // Arrange labels in a 2-column grid on A4
    const marginX = 25;
    const marginY = 20;
    const gapX = 20;
    const gapY = 15;
    const cols = 2;
    const rows = 3;
    const perPage = cols * rows;

    for (let c = 0; c < copies; c++) {
      const pageIndex = Math.floor(c / perPage);
      const indexOnPage = c % perPage;

      if (c > 0 && indexOnPage === 0) {
        pdf.addPage('a4', 'portrait');
      }

      const col = indexOnPage % cols;
      const row = Math.floor(indexOnPage / cols);

      const x = marginX + col * (labelWidthMm + gapX);
      const y = marginY + row * (labelHeightMm + gapY);

      // Check if it fits on page; if height is tall, adjust
      pdf.addImage(ticketImageDataUrl, 'PNG', x, y, labelWidthMm, Math.min(labelHeightMm, 75), undefined, 'FAST');
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return;
  }

  // Exact roll / sticker dimension in millimeters
  let widthMm = 80;
  if (format === 'thermal-58mm') {
    widthMm = 58;
  } else if (format === 'sticker-50x30') {
    widthMm = 50;
  } else if (format === 'sticker-60x40') {
    widthMm = 60;
  }

  let heightMm: number;
  if (format === 'sticker-50x30') {
    heightMm = 30;
  } else if (format === 'sticker-60x40') {
    heightMm = 40;
  } else {
    // Dynamic continuous height based on aspect ratio
    heightMm = Math.round(widthMm * aspectRatio);
  }

  // Create document with exact label dimensions
  const pdf = new jsPDF({
    orientation: heightMm > widthMm ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [widthMm, heightMm]
  });

  for (let i = 0; i < copies; i++) {
    if (i > 0) {
      pdf.addPage([widthMm, heightMm], heightMm > widthMm ? 'portrait' : 'landscape');
    }
    pdf.addImage(ticketImageDataUrl, 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Exports any HTML container element (e.g. #printable-disc-label) as high-res PDF.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: {
    filename?: string;
    pdfFormat?: 'label-exact' | 'a4-centered';
    pixelRatio?: number;
  } = {}
): Promise<void> {
  const {
    filename = 'etiqueta-valdir-discos.pdf',
    pdfFormat = 'label-exact',
    pixelRatio = 3
  } = options;

  const dataUrl = await toPng(element, {
    pixelRatio,
    backgroundColor: '#ffffff',
    cacheBust: true
  });

  const { width: pxWidth, height: pxHeight } = await loadImageDimensions(dataUrl);
  const aspectRatio = pxHeight / pxWidth;

  if (pdfFormat === 'a4-centered') {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const labelWidthMm = 100;
    const labelHeightMm = labelWidthMm * aspectRatio;
    const x = (210 - labelWidthMm) / 2;
    const y = (297 - labelHeightMm) / 2;

    pdf.addImage(dataUrl, 'PNG', x, y, labelWidthMm, labelHeightMm, undefined, 'FAST');
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return;
  }

  // Exact custom dimensions in mm (scale standard 100mm width)
  const widthMm = 100;
  const heightMm = Math.round(widthMm * aspectRatio);

  const pdf = new jsPDF({
    orientation: heightMm > widthMm ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [widthMm, heightMm]
  });

  pdf.addImage(dataUrl, 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Generates an A4 Printable PDF containing multiple labels arranged in a grid
 */
export async function exportBatchListingsToPdf(
  itemsWithImages: Array<{
    elementId?: string;
    imageDataUrl?: string;
    artist: string;
    title: string;
    barcode: string;
  }>,
  options: {
    filename?: string;
    labelsPerPage?: number;
  } = {}
): Promise<void> {
  const { filename = 'etiquetas-lote-valdir-discos.pdf' } = options;

  if (itemsWithImages.length === 0) {
    throw new Error('Nenhum item selecionado para gerar PDF.');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // A4 grid: 2 columns x 4 rows = 8 labels per page
  const cols = 2;
  const rows = 4;
  const perPage = cols * rows;
  const labelWidthMm = 90;
  const labelHeightMm = 60;
  const marginX = 12;
  const marginY = 15;
  const gapX = 6;
  const gapY = 8;

  for (let i = 0; i < itemsWithImages.length; i++) {
    const item = itemsWithImages[i];
    const pageIndex = Math.floor(i / perPage);
    const indexOnPage = i % perPage;

    if (i > 0 && indexOnPage === 0) {
      pdf.addPage('a4', 'portrait');
    }

    const col = indexOnPage % cols;
    const row = Math.floor(indexOnPage / cols);

    const x = marginX + col * (labelWidthMm + gapX);
    const y = marginY + row * (labelHeightMm + gapY);

    if (item.imageDataUrl) {
      pdf.addImage(item.imageDataUrl, 'PNG', x, y, labelWidthMm, labelHeightMm, undefined, 'FAST');
    } else if (item.elementId) {
      const el = document.getElementById(item.elementId);
      if (el) {
        try {
          const imgUrl = await toPng(el, { pixelRatio: 2.5, backgroundColor: '#ffffff' });
          pdf.addImage(imgUrl, 'PNG', x, y, labelWidthMm, labelHeightMm, undefined, 'FAST');
        } catch (e) {
          console.error('Erro renderizando label para PDF:', e);
        }
      }
    }
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Generates and downloads a store sales receipt / cupom não fiscal PDF for a physical sale order
 */
export async function exportSaleReceiptToPdf(
  order: {
    orderNumber: string;
    soldAt: string;
    items: Array<{
      barcode: string;
      artist: string;
      title: string;
      originalPrice: number;
      discount: number;
      finalPrice: number;
      drawer?: string;
      condition?: string;
    }>;
    subtotal: number;
    totalDiscount: number;
    totalAmount: number;
    paymentMethod: string;
    amountPaid?: number;
    changeAmount?: number;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  },
  options: {
    format?: 'thermal-80mm' | 'a4';
    filename?: string;
  } = {}
): Promise<void> {
  const { format = 'thermal-80mm', filename = `recibo-${order.orderNumber}.pdf` } = options;

  if (format === 'thermal-80mm') {
    // Standard 80mm thermal roll format
    const widthMm = 80;
    const baseHeight = 110;
    const itemHeight = 14;
    const heightMm = Math.max(130, baseHeight + order.items.length * itemHeight);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [widthMm, heightMm]
    });

    // Store Header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('VALDIR DISCOS', 40, 10, { align: 'center' });

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Loja de Vinil & Colecionáveis • Atendimento Físico', 40, 14, { align: 'center' });
    pdf.text('CUPOM NÃO FISCAL DE VENDA', 40, 18, { align: 'center' });

    pdf.setLineWidth(0.3);
    pdf.line(5, 21, 75, 21);

    // Order Info
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`PEDIDO: ${order.orderNumber}`, 5, 26);
    pdf.setFont('helvetica', 'normal');
    const dateStr = new Date(order.soldAt).toLocaleString('pt-BR');
    pdf.text(`DATA: ${dateStr}`, 5, 30);

    if (order.customerName) {
      pdf.text(`CLIENTE: ${order.customerName} ${order.customerPhone ? `(${order.customerPhone})` : ''}`, 5, 34);
    }

    pdf.line(5, 37, 75, 37);

    // Items header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text('ITEM / DISCO', 5, 41);
    pdf.text('VALOR', 75, 41, { align: 'right' });
    pdf.line(5, 43, 75, 43);

    let currentY = 47;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);

    order.items.forEach((item, index) => {
      const artistTitle = `${index + 1}. ${item.artist} - ${item.title}`.substring(0, 38);
      pdf.setFont('helvetica', 'bold');
      pdf.text(artistTitle, 5, currentY);
      pdf.text(`R$ ${item.finalPrice.toFixed(2)}`, 75, currentY, { align: 'right' });
      currentY += 3.5;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      const sub = `Cód: ${item.barcode} | Estoque: [${item.drawer || 'Balcão'}] ${item.discount > 0 ? `| Desc: R$ ${item.discount.toFixed(2)}` : ''}`;
      pdf.text(sub, 5, currentY);
      currentY += 4.5;
    });

    pdf.line(5, currentY, 75, currentY);
    currentY += 4;

    // Totals
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Subtotal (${order.items.length} itens):`, 5, currentY);
    pdf.text(`R$ ${order.subtotal.toFixed(2)}`, 75, currentY, { align: 'right' });
    currentY += 4;

    if (order.totalDiscount > 0) {
      pdf.text(`Desconto Total:`, 5, currentY);
      pdf.text(`- R$ ${order.totalDiscount.toFixed(2)}`, 75, currentY, { align: 'right' });
      currentY += 4;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(`TOTAL PAGO:`, 5, currentY);
    pdf.text(`R$ ${order.totalAmount.toFixed(2)}`, 75, currentY, { align: 'right' });
    currentY += 5;

    // Payment details
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Forma de Pagamento: ${order.paymentMethod}`, 5, currentY);
    currentY += 3.5;

    if (order.amountPaid && order.amountPaid > order.totalAmount) {
      pdf.text(`Valor Recebido: R$ ${order.amountPaid.toFixed(2)} | Troco: R$ ${(order.changeAmount || 0).toFixed(2)}`, 5, currentY);
      currentY += 3.5;
    }

    if (order.notes) {
      pdf.text(`Obs: ${order.notes}`, 5, currentY);
      currentY += 3.5;
    }

    pdf.line(5, currentY, 75, currentY);
    currentY += 4;

    // Footer
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Obrigado pela preferência! Viva o Vinil!', 40, currentY, { align: 'center' });
    currentY += 3.5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.text('Valdir Discos • Tradição & Qualidade Musical', 40, currentY, { align: 'center' });

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return;
  }

  // A4 Receipt
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // A4 Layout
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('VALDIR DISCOS', 20, 25);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Comprovante de Venda e Entrega de Discos de Vinil', 20, 31);
  pdf.text(`Pedido: ${order.orderNumber} • Emitido em: ${new Date(order.soldAt).toLocaleString('pt-BR')}`, 20, 36);

  pdf.line(20, 40, 190, 40);

  if (order.customerName) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Cliente: ${order.customerName}`, 20, 46);
    if (order.customerPhone) {
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Telefone / WhatsApp: ${order.customerPhone}`, 20, 51);
    }
  }

  let tableY = 60;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Item', 20, tableY);
  pdf.text('Código', 35, tableY);
  pdf.text('Artista / Título', 70, tableY);
  pdf.text('Preço Original', 140, tableY);
  pdf.text('Final (R$)', 175, tableY);
  pdf.line(20, tableY + 2, 190, tableY + 2);

  tableY += 8;
  pdf.setFont('helvetica', 'normal');

  order.items.forEach((item, index) => {
    pdf.text(`${index + 1}`, 20, tableY);
    pdf.text(item.barcode, 35, tableY);
    pdf.text(`${item.artist} - ${item.title}`.substring(0, 34), 70, tableY);
    pdf.text(`R$ ${item.originalPrice.toFixed(2)}`, 140, tableY);
    pdf.text(`R$ ${item.finalPrice.toFixed(2)}`, 175, tableY);
    tableY += 6;
  });

  pdf.line(20, tableY + 2, 190, tableY + 2);
  tableY += 10;

  pdf.setFont('helvetica', 'bold');
  pdf.text(`Subtotal: R$ ${order.subtotal.toFixed(2)}`, 140, tableY);
  tableY += 6;
  if (order.totalDiscount > 0) {
    pdf.text(`Desconto: - R$ ${order.totalDiscount.toFixed(2)}`, 140, tableY);
    tableY += 6;
  }
  pdf.setFontSize(12);
  pdf.text(`TOTAL: R$ ${order.totalAmount.toFixed(2)}`, 140, tableY);

  tableY += 12;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Forma de Pagamento: ${order.paymentMethod}`, 20, tableY);
  tableY += 6;
  if (order.amountPaid && order.amountPaid > order.totalAmount) {
    pdf.text(`Recebido: R$ ${order.amountPaid.toFixed(2)} | Troco: R$ ${(order.changeAmount || 0).toFixed(2)}`, 20, tableY);
    tableY += 6;
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}


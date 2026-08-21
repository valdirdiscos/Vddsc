/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';
import { SavedListing, DiscogsRelease, ConditionSelection, PricingConfig, SalesChannel } from '../types';

export interface QRCodePayloadOptions {
  mode?: 'full' | 'compact' | 'link';
}

export function formatDiscQRCodePayload(
  listing: {
    id?: string;
    barcode?: string;
    release: DiscogsRelease;
    condition?: ConditionSelection;
    pricing?: PricingConfig;
    drawer?: string;
    salesChannels?: SalesChannel[];
  },
  options: QRCodePayloadOptions = { mode: 'full' }
): string {
  const id = listing.id || 'ITEM-NOVO';
  const barcode = listing.barcode || `VD-${id.replace('list_', '').slice(-8)}`;
  const artist = listing.release.artist || 'Artista Desconhecido';
  const title = listing.release.title || 'Álbum';
  const drawer = listing.drawer?.trim() || 'SEM_LOC';
  const mediaCond = listing.condition?.mediaCondition || 'VG+';
  const sleeveCond = listing.condition?.sleeveCondition || 'VG+';
  const price = listing.pricing?.basePriceBrl ? `R$ ${listing.pricing.basePriceBrl.toFixed(2)}` : 'R$ 0,00';
  const year = listing.release.year || '';
  const country = listing.release.country || 'Brasil';
  const catno = listing.release.catno || '';
  const channels = (listing.salesChannels || ['physical_store', 'online_store', 'shopee', 'mercadolivre'])
    .map(c => {
      switch (c) {
        case 'physical_store': return 'FÍSICA';
        case 'online_store': return 'ONLINE';
        case 'shopee': return 'SHOPEE';
        case 'mercadolivre': return 'ML';
        default: return c;
      }
    }).join(',');

  if (options.mode === 'link') {
    return `https://valdirdiscos.app/item/${id}`;
  }

  if (options.mode === 'compact') {
    return `VALDIR|${id}|${barcode}|${drawer}|${mediaCond}/${sleeveCond}|${price}`;
  }

  // Full structured format (human and machine readable)
  return [
    `=== VALDIR DISCOS - CADASTRO ===`,
    `ID: ${id}`,
    `COD: ${barcode}`,
    `ARTISTA: ${artist}`,
    `ALBUM: ${title}`,
    `ANO: ${year} | PAIS: ${country}`,
    `CAT: ${catno}`,
    `LOC/GAVETA: ${drawer}`,
    `CONSERVAÇÃO: ${mediaCond}/${sleeveCond}`,
    `VALOR: ${price}`,
    `CANAIS: ${channels}`,
    `================================`
  ].join('\n');
}

/**
 * Extracts and parses any scanned QR code / Barcode text or URL
 */
export function parseScannedCode(rawText: string): {
  id?: string;
  barcode?: string;
  drawer?: string;
  catno?: string;
  isDiscogs?: boolean;
  discogsId?: string;
  rawText: string;
} {
  const text = (rawText || '').trim();
  if (!text) {
    return { rawText: '' };
  }

  // 1. Try parsing JSON if it's a JSON payload
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try {
      const data = JSON.parse(text);
      if (data && typeof data === 'object') {
        return {
          id: data.id || data.listingId || undefined,
          barcode: data.barcode || data.code || data.cod || undefined,
          drawer: data.drawer || data.gaveta || undefined,
          catno: data.catno || data.catalogNumber || undefined,
          discogsId: data.discogsId || data.releaseId ? String(data.discogsId || data.releaseId) : undefined,
          rawText: text
        };
      }
    } catch {}
  }

  // 2. Check if it's a direct listing ID (e.g. list_1740000000000)
  if (text.startsWith('list_')) {
    return { id: text, rawText: text };
  }

  // 3. Check for VD Barcode pattern e.g. VD-17240192, VD-12345, VD17240192, or VD 17240192
  const vdMatch = text.match(/^VD[\s-_]?([A-Z0-9_-]+)/i);
  if (vdMatch) {
    return { barcode: `VD-${vdMatch[1].toUpperCase()}`, rawText: text };
  }

  // 4. Compact payload: VALDIR|id|barcode|drawer|...
  if (text.startsWith('VALDIR|') || text.startsWith('VD|')) {
    const parts = text.split('|');
    return {
      id: parts[1] || undefined,
      barcode: parts[2] || undefined,
      drawer: parts[3] || undefined,
      rawText: text
    };
  }

  // 5. Full payload parser from thermal ticket or QR label
  if (text.includes('VALDIR DISCOS') || text.includes('ID: list_') || text.includes('COD: VD-')) {
    const idMatch = text.match(/ID:\s*(list_[^\s\n\r]+)/i);
    const codMatch = text.match(/COD(?:IGO)?:\s*([^\s\n\r]+)/i);
    const locMatch = text.match(/(?:LOC\/GAVETA|GAVETA|LOC):\s*([^\n\r]+)/i);
    const catMatch = text.match(/CAT(?:ALOGO)?:\s*([^\n\r]+)/i);
    return {
      id: idMatch ? idMatch[1].trim() : undefined,
      barcode: codMatch ? codMatch[1].trim() : undefined,
      drawer: locMatch ? locMatch[1].trim() : undefined,
      catno: catMatch ? catMatch[1].trim() : undefined,
      rawText: text
    };
  }

  // 6. URL link with listing ID e.g. https://valdirdiscos.app/item/list_... or /item/VD-...
  const urlItemMatch = text.match(/\/item\/(list_[^\s\/?#]+)/i);
  if (urlItemMatch) {
    return { id: urlItemMatch[1], rawText: text };
  }

  // 7. Discogs Release URL or Master URL e.g. https://www.discogs.com/release/249504
  const discogsMatch = text.match(/discogs\.com\/(?:[a-z]{2}\/)?(?:release|master)\/(\d+)/i);
  if (discogsMatch) {
    return { isDiscogs: true, discogsId: discogsMatch[1], rawText: text };
  }

  // 8. Pure numeric Discogs ID or Barcode (between 4 and 14 digits)
  if (/^\d{4,14}$/.test(text)) {
    return { isDiscogs: true, discogsId: text, barcode: text, rawText: text };
  }

  // Fallback: return raw text
  return { id: text, barcode: text, rawText: text };
}

/**
 * Returns user-friendly name for a sales channel
 */
export function getSalesChannelMeta(channel: SalesChannel): {
  id: SalesChannel;
  name: string;
  shortName: string;
  badgeColor: string;
  iconBg: string;
  textColor: string;
  description: string;
} {
  switch (channel) {
    case 'physical_store':
      return {
        id: 'physical_store',
        name: 'Loja Física (Balcão)',
        shortName: 'Física',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        iconBg: 'bg-emerald-500 text-white',
        textColor: 'text-emerald-700',
        description: 'Disponível no acervo físico, prateleiras e gavetas da loja.'
      };
    case 'online_store':
      return {
        id: 'online_store',
        name: 'Loja Própria Online',
        shortName: 'Online',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        iconBg: 'bg-indigo-600 text-white',
        textColor: 'text-indigo-700',
        description: 'Exibido na vitrine digital e catálogo web próprio para clientes.'
      };
    case 'shopee':
      return {
        id: 'shopee',
        name: 'Shopee',
        shortName: 'Shopee',
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
        iconBg: 'bg-orange-500 text-white',
        textColor: 'text-orange-700',
        description: 'Anunciado na plataforma de marketplace da Shopee.'
      };
    case 'mercadolivre':
      return {
        id: 'mercadolivre',
        name: 'Mercado Livre',
        shortName: 'Mercado Livre',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        iconBg: 'bg-amber-400 text-slate-900',
        textColor: 'text-amber-700',
        description: 'Anunciado na plataforma de marketplace do Mercado Livre.'
      };
  }
}

/**
 * Generates a high quality QR Code base64 Data URL
 */
export async function generateDiscQRCode(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    color?: { dark: string; light: string };
  }
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 300,
      margin: options?.margin ?? 2,
      color: {
        dark: options?.color?.dark || '#0f172a',
        light: options?.color?.light || '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Draws and exports a crisp, high-resolution physical sticker label to PNG Data URL
 * using HTML5 Canvas directly to avoid CORS issues with external album covers.
 */
export async function renderDiscLabelToCanvas(
  listing: {
    id?: string;
    release: DiscogsRelease;
    condition?: ConditionSelection;
    pricing?: PricingConfig;
    drawer?: string;
  },
  labelSize: 'standard' | 'compact' | 'minimal' = 'standard',
  qrCodeDataUrl?: string
): Promise<string> {
  const itemId = (listing.id || 'ITEM-NOVO').replace('list_', '');
  const artist = (listing.release.artist || 'ARTISTA DESCONHECIDO').toUpperCase();
  const title = listing.release.title || 'Álbum';
  const drawer = (listing.drawer?.trim() || 'SEM_LOC').toUpperCase();
  const mediaCond = listing.condition?.mediaCondition || 'VG+';
  const sleeveCond = listing.condition?.sleeveCondition || 'VG+';
  const price = listing.pricing?.basePriceBrl ? `R$ ${listing.pricing.basePriceBrl.toFixed(2)}` : 'R$ 0,00';
  const year = listing.release.year ? `${listing.release.year}` : '';
  const country = listing.release.country || 'Brasil';
  const labelName = listing.release.label || '';
  const catno = listing.release.catno || '';

  // Get QR Data URL if not provided
  let qrUrl = qrCodeDataUrl;
  if (!qrUrl) {
    const payload = formatDiscQRCodePayload(listing, { mode: 'full' });
    qrUrl = await generateDiscQRCode(payload, { width: 300, margin: 1 });
  }

  // Load QR Image
  const qrImg = new Image();
  await new Promise<void>((resolve) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = () => resolve();
    qrImg.src = qrUrl!;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return qrUrl || '';

  if (labelSize === 'minimal') {
    // 600 x 600 px square minimal tag
    canvas.width = 600;
    canvas.height = 600;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 600);

    // Border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 576, 576);

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('VALDIR DISCOS', 28, 48);

    // ID Pill
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(440, 24, 130, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(itemId, 505, 46);
    ctx.textAlign = 'left';

    // QR Code
    if (qrImg.width > 0) {
      ctx.drawImage(qrImg, 120, 80, 360, 360);
    }

    // Artist & Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(artist.length > 32 ? artist.substring(0, 30) + '...' : artist, 300, 480);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(title.length > 36 ? title.substring(0, 34) + '...' : title, 300, 514);

    // Loc & Price
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`LOC: ${drawer}  •  ${price}`, 300, 554);

    return canvas.toDataURL('image/png');
  }

  if (labelSize === 'compact') {
    // 800 x 360 px compact sticker
    canvas.width = 800;
    canvas.height = 360;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 360);

    // Border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, 780, 340);

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('VALDIR DISCOS', 28, 44);

    // ID Pill
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(360, 22, 140, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(itemId, 430, 43);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, 62);
    ctx.lineTo(772, 62);
    ctx.stroke();

    // Artist & Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(artist.length > 28 ? artist.substring(0, 26) + '...' : artist, 28, 108);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(title.length > 32 ? title.substring(0, 30) + '...' : title, 28, 144);

    // Sub info
    const subInfo = [labelName, year, country].filter(Boolean).join(' • ');
    ctx.fillStyle = '#64748b';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(subInfo, 28, 178);

    // Badges Row
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(28, 205, 150, 42);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`LOC: ${drawer}`, 38, 232);

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(190, 205, 140, 42);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`${mediaCond} / ${sleeveCond}`, 205, 232);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(340, 205, 160, 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(price, 360, 232);

    // QR on Right
    if (qrImg.width > 0) {
      ctx.drawImage(qrImg, 530, 80, 240, 240);
    }

    // Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('VALDIR DISCOS • IDENTIFICAÇÃO FÍSICA', 28, 320);

    return canvas.toDataURL('image/png');
  }

  // Standard 960 x 540 px full tag
  canvas.width = 960;
  canvas.height = 540;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 960, 540);

  // Outer Border
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 936, 516);

  // Top Bar
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('VALDIR DISCOS', 36, 52);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('CATÁLOGO & CONTROLE DE ESTOQUE', 240, 52);

  // ID Pill
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(750, 26, 170, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(itemId, 835, 50);
  ctx.textAlign = 'left';

  // Divider
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(36, 75);
  ctx.lineTo(924, 75);
  ctx.stroke();

  // Artist Title
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 32px system-ui, sans-serif';
  ctx.fillText(artist.length > 34 ? artist.substring(0, 32) + '...' : artist, 36, 130);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(title.length > 40 ? title.substring(0, 38) + '...' : title, 36, 175);

  // Details
  const subInfo = [labelName, year, country].filter(Boolean).join(' • ');
  ctx.fillStyle = '#64748b';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(subInfo, 36, 218);

  if (catno) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`CAT: ${catno}`, 36, 252);
  }

  // Badges
  // 1. Gaveta
  ctx.fillStyle = '#f1f5f9';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.fillRect(36, 320, 180, 80);
  ctx.strokeRect(36, 320, 180, 80);
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('LOCALIZAÇÃO / GAVETA', 48, 345);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(drawer, 48, 382);

  // 2. Conservação
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(230, 320, 180, 80);
  ctx.strokeRect(230, 320, 180, 80);
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('DISCO / CAPA', 242, 345);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(`${mediaCond} / ${sleeveCond}`, 242, 382);

  // 3. Preço
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(424, 320, 200, 80);
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('PREÇO DE VENDA', 438, 345);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(price, 438, 382);

  // Right Side QR Code Box
  if (qrImg.width > 0) {
    ctx.drawImage(qrImg, 655, 110, 260, 260);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN P/ DADOS DO CADASTRO', 785, 395);
    ctx.textAlign = 'left';
  }

  // Bottom Line & Footer
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(36, 460);
  ctx.lineTo(924, 460);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('VALDIR DISCOS • LOJA DE VINIL E COLECIONÁVEIS', 36, 492);

  return canvas.toDataURL('image/png');
}

/**
 * Generates an ultra-crisp monochrome (black & white pure 1-bit) label
 * optimized for 58mm / 80mm ESC/POS thermal printers and thermal adhesive sticker rolls.
 */
export async function renderThermalTicketToCanvas(
  listing: {
    id?: string;
    barcode?: string;
    release: DiscogsRelease;
    condition?: ConditionSelection;
    pricing?: PricingConfig;
    drawer?: string;
    salesChannels?: SalesChannel[];
  },
  format: 'thermal-58mm' | 'thermal-80mm' | 'sticker-50x30' | 'sticker-60x40' = 'thermal-80mm'
): Promise<string> {
  const itemId = (listing.id || 'ITEM-NOVO').replace('list_', '');
  const barcode = listing.barcode || `VD-${itemId.slice(-8)}`;
  const artist = (listing.release.artist || 'ARTISTA').toUpperCase();
  const title = listing.release.title || 'Álbum';
  const drawer = (listing.drawer?.trim() || 'SEM_LOC').toUpperCase();
  const mediaCond = listing.condition?.mediaCondition || 'VG+';
  const sleeveCond = listing.condition?.sleeveCondition || 'VG+';
  const price = listing.pricing?.basePriceBrl ? `R$ ${listing.pricing.basePriceBrl.toFixed(2)}` : 'R$ 0,00';
  const year = listing.release.year ? `${listing.release.year}` : '';
  const country = listing.release.country || 'BR';
  const channels = (listing.salesChannels || ['physical_store', 'online_store', 'shopee', 'mercadolivre']);

  const payload = formatDiscQRCodePayload(listing, { mode: 'compact' });
  const qrUrl = await generateDiscQRCode(payload, {
    width: format === 'thermal-58mm' ? 220 : 280,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const qrImg = new Image();
  await new Promise<void>((resolve) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = () => resolve();
    qrImg.src = qrUrl;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return qrUrl;

  // 1. THERMAL STICKER 50x30mm (500x300 px)
  if (format === 'sticker-50x30') {
    canvas.width = 500;
    canvas.height = 300;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 500, 300);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, 488, 288);

    // Header
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('VALDIR DISCOS', 18, 30);

    ctx.font = 'bold 14px monospace';
    ctx.fillText(barcode, 340, 30);

    ctx.beginPath();
    ctx.moveTo(18, 40);
    ctx.lineTo(482, 40);
    ctx.stroke();

    // QR on left
    if (qrImg.width > 0) {
      ctx.drawImage(qrImg, 18, 55, 170, 170);
    }

    // Text on right
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(artist.length > 20 ? artist.substring(0, 18) + '..' : artist, 200, 75);

    ctx.font = '15px sans-serif';
    ctx.fillText(title.length > 22 ? title.substring(0, 20) + '..' : title, 200, 105);

    ctx.font = 'bold 14px monospace';
    ctx.fillText(`LOC: ${drawer}`, 200, 140);
    ctx.fillText(`COND: ${mediaCond}/${sleeveCond}`, 200, 170);

    // Price Box
    ctx.fillRect(200, 190, 280, 45);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(price, 220, 222);

    ctx.fillStyle = '#000000';
    ctx.font = '11px monospace';
    ctx.fillText(`ID: ${itemId.slice(0, 12)}`, 18, 250);

    return canvas.toDataURL('image/png');
  }

  // 2. THERMAL STICKER 60x40mm (600x400 px)
  if (format === 'sticker-60x40') {
    canvas.width = 600;
    canvas.height = 400;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 400);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 584, 384);

    // Header
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('VALDIR DISCOS', 24, 40);

    ctx.fillRect(400, 18, 175, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(barcode, 487, 39);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 58);
    ctx.lineTo(576, 58);
    ctx.stroke();

    // QR on left
    if (qrImg.width > 0) {
      ctx.drawImage(qrImg, 24, 75, 230, 230);
    }

    // Text on right
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(artist.length > 22 ? artist.substring(0, 20) + '..' : artist, 270, 105);

    ctx.font = '18px sans-serif';
    ctx.fillText(title.length > 24 ? title.substring(0, 22) + '..' : title, 270, 140);

    ctx.font = '14px sans-serif';
    ctx.fillText([year, country].filter(Boolean).join(' • '), 270, 170);

    ctx.font = 'bold 16px monospace';
    ctx.fillText(`LOC: ${drawer}`, 270, 210);
    ctx.fillText(`COND: ${mediaCond}/${sleeveCond}`, 270, 240);

    // Price Box
    ctx.fillRect(270, 260, 290, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(price, 290, 296);

    // Footer Bar
    ctx.fillStyle = '#000000';
    ctx.font = '11px sans-serif';
    ctx.fillText(`CANAIS: ${channels.map(c => c === 'physical_store' ? 'FIS' : c === 'online_store' ? 'ON' : c.toUpperCase()).join(' | ')}`, 24, 340);
    ctx.font = '11px monospace';
    ctx.fillText(`ID: ${itemId}`, 24, 365);

    return canvas.toDataURL('image/png');
  }

  // 3. THERMAL 58mm ROLL (384 px wide)
  if (format === 'thermal-58mm') {
    canvas.width = 384;
    canvas.height = 580;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 384, 580);

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';

    ctx.font = '900 22px sans-serif';
    ctx.fillText('VALDIR DISCOS', 192, 36);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CONTROLE DE ESTOQUE', 192, 58);

    ctx.font = 'bold 15px monospace';
    ctx.fillText(`COD: ${barcode}`, 192, 82);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 94);
    ctx.lineTo(364, 94);
    ctx.stroke();

    // QR Center
    if (qrImg.width > 0) {
      ctx.drawImage(qrImg, 82, 105, 220, 220);
    }

    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(artist.length > 26 ? artist.substring(0, 24) + '..' : artist, 192, 355);

    ctx.font = '16px sans-serif';
    ctx.fillText(title.length > 28 ? title.substring(0, 26) + '..' : title, 192, 385);

    ctx.font = 'bold 16px monospace';
    ctx.fillText(`GAVETA: ${drawer}`, 192, 420);
    ctx.fillText(`MÍDIA: ${mediaCond}  •  CAPA: ${sleeveCond}`, 192, 450);

    // Price
    ctx.fillRect(40, 470, 304, 45);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(price, 192, 502);

    ctx.fillStyle = '#000000';
    ctx.font = '11px monospace';
    ctx.fillText(`ID: ${itemId.slice(0, 18)}`, 192, 545);

    ctx.textAlign = 'left';
    return canvas.toDataURL('image/png');
  }

  // 4. THERMAL 80mm ROLL (576 px wide) - Standard Cupom / Etiqueta Térmica
  canvas.width = 576;
  canvas.height = 700;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 576, 700);

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';

  ctx.font = '900 28px sans-serif';
  ctx.fillText('VALDIR DISCOS', 288, 45);

  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('LOJA FÍSICA & E-COMMERCE', 288, 72);

  ctx.fillRect(160, 88, 256, 32);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(barcode, 288, 111);

  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(30, 132);
  ctx.lineTo(546, 132);
  ctx.stroke();

  // QR Center
  if (qrImg.width > 0) {
    ctx.drawImage(qrImg, 148, 145, 280, 280);
  }

  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(artist.length > 30 ? artist.substring(0, 28) + '..' : artist, 288, 460);

  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(title.length > 34 ? title.substring(0, 32) + '..' : title, 288, 495);

  const sub = [year, country, listing.release.label].filter(Boolean).join(' • ');
  if (sub) {
    ctx.font = '15px sans-serif';
    ctx.fillText(sub, 288, 525);
  }

  ctx.font = 'bold 20px monospace';
  ctx.fillText(`LOCALIZAÇÃO / GAVETA: ${drawer}`, 288, 560);
  ctx.fillText(`CONSERVAÇÃO: ${mediaCond} / ${sleeveCond}`, 288, 592);

  // Price Block
  ctx.fillRect(80, 610, 416, 52);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px monospace';
  ctx.fillText(price, 288, 646);

  ctx.fillStyle = '#000000';
  ctx.font = '12px monospace';
  ctx.fillText(`ID: ${itemId}`, 288, 680);

  ctx.textAlign = 'left';
  return canvas.toDataURL('image/png');
}


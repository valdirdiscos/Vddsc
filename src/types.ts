/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Track {
  position: string;
  title: string;
  duration: string;
  artist?: string;
}

export interface Format {
  name: string;
  qty: string;
  descriptions: string[];
}

export interface DiscogsRelease {
  id: string | number;
  title: string;
  artist: string;
  label: string;
  catno: string;
  year: number | string;
  country?: string;
  genres: string[];
  styles: string[];
  tracklist: Track[];
  formats: Format[];
  coverImage: string;
  notes?: string;
  lowestPriceUsd?: number;
  isManual?: boolean;
}

export type MediaFormatType = 'vinyl' | 'cd' | 'dvd' | 'other';

export interface ConditionSelection {
  mediaCondition: string; // e.g., 'NM', 'VG+', 'VG'
  mediaDetails: string;   // short custom text about minor scratches, etc.
  sleeveCondition: string; // e.g., 'NM', 'VG+', 'VG'
  sleeveDetails: string;   // details about edge wear, ring wear, splits, etc.
  hasInsert?: boolean;     // For vinyl/LPs: has insert (encarte)?
  insertCondition?: string;// insert condition code e.g. 'NM', 'VG+', 'VG', 'G+'
  insertDetails?: string;  // insert details text
}

export interface PricingConfig {
  basePriceBrl: number;       // base item cost (or converted price)
  exchangeRate: number;       // USD to BRL exchange rate (e.g. 5.60)
  useExchange: boolean;       // whether to convert base price from USD
  shopeeCommissionPercent: number; // e.g. 14% or 20%
  shopeeFixedFee: number;     // e.g. R$ 4.00
  packagingCost: number;      // cardboard mailers, plastic sleeves, bubble wrap
  profitMarginPercent: number; // e.g. 30% markup
  customNotes?: string;
  mode?: 'direct' | 'advanced'; // direct final price vs advanced calculator
  directPrice?: number;         // user entered direct final sale price
}

export interface ShopeeListing {
  title: string;
  description: string;
  suggestedPrice: number;
  hashtags: string[];
}

export interface MercadoLivreListing {
  title: string;
  description: string;
  suggestedPrice: number;
}

export interface PersonalFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // Base64 data URL
  uploadedAt: string;
}

export type SalesChannel = 'physical_store' | 'online_store' | 'shopee' | 'mercadolivre';

export interface SavedListing {
  id: string; // unique listing timestamp
  barcode?: string; // e.g., VD-249504 or custom barcode/sku
  release: DiscogsRelease;
  condition: ConditionSelection;
  pricing: PricingConfig;
  shopee: ShopeeListing;
  mercadolivre?: MercadoLivreListing; // Optional Mercado Livre listing
  salesChannels?: SalesChannel[]; // Channels where the product is available: 'physical_store' | 'online_store' | 'shopee' | 'mercadolivre'
  createdAt: string;
  drawer?: string; // storage location designated by Valdir
  customImages?: string[]; // user-uploaded real photos of the product (base64 or URL)
  personalFiles?: PersonalFile[]; // Valdir's personal files/documents (e.g., invoices, memos, receipts)
  quantity?: number; // Stock quantity (default 1)
  isGarimpo?: boolean; // Item belongs to the Garimpo section (low value, damaged/bargain, clearance)
  garimpoDetails?: string; // Details/notes about why it is in garimpo (e.g. risco superficial, capa desgastada, etc.)
  status?: 'available' | 'sold' | 'reserved' | 'personal'; // Item status in the shop/collection
  customerId?: string; // Linked customer ID
  customerName?: string; // Cache of the linked customer's name
  saleDetails?: {
    salePrice: number;
    platform: 'physical_store' | 'online_store' | 'shopee' | 'mercadolivre' | 'direct' | 'other';
    soldAt: string;
    feesPaid?: number;
    netProfit: number;
    paymentStatus?: 'pago' | 'pendente';
    paymentMethod?: string;
    proofScreenshots?: string[]; // Marketplace sale prints / receipts (Shopee, Mercado Livre, Pix, etc.)
    marketplaceOrderId?: string; // e.g. Shopee order number or ML order id
    notes?: string;
  };
}

export interface CustomerAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface CustomerAccount {
  id: string; // unique ID e.g. cust_123 or uid
  email: string;
  password?: string; // stored credentials for client auth
  name: string;
  phone?: string;
  cpf?: string;
  address?: CustomerAddress;
  wishlist?: string[]; // array of listing IDs
  favoriteGenres?: string[];
  createdAt: string;
  lastLoginAt?: string;
  ordersCount?: number;
  totalSpent?: number;
}

export type OrderPaymentMethod = 'PIX' | 'Cartao_Credito' | 'Cartao_Debito' | 'Balcao_Presencial' | 'WhatsApp';
export type OrderPaymentStatus = 'pendente' | 'pago' | 'cancelado' | 'estornado';
export type OrderFulfillmentStatus = 'aguardando_pagamento' | 'em_separacao' | 'enviado' | 'pronto_retirada' | 'entregue' | 'cancelado';

export interface OnlineOrderItem {
  listingId: string;
  barcode?: string;
  artist: string;
  title: string;
  price: number;
  coverImage?: string;
  mediaCondition: string;
  sleeveCondition: string;
  drawer?: string;
}

export interface CustomerOnlineOrder {
  id: string; // unique order id e.g. ord_onl_1234
  orderNumber: string; // e.g. VD-ONL-8942
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OnlineOrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  totalAmount: number;
  deliveryType: 'shipping' | 'pickup';
  shippingAddress?: CustomerAddress;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  trackingCode?: string;
  notes?: string;
  pixQrCodePayload?: string;
  createdAt: string; // ISO date
  updatedAt?: string;
}

export interface Customer {
  id: string; // unique customer ID or phone number
  name: string; // client name
  phone?: string; // WhatsApp or phone
  email?: string; // Email
  instagram?: string; // Instagram handle
  city?: string; // City
  state?: string; // UF/State
  address?: CustomerAddress;
  notes?: string; // Observações / Preferências
  wishlist?: string[];
  totalSpent?: number;
  createdAt: string; // ISO date string
}

export interface PlaylistItem {
  id: string;
  listingId?: string; // Linked saved listing ID if from catalog
  albumTitle: string;
  albumArtist: string;
  coverImage?: string;
  trackTitle: string;
  trackPosition?: string; // e.g., "A1", "B2", "01"
  duration?: string;      // e.g., "04:15"
  bpm?: number;           // Beats per minute e.g. 124
  key?: string;           // Key/Tonality e.g., "8A / Am" or "Cm"
  energy?: 1 | 2 | 3 | 4 | 5; // Energy level (1-5)
  genreTag?: string;      // e.g. "Samba-Rock", "Boogie", "Funk 70s"
  djNotes?: string;       // Notes for transition or playback e.g. "Virada na intro", "45 RPM"
  drawer?: string;        // Storage location / drawer of the physical record
}

export interface DJPlaylist {
  id: string;
  title: string;           // e.g., "Set Baile Black - Sexta Naite"
  description?: string;     // e.g., "Discos de 7 e 12 polegadas, foco em boogie nacional"
  eventDate?: string;       // ISO date or string e.g., "2026-08-15"
  venue?: string;           // e.g., "Clube do Vinil / Bar do Zé"
  targetDurationMinutes?: number; // Target total duration e.g. 120 (2 hours)
  tags?: string[];          // e.g., ["Vinyl Only", "Boogie", "70s"]
  items: PlaylistItem[];
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}

export type LabelFormatType = 'thermal-80mm' | 'thermal-58mm' | 'sticker-60x40' | 'sticker-50x30' | 'disc-card-qr' | 'a4-sheet';

export interface SavedLabel {
  id: string; // unique ID e.g. lbl_timestamp
  listingId?: string;
  barcode: string;
  artist: string;
  title: string;
  label?: string;
  catno?: string;
  year?: string | number;
  country?: string;
  mediaCondition: string;
  sleeveCondition: string;
  price: number;
  drawer?: string;
  format: LabelFormatType;
  copies: number;
  createdAt: string; // ISO date
  printedAt?: string;
  labelImageUrl?: string; // cached rendered image data URL
}

export interface CartItem {
  id: string; // unique item uuid in cart
  listingId: string;
  listing: SavedListing;
  barcode: string;
  artist: string;
  title: string;
  originalPrice: number;
  discount: number; // in BRL
  finalPrice: number; // originalPrice - discount
  drawer?: string;
  coverImage?: string;
  mediaCondition: string;
  sleeveCondition: string;
  addedAt: string;
}

export interface PhysicalSaleOrder {
  id: string; // unique order ID e.g. ord_timestamp
  orderNumber: string; // e.g. VD-PED-1042
  items: {
    listingId: string;
    barcode: string;
    artist: string;
    title: string;
    originalPrice: number;
    discount: number;
    finalPrice: number;
    drawer?: string;
    condition: string;
    coverImage?: string;
  }[];
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: 'PIX' | 'Dinheiro' | 'Cartao_Debito' | 'Cartao_Credito' | 'Parcelado' | 'Shopee' | 'MercadoLivre' | 'Outro';
  amountPaid?: number;
  changeAmount?: number;
  installments?: number;
  notes?: string;
  channel: SalesChannel;
  soldAt: string; // ISO date
  cashierName?: string;
  proofScreenshots?: string[]; // Print screens of marketplace sales (Shopee / Mercado Livre / Pix)
  marketplaceOrderId?: string; // Order code
}

export type UserRole = 'admin' | 'operador' | 'estoquista' | 'visitante';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  customPin?: string; // 4-digit PIN for fast switch
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface RolePermissions {
  canCreateListings: boolean;
  canEditListings: boolean;
  canDeleteListings: boolean;
  canViewFinancialMargins: boolean;
  canEditPricingSettings: boolean;
  canOperatePOS: boolean;
  canManageCustomers: boolean;
  canPrintLabels: boolean;
  canManagePlaylists: boolean;
  canManageUsers: boolean;
}

export type TShirtSize = 'P' | 'M' | 'G' | 'GG' | 'XGG';
export type TShirtModel = 'Unissex Tradicional' | 'Baby Look Feminina' | 'Regata Vintage';

export interface TShirtColor {
  id: string;
  name: string;
  hex: string;
  bgClass: string;
  borderClass?: string;
}

export interface TShirtProduct {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: 'selo_oficial' | 'retro_dj' | 'mpb_brasil' | 'rock_cult';
  colors: TShirtColor[];
  sizes: TShirtSize[];
  models: TShirtModel[];
  image: string;
  badge?: string;
  features: string[];
  fabricInfo: string;
  inStock: boolean;
}



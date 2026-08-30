/**
 * Valdir Discos - Cookie & Domain Storage Utilities
 * Provides resilient persistence across custom domains, browser reloads,
 * and iframe/sandboxed environments using both document.cookie and localStorage fallback.
 */

export interface CookieOptions {
  days?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
}

/**
 * Sets a cookie with standard safety flags
 */
export function setCookie(name: string, value: string, days = 365, domain?: string): void {
  try {
    if (typeof document === 'undefined') return;

    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = `; expires=${date.toUTCString()}; max-age=${days * 24 * 60 * 60}`;
    }

    const domainPart = domain ? `; domain=${domain}` : '';
    const securePart = window.location.protocol === 'https:' ? '; Secure' : '';
    
    // Encodes value safely
    const encodedValue = encodeURIComponent(value);
    document.cookie = `${name}=${encodedValue}${expires}; path=/${domainPart}; SameSite=Lax${securePart}`;
  } catch (err) {
    console.warn('[CookieStorage] Error setting cookie:', err);
  }
}

/**
 * Gets a cookie value by name
 */
export function getCookie(name: string): string | null {
  try {
    if (typeof document === 'undefined') return null;

    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  } catch (err) {
    console.warn('[CookieStorage] Error getting cookie:', err);
    return null;
  }
}

/**
 * Deletes a cookie
 */
export function deleteCookie(name: string, domain?: string): void {
  try {
    if (typeof document === 'undefined') return;
    const domainPart = domain ? `; domain=${domain}` : '';
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${domainPart}; SameSite=Lax`;
  } catch (err) {
    console.warn('[CookieStorage] Error deleting cookie:', err);
  }
}

/**
 * High-reliability storage that writes to BOTH localStorage and cookies,
 * ensuring persistence even if one storage mechanism is reset or domain changes.
 */
export function setPersistentItem(key: string, value: string, days = 365): void {
  // 1. Save to Cookie
  setCookie(key, value, days);

  // 2. Save to LocalStorage
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (err) {
    console.warn('[CookieStorage] localStorage set failed:', err);
  }
}

/**
 * High-reliability retrieval: checks localStorage first, falls back to cookie.
 */
export function getPersistentItem(key: string, defaultValue = ''): string {
  // 1. Check LocalStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const lsVal = localStorage.getItem(key);
      if (lsVal !== null && lsVal !== undefined) {
        return lsVal;
      }
    }
  } catch (err) {
    console.warn('[CookieStorage] localStorage get failed:', err);
  }

  // 2. Fallback to Cookie
  const cookieVal = getCookie(key);
  if (cookieVal !== null) {
    // Re-seed localStorage if available
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, cookieVal);
      }
    } catch {}
    return cookieVal;
  }

  return defaultValue;
}

/**
 * Remove from both LocalStorage and Cookie
 */
export function removePersistentItem(key: string): void {
  deleteCookie(key);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {}
}

/**
 * Detects the active website domain (e.g. valdirdiscos.com.br or custom domain)
 * Saves it persistently so access via custom domain is preserved.
 */
export function getActiveDomain(): string {
  if (typeof window === 'undefined') return 'valdirdiscos.com.br';

  const host = window.location.hostname;
  // If user already saved a custom domain
  const saved = getPersistentItem('valdir_custom_domain');
  if (saved) return saved;

  // Auto-detect real domains (not localhost or internal test hosts)
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('run.app')) {
    setPersistentItem('valdir_custom_domain', host);
    return host;
  }

  return host || 'valdirdiscos.com.br';
}

/**
 * Sets and saves the custom domain in cookies & storage
 */
export function setActiveDomain(domain: string): void {
  if (!domain) return;
  const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  setPersistentItem('valdir_custom_domain', clean);
}

/**
 * Syncs cart with cookies and storage
 */
export function syncCartWithStorage(cartItems: any[]): void {
  try {
    const serialized = JSON.stringify(cartItems);
    setPersistentItem('valdir_public_cart_v1', serialized, 30);
  } catch (err) {
    console.warn('[CookieStorage] Failed to sync cart:', err);
  }
}

/**
 * Loads cart from storage (with cookie fallback)
 */
export function loadCartFromStorage(): any[] {
  try {
    const raw = getPersistentItem('valdir_public_cart_v1');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * View Mode preference: 'grid' | 'compact' | 'list' | 'table_no_photos'
 */
export type StoreViewMode = 'grid' | 'compact' | 'list' | 'table_no_photos';

export function getSavedStoreViewMode(): StoreViewMode {
  const mode = getPersistentItem('valdir_storefront_view_mode_v1', 'grid') as StoreViewMode;
  if (['grid', 'compact', 'list', 'table_no_photos'].includes(mode)) {
    return mode;
  }
  return 'grid';
}

export function saveStoreViewMode(mode: StoreViewMode): void {
  setPersistentItem('valdir_storefront_view_mode_v1', mode, 365);
}

/**
 * Inventory Catalog View Mode preference: 'grid' | 'compact' | 'table'
 */
export type CatalogViewMode = 'grid' | 'compact' | 'table';

export function getSavedCatalogViewMode(): CatalogViewMode {
  const mode = getPersistentItem('valdir_catalog_view_mode_v1', 'grid') as CatalogViewMode;
  if (['grid', 'compact', 'table'].includes(mode)) {
    return mode;
  }
  return 'grid';
}

export function saveCatalogViewMode(mode: CatalogViewMode): void {
  setPersistentItem('valdir_catalog_view_mode_v1', mode, 365);
}

// Official Valdir Discos Brand Logos & Assets with Real-Time Local/Server Sync

export const DEFAULT_LOGO_BADGE = '/valdir-logo-badge.png';
export const DEFAULT_LOGO_COLOR = '/valdir-logo-color.jpg';
export const DEFAULT_LOGO_BW = '/valdir-logo-bw.png';

export const LOGO_BADGE_FALLBACK = '/valdir-logo-badge.jpg';
export const LOGO_COLOR_FALLBACK = '/valdir-logo-color.jpg';
export const LOGO_BW_FALLBACK = '/valdir-logo-bw.jpg';

// Helper to get active logo (checks localStorage first for instant client updates)
export function getActiveLogo(type: 'badge' | 'color' | 'bw'): string {
  if (typeof window !== 'undefined') {
    try {
      const custom = localStorage.getItem(`valdir_custom_logo_${type}`);
      if (custom && custom.startsWith('data:image/')) {
        return custom;
      }
    } catch {
      // ignore
    }
  }

  if (type === 'badge') return DEFAULT_LOGO_BADGE;
  if (type === 'color') return DEFAULT_LOGO_COLOR;
  return DEFAULT_LOGO_BW;
}

export function setActiveLogo(type: 'badge' | 'color' | 'bw', dataUrl: string) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`valdir_custom_logo_${type}`, dataUrl);
      window.dispatchEvent(new CustomEvent('valdir-logos-updated', { detail: { type } }));
    } catch (e) {
      console.warn('Falha ao salvar logo no localStorage:', e);
    }
  }
}

export function resetActiveLogo(type: 'badge' | 'color' | 'bw') {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`valdir_custom_logo_${type}`);
      window.dispatchEvent(new CustomEvent('valdir-logos-updated', { detail: { type } }));
    } catch (e) {
      console.warn('Falha ao limpar logo no localStorage:', e);
    }
  }
}

// Fallback constants pointing to default paths
export const LOGO_BADGE = DEFAULT_LOGO_BADGE;
export const LOGO_COLOR = DEFAULT_LOGO_COLOR;
export const LOGO_BW = DEFAULT_LOGO_BW;

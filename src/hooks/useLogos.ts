import { useState, useEffect } from 'react';
import { getActiveLogo, DEFAULT_LOGO_BADGE, DEFAULT_LOGO_COLOR, DEFAULT_LOGO_BW } from '../assets/logos';

export function useLogos() {
  const [logoBadge, setLogoBadge] = useState<string>(() => getActiveLogo('badge'));
  const [logoColor, setLogoColor] = useState<string>(() => getActiveLogo('color'));
  const [logoBw, setLogoBw] = useState<string>(() => getActiveLogo('bw'));

  useEffect(() => {
    const handleUpdate = () => {
      setLogoBadge(getActiveLogo('badge'));
      setLogoColor(getActiveLogo('color'));
      setLogoBw(getActiveLogo('bw'));
    };

    window.addEventListener('valdir-logos-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('valdir-logos-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    logoBadge,
    logoColor,
    logoBw,
    defaultBadge: DEFAULT_LOGO_BADGE,
    defaultColor: DEFAULT_LOGO_COLOR,
    defaultBw: DEFAULT_LOGO_BW
  };
}

import { useEffect, useState } from 'react';
import {
  getLandingBreakpoint,
  resolveLandingFonts,
  type LandingFontKey,
} from './typography';

export function usePlatformLandingFonts() {
  const [fonts, setFonts] = useState(() =>
    resolveLandingFonts(getLandingBreakpoint(typeof window !== 'undefined' ? window.innerWidth : 1024)),
  );

  useEffect(() => {
    const update = () => setFonts(resolveLandingFonts(getLandingBreakpoint(window.innerWidth)));
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  const size = (key: LandingFontKey) => fonts[key];

  return { fonts, size };
}

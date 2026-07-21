// src/hooks/useIsMobile.js
import { useState, useEffect } from 'react';

// Les composants de ce projet utilisent des objets de style inline
// (style={{...}}), qui n'appliquent jamais de vraies règles @media : une clé
// '@media (max-width: ...)' dans un objet de style est silencieusement
// ignorée par React. Ce hook fournit donc l'équivalent en JS, pour adapter
// la mise en page (colonnes, sidebar, menu) selon la largeur réelle de
// l'écran.
export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', handler);
    else mql.addListener(handler); // fallback anciens navigateurs
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler);
      else mql.removeListener(handler);
    };
  }, [breakpoint]);

  return isMobile;
}

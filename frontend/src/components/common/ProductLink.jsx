// src/components/common/ProductLink.jsx
//
// Rend le nom d'un produit comme un lien cliquable vers sa fiche détail,
// à utiliser partout où un nom de produit est affiché (messagerie, avis,
// commandes, alertes de stock, panneau admin...). Voir UserLink.jsx pour
// le composant équivalent côté utilisateurs, et NavigationContext pour
// l'implémentation de la navigation (fournie par App.jsx).

import React from 'react';
import { useNavigationLinks } from '../../context/NavigationContext';

export default function ProductLink({ id, children, style, className }) {
  const { goToProductById } = useNavigationLinks();

  if (id == null) {
    return <span className={className} style={style}>{children}</span>;
  }

  return (
    <span
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        goToProductById(id);
      }}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          goToProductById(id);
        }
      }}
      style={{
        cursor: 'pointer',
        color: 'var(--primary-color, #1f6b4d)',
        textDecoration: 'none',
        fontWeight: 'inherit',
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
    >
      {children}
    </span>
  );
}

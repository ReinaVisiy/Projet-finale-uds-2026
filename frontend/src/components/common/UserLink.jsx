// src/components/common/UserLink.jsx
//
// Rend le nom d'un utilisateur (client ou vendeur) comme un lien cliquable
// vers son profil, à utiliser partout où un nom d'utilisateur est affiché
// (messagerie, avis, commandes, panneau admin...). Ce n'est pas une vraie
// ancre <a> : la navigation reste gérée par l'état d'écran de App.jsx
// (cf. NavigationContext), pas par react-router.

import React from 'react';
import { useNavigationLinks } from '../../context/NavigationContext';

export default function UserLink({ id, children, style, className }) {
  const { goToUserProfileById } = useNavigationLinks();

  if (id == null) {
    // Pas d'id disponible (ex. utilisateur supprimé) : texte non cliquable.
    return <span className={className} style={style}>{children}</span>;
  }

  return (
    <span
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        goToUserProfileById(id);
      }}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          goToUserProfileById(id);
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

// src/context/NavigationContext.js
//
// Expose goToUserProfileById(id) et goToProductById(id) à n'importe quel
// composant de l'arbre, sans avoir à faire descendre ces deux fonctions
// en props à travers chaque écran intermédiaire (Messagerie, Avis,
// SellerDashboard, AdminDashboard...). App.jsx fournit l'implémentation
// réelle via <NavigationContext.Provider>; voir components/common/UserLink.jsx
// et ProductLink.jsx pour les composants qui consomment ce contexte.

import { createContext, useContext } from 'react';

export const NavigationContext = createContext({
  goToUserProfileById: () => {},
  goToProductById: () => {},
});

export function useNavigationLinks() {
  return useContext(NavigationContext);
}

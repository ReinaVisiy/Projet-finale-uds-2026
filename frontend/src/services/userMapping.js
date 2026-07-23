// src/services/userMapping.js
//
// Le backend et le frontend ne modélisent pas un "utilisateur" de la même
// façon : le backend a un seul champ `nom` et des rôles en majuscules
// (CLIENT/PRODUCTEUR/ADMIN), alors que le frontend attend `prenom` + `nom`
// séparés et des rôles en minuscules (client/vendeur/admin).
// Ce fichier centralise cette conversion pour que le reste du frontend
// n'ait jamais à s'en soucier.

export const ROLE_FRONTEND_TO_BACKEND = {
  client: 'CLIENT',
  vendeur: 'PRODUCTEUR',
  admin: 'ADMIN',
};

export const ROLE_BACKEND_TO_FRONTEND = {
  CLIENT: 'client',
  PRODUCTEUR: 'vendeur',
  ADMIN: 'admin',
};

/** Sépare "Prénom Nom" en { prenom, nom }. Meilleur effort : le backend
 * ne stocke qu'un seul champ, donc on coupe au premier espace. */
export function splitNomComplet(nomComplet) {
  if (!nomComplet) return { prenom: '', nom: '' };
  const trimmed = nomComplet.trim();
  const firstSpace = trimmed.indexOf(' ');
  if (firstSpace === -1) return { prenom: trimmed, nom: '' };
  return {
    prenom: trimmed.slice(0, firstSpace),
    nom: trimmed.slice(firstSpace + 1),
  };
}

/** Combine prenom + nom en un seul champ pour l'envoyer au backend. */
export function joinNomComplet(prenom, nom) {
  return [prenom, nom].filter(Boolean).join(' ').trim();
}

/**
 * Convertit un UtilisateurDTO (backend) + la liste de rôles JWT en objet
 * "currentUser" tel que le reste du frontend (App.jsx, composants) l'attend.
 */
export function mapProfileToFrontendUser(dto, rolesFromToken = []) {
  const { prenom, nom } = splitNomComplet(dto.nom);
  const backendRole = dto.role || rolesFromToken[0];
  return {
    id: dto.id,
    role: ROLE_BACKEND_TO_FRONTEND[backendRole] || 'client',
    prenom,
    nom,
    email: dto.email,
    adresse: dto.adresse || '',
    ville: dto.ville || '',
    telephone: dto.telephone || '',
    photo: dto.photo || null,
    plan: dto.plan || 'gratuit',
    suspendu: !!dto.suspendu,
    suspenduJusquau: dto.suspenduJusquau || null,
    actif: true,
  };
}

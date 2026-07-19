// src/services/commandeMapping.js
//
// commande-service ne connaît que des IDs (produitId, clientId) et un
// statut à 6 valeurs, alors que ClientOrders / VendeurOrders /
// ClientPurchases attendent des commandes déjà enrichies avec des noms
// lisibles et un sous-ensemble de 4 statuts en français (ce sont les 4
// seuls que leur affichage sait styliser). Ce fichier centralise cette
// conversion, comme signalementMapping.js le fait pour les signalements.

export const STATUT_BACKEND_TO_FRANCAIS = {
  EN_ATTENTE: 'En attente',
  VALIDEE: 'Validée',
  EN_PREPARATION: 'En préparation',
  EXPEDIEE: 'En livraison',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
};

// VendeurOrders propose ces 5 statuts dans son menu déroulant (VALIDEE
// reste un état transitoire automatique, non choisi manuellement).
export const STATUT_FRANCAIS_TO_BACKEND = {
  'En attente': 'EN_ATTENTE',
  'En préparation': 'EN_PREPARATION',
  'En livraison': 'EXPEDIEE',
  'Livrée': 'LIVREE',
  'Annulée': 'ANNULEE',
};

/**
 * Convertit un CommandeResponse (backend) en objet "commande" tel
 * qu'attendu par ClientOrders / VendeurOrders / ClientPurchases :
 * { id, client, clientEmail, amount, status, date, items }.
 *
 * @param dto           CommandeResponse renvoyé par commande-service
 * @param clientNom     nom déjà résolu du client (utilisateur-service)
 * @param clientEmail   email déjà résolu du client
 * @param nomsProduits  Map<produitId, nom> déjà résolue (produit-service)
 */
export function mapCommandePourAffichage(dto, clientNom, clientEmail, nomsProduits) {
  const items = (dto.lignesCommande || []).map((lc) => ({
    produitId: lc.produitId,
    nomProduit: nomsProduits.get(lc.produitId) || `Produit #${lc.produitId}`,
    quantity: lc.quantite,
    prixUnitaire: lc.prixUnitaire,
    subtotal: lc.prixUnitaire * lc.quantite,
  }));

  return {
    id: dto.id,
    id_client: dto.clientId,
    client: clientNom || `Client #${dto.clientId}`,
    clientEmail: clientEmail || '',
    amount: dto.montantTotal,
    status: STATUT_BACKEND_TO_FRANCAIS[dto.statut] || dto.statut,
    // "date" reste une chaîne formatée en français, pour l'affichage
    // dans les tableaux (ex. "20/07/2026").
    date: dto.dateCommande ? new Date(dto.dateCommande).toLocaleDateString('fr-FR') : '',
    // "dateISO" garde la date brute renvoyée par le backend, pour tout
    // calcul (ex. graphique des ventes mensuelles). On ne doit jamais
    // refaire un `new Date()` sur le champ "date" ci-dessus : son format
    // JJ/MM/AAAA n'est pas reconnu de façon fiable par le parseur JS
    // natif (il l'interprète comme MM/JJ/AAAA, ce qui donne un mois
    // erroné, voire une "Invalid Date" dès que le jour dépasse 12).
    dateISO: dto.dateCommande || null,
    items,
  };
}

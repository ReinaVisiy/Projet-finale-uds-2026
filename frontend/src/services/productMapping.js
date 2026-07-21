// src/services/productMapping.js
//
// Convertit les objets renvoyés par produit-service (ProduitResponse, en
// français : nom, prix, imageUrl, categorieId, categorieNom...) vers le
// format que les composants existants (ProductCatalog, AgriconnectHome,
// ProductDetail, MyProducts, StockAlerts...) savent déjà afficher.
//
// Objectif : ne pas devoir réécrire chaque composant d'affichage — un seul
// point de traduction entre le backend et le frontend.

export const IMAGE_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%25" height="100%25" fill="%23e2e8f0"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="48">🌱</text></svg>';

/**
 * Traduit un nom de catégorie brut (tel que renvoyé par produit-service,
 * toujours en français : "Agriculture", "Élevage"...) via i18next.
 * Les clés connues vivent sous "categories.*" dans les fichiers de
 * traduction ; toute catégorie inconnue (ajoutée par un admin après coup)
 * retombe simplement sur son nom brut plutôt que de planter ou d'afficher
 * une clé manquante.
 *
 * @param nom nom brut de la catégorie (ex. produit.categorieNom, cat.name)
 * @param t   fonction t() obtenue via useTranslation() dans le composant
 */
export function traduireNomCategorie(nom, t) {
  if (!nom) return nom;
  const cle = nom.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const traduction = t(`categories.${cle}`, { defaultValue: '' });
  return traduction || nom;
}

/** Convertit une CategorieResponse backend { id, nom } vers le format utilisé côté vitrine. */
export function mapCategorie(categorie) {
  return {
    id: categorie.id,
    name: categorie.nom,
  };
}

/**
 * Convertit un ProduitResponse backend vers le format utilisé par les pages
 * publiques (ProductCatalog, AgriconnectHome, ProductDetail).
 */
export function mapProduitPourVitrine(produit) {
  return {
    id: produit.id,
    name: produit.nom,
    farm: produit.producteurNom || 'Producteur',
    producteurId: produit.producteurId,
    price: produit.prix != null ? Number(produit.prix) : 0,
    stock: produit.stock ?? 0,
    categoryId: produit.categorieId,
    category: produit.categorieNom || 'Général',
    image: produit.imageUrl || IMAGE_PLACEHOLDER,
    rating: produit.noteMoyenne ?? 0,
    reviews: produit.nombreAvis ?? 0,
    // ProductDetail fait un .map() sur description en supposant un tableau
    // de paragraphes : on l'enveloppe donc dans un tableau à un élément.
    description: produit.description ? [produit.description] : undefined,
    certifie: !!produit.certifie,
    localisation: produit.localisation,
  };
}

/**
 * Convertit un ProduitResponse backend vers le format utilisé par l'espace
 * vendeur (MyProducts, StockAlerts, SellerDashboard...).
 */
export function mapProduitPourVendeur(produit) {
  return {
    id: produit.id,
    name: produit.nom,
    category: produit.categorieNom || 'Général',
    categoryId: produit.categorieId,
    stock: produit.stock ?? 0,
    price: produit.prix != null ? Number(produit.prix) : 0,
    imageUrl: produit.imageUrl || IMAGE_PLACEHOLDER,
    description: produit.description || '',
    localisation: produit.localisation || '',
    status: (produit.stock ?? 0) > 0 ? 'Actif' : 'Rupture de stock',
  };
}

/**
 * Construit un ProduitRequest (le format attendu par POST /publier et
 * PUT /{id}) à partir des champs de formulaire d'AddProduct / EditProduct.
 */
export function construireProduitRequest({ nom, description, prix, stock, imageUrl, categorieId, localisation }) {
  return {
    nom,
    description: description || '',
    prix: Number(prix) || 0,
    stock: Number(stock) || 0,
    imageUrl: imageUrl || '',
    categorieId: categorieId != null && categorieId !== '' ? Number(categorieId) : null,
    localisation: localisation || '',
  };
}

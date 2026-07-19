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

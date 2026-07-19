// src/hooks/useProduits.js
//
// Charge la liste des produits publics et des catégories depuis
// produit-service. Utilisé à la fois par AgriconnectHome (accueil) et
// ProductCatalog (catalogue complet), pour éviter de dupliquer la logique
// d'appel réseau dans les deux pages.

import { useEffect, useState, useCallback } from 'react';
import { produitApi } from '../services/api';
import { mapProduitPourVitrine, mapCategorie } from '../services/productMapping';

export default function useProduits() {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [produitsData, categoriesData] = await Promise.all([
        produitApi.getAffichageParDefaut(),
        produitApi.getCategories(),
      ]);
      setProduits((produitsData || []).map(mapProduitPourVitrine));
      setCategories((categoriesData || []).map(mapCategorie));
    } catch (e) {
      setErreur(e?.message || 'Impossible de charger les produits.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    recharger();
  }, [recharger]);

  return { produits, categories, chargement, erreur, recharger };
}

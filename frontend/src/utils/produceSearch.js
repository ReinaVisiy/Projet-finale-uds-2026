// src/utils/produceSearch.js
// Recherche multilingue simple (FR <-> EN).
//
// Les produits sont enregistrés en base avec UN SEUL nom (celui saisi par
// le producteur, en général en français). On ne touche pas au backend ni
// aux données : on se contente d'étendre la recherche côté client pour
// qu'un mot saisi dans une langue retrouve aussi les produits nommés dans
// l'autre langue (ex. "watermelon" doit retrouver un produit nommé
// "pastèque"). Le dictionnaire ci-dessous couvre les produits agricoles
// les plus courants ; tout terme absent du dictionnaire est simplement
// cherché tel quel (comportement inchangé).

const SYNONYMES = [
  ['pastèque', 'watermelon'],
  ['tomate', 'tomato'],
  ['tomates', 'tomatoes'],
  ['pomme de terre', 'potato'],
  ['pommes de terre', 'potatoes'],
  ['oignon', 'onion'],
  ['oignons', 'onions'],
  ['carotte', 'carrot'],
  ['carottes', 'carrots'],
  ['chou', 'cabbage'],
  ['laitue', 'lettuce'],
  ['salade', 'lettuce'],
  ['banane', 'banana'],
  ['bananes', 'bananas'],
  ['plantain', 'plantain'],
  ['ananas', 'pineapple'],
  ['mangue', 'mango'],
  ['mangues', 'mangoes'],
  ['orange', 'orange'],
  ['oranges', 'oranges'],
  ['citron', 'lemon'],
  ['avocat', 'avocado'],
  ['avocats', 'avocados'],
  ['maïs', 'corn'],
  ['mais', 'corn'],
  ['riz', 'rice'],
  ['haricot', 'bean'],
  ['haricots', 'beans'],
  ['arachide', 'peanut'],
  ['arachides', 'peanuts'],
  ['manioc', 'cassava'],
  ['igname', 'yam'],
  ['piment', 'pepper'],
  ['poivron', 'bell pepper'],
  ['gombo', 'okra'],
  ['concombre', 'cucumber'],
  ['aubergine', 'eggplant'],
  ['ail', 'garlic'],
  ['gingembre', 'ginger'],
  ['poulet', 'chicken'],
  ['poule', 'hen'],
  ['œuf', 'egg'],
  ['oeuf', 'egg'],
  ['œufs', 'eggs'],
  ['oeufs', 'eggs'],
  ['poisson', 'fish'],
  ['viande', 'meat'],
  ['boeuf', 'beef'],
  ['bœuf', 'beef'],
  ['porc', 'pork'],
  ['lait', 'milk'],
  ['miel', 'honey'],
  ['agriculture', 'agriculture'],
  ['agricole', 'agriculture'],
  ['élevage', 'livestock'],
  ['elevage', 'livestock'],
];

// Index bidirectionnel : mot -> liste de tous ses équivalents (les deux
// langues), pour pouvoir étendre n'importe quel terme de recherche.
const INDEX = new Map();
for (const [fr, en] of SYNONYMES) {
  const groupe = [fr, en];
  for (const mot of groupe) {
    const cle = mot.toLowerCase();
    const existant = INDEX.get(cle) || new Set();
    groupe.forEach((m) => existant.add(m.toLowerCase()));
    INDEX.set(cle, existant);
  }
}

/**
 * Étend un terme de recherche saisi par l'utilisateur avec ses équivalents
 * connus dans l'autre langue. Retourne toujours au moins le terme original.
 * Ex : "watermelon" -> ["watermelon", "pastèque"]
 */
export function elargirTermesRecherche(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  const termes = new Set([q]);
  // Egalité exacte sur un mot connu du dictionnaire
  if (INDEX.has(q)) {
    INDEX.get(q).forEach((m) => termes.add(m));
  }
  // Le texte saisi peut aussi être plus long qu'un simple mot-clé
  // (ex. "salade fraîche") : on vérifie aussi si un mot du dictionnaire
  // est contenu dans la requête, pour ajouter son équivalent.
  for (const [cle, equivalents] of INDEX.entries()) {
    if (q.includes(cle)) {
      equivalents.forEach((m) => termes.add(m));
    }
  }
  return Array.from(termes);
}

/**
 * Vérifie si un champ produit (nom, ferme, catégorie...) correspond à la
 * requête de recherche, en tenant compte des équivalents FR/EN connus.
 */
export function correspondRecherche(champ, query) {
  if (!champ) return false;
  const texte = champ.toLowerCase();
  const termes = elargirTermesRecherche(query);
  return termes.some((terme) => texte.includes(terme));
}

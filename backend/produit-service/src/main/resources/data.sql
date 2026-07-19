-- Data seeding script for Agrycam Produit Service
INSERT INTO categorie (nom) SELECT 'Élevage' WHERE NOT EXISTS (SELECT 1 FROM categorie WHERE nom = 'Élevage');
INSERT INTO categorie (nom) SELECT 'Agriculture' WHERE NOT EXISTS (SELECT 1 FROM categorie WHERE nom = 'Agriculture');

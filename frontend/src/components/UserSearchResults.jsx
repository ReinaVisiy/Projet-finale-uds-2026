// src/components/UserSearchResults.jsx
import React, { useState } from 'react';
import { Search, ArrowLeft, User, ShieldCheck } from 'lucide-react';
import { utilisateurApi } from '../services/api';
import { mapProfileToFrontendUser } from '../services/userMapping';
import { useDict } from '../context/LanguageContext';

// Recherche d'utilisateurs par nom : renvoie une liste de correspondances
// (pas un seul résultat), chacune cliquable vers son profil public.
const translations = {
  fr: {
    back: 'Retour', title: 'Rechercher un utilisateur', searchPlaceholder: "Nom d'un client ou d'un producteur...",
    search: 'Rechercher', searchFailed: 'La recherche a échoué.', searching: 'Recherche en cours...',
    noResults: 'Aucun utilisateur trouvé pour', producer: '🌾 Producteur', client: '🛒 Client',
  },
  en: {
    back: 'Back', title: 'Search for a user', searchPlaceholder: "A client's or producer's name...",
    search: 'Search', searchFailed: 'Search failed.', searching: 'Searching...',
    noResults: 'No users found for', producer: '🌾 Producer', client: '🛒 Client',
  },
};

export default function UserSearchResults({ onBack, onSelectUser }) {
  const t = useDict(translations);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const lancerRecherche = async (e) => {
    e && e.preventDefault();
    if (!query.trim()) return;
    setChargement(true);
    setErreur(null);
    try {
      const bruts = await utilisateurApi.rechercherUtilisateurs(query.trim());
      // Les comptes admin n'ont pas de profil public.
      const utilisateurs = (bruts || [])
        .filter((u) => u.role !== 'ADMIN')
        .map((u) => mapProfileToFrontendUser(u));
      setResults(utilisateurs);
    } catch (err) {
      setErreur(err?.message || t.searchFailed);
      setResults([]);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} /> {t.back}
        </button>

        <h1 style={styles.title}>{t.title}</h1>

        <form style={styles.searchWrap} onSubmit={lancerRecherche}>
          <Search size={20} color="#6c757d" style={styles.searchIcon} />
          <input
            type="text"
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" style={styles.searchBtn}>{t.search}</button>
        </form>

        {erreur && <div style={styles.errorBanner}>{erreur}</div>}

        {chargement && <p style={styles.hint}>{t.searching}</p>}

        {!chargement && results !== null && (
          results.length === 0 ? (
            <p style={styles.emptyText}>{t.noResults} "{query}"</p>
          ) : (
            <div style={styles.resultsList}>
              {results.map((u) => (
                <button key={u.id} style={styles.resultCard} onClick={() => onSelectUser(u)}>
                  <div style={styles.avatar}>
                    {u.photo ? (
                      <img src={u.photo} alt={u.nom} style={styles.avatarImg} />
                    ) : (
                      u.prenom?.[0]?.toUpperCase() || <User size={20} />
                    )}
                  </div>
                  <div style={styles.resultInfo}>
                    <span style={styles.resultName}>{u.prenom} {u.nom}</span>
                    <span style={styles.roleTag}>
                      {u.role === 'vendeur' ? t.producer : t.client}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  container: { maxWidth: '700px', margin: '0 auto', padding: '32px 24px 80px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#212529', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '20px', padding: 0 },
  title: { fontSize: '22px', fontWeight: '900', color: '#1b4d3e', margin: '0 0 20px 0' },

  searchWrap: { display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', border: '1.5px solid #e9ecef', borderRadius: '16px', padding: '6px 6px 6px 18px', marginBottom: '20px' },
  searchIcon: { flexShrink: 0 },
  searchInput: { flex: 1, border: 'none', outline: 'none', padding: '12px 12px', fontSize: '14px', fontFamily: 'inherit', backgroundColor: 'transparent' },
  searchBtn: { padding: '12px 22px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '13.5px', fontWeight: '800', cursor: 'pointer' },

  errorBanner: { backgroundColor: '#fdecea', color: '#b3261e', fontSize: '13px', fontWeight: '600', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px' },
  hint: { fontSize: '13px', color: '#6c757d', fontWeight: '600' },
  emptyText: { fontSize: '13px', color: '#adb5bd', fontWeight: '500' },

  resultsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  resultCard: { display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#ffffff', border: '1px solid #e9ecef', borderRadius: '16px', padding: '14px 18px', cursor: 'pointer', textAlign: 'left', width: '100%' },
  avatar: { width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#2d6a4f', color: '#ffffff', fontSize: '17px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  resultInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  resultName: { fontSize: '14.5px', fontWeight: '800', color: '#212529' },
  roleTag: { fontSize: '11.5px', fontWeight: '700', color: '#6c757d' },
};

import React, { useState } from 'react';
import { Search, ChevronDown, MessageCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Avant : cette page n'avait aucun dictionnaire de traduction, tout le
// texte (titres, catégories, questions/réponses) était figé en français.
// Le bouton de langue n'avait donc strictement aucun effet ici. On ajoute
// useDict() comme dans les autres pages, et on identifie les catégories
// par une clé stable ('general', 'achat', ...) plutôt que par leur libellé
// affiché, pour que le filtrage reste correct dans les deux langues.

export default function FAQPage({ onBack }) {
  const { t } = useTranslation();
  const categoryKeys = ['general', 'achat', 'vente', 'livraison', 'paiement'];
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [openQuestion, setOpenQuestion] = useState(1);

  const filteredQuestions = t('faq.questions', { returnObjects: true }).filter(q =>
    (activeCategory === 'general' || q.category === activeCategory || activeCategory === '') &&
    q.q.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.pageWrapper} className="fade-in">
      {/* Hero Section */}
      <div style={styles.heroSection}>
        {onBack && (
          <button style={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={20} />
            {t('faq.back')}
          </button>
        )}
        
        <div style={styles.heroContent}>
          <div style={styles.iconWrap}>
            <HelpCircle size={40} color="#fff" />
          </div>
          <h1 style={styles.heroTitle}>{t('faq.title')}</h1>
          <p style={styles.heroSubtitle}>{t('faq.subtitle')}</p>
          
          <div style={styles.searchWrap}>
            <Search size={20} color="#6c757d" style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder={t('faq.searchPlaceholder')}
              style={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={styles.container}>
        {/* Categories */}
        <div style={styles.categoryContainer}>
          {categoryKeys.map(cat => (
            <button 
              key={cat} 
              style={{
                ...styles.categoryBtn, 
                ...(activeCategory === cat ? styles.categoryBtnActive : {})
              }}
              onClick={() => setActiveCategory(cat)}
            >
              {t('faq.categories', { returnObjects: true })[cat]}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div style={styles.faqList}>
          {filteredQuestions.length === 0 ? (
            <div style={styles.emptyState}>
              <Search size={40} color="#adb5bd" style={{marginBottom: '16px'}} />
              <h3 style={styles.emptyTitle}>{t('faq.noResultTitle')}</h3>
              <p style={styles.emptyText}>{t('faq.noResultText')}</p>
            </div>
          ) : (
            filteredQuestions.map((item) => {
              const isOpen = openQuestion === item.id;
              return (
                <div 
                  key={item.id} 
                  style={{
                    ...styles.faqCard,
                    ...(isOpen ? styles.faqCardOpen : {})
                  }}
                >
                  <div 
                    style={styles.faqHeader} 
                    onClick={() => setOpenQuestion(isOpen ? null : item.id)}
                  >
                    <h3 style={{
                      ...styles.questionText,
                      ...(isOpen ? styles.questionTextOpen : {})
                    }}>
                      {item.q}
                    </h3>
                    <div style={{
                      ...styles.chevronWrap,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)'
                    }}>
                      <ChevronDown size={20} color={isOpen ? '#2d6a4f' : '#6c757d'} />
                    </div>
                  </div>
                  
                  {isOpen && (
                    <div style={styles.faqBody}>
                      <p style={styles.answerText}>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contact Support */}
        <div style={styles.supportBox}>
          <div style={styles.supportIconWrap}>
            <MessageCircle size={28} color="#2d6a4f" />
          </div>
          <div style={styles.supportContent}>
            <h3 style={styles.supportTitle}>{t('faq.supportTitle')}</h3>
            <p style={styles.supportText}>{t('faq.supportText')}</p>
          </div>
          <button style={styles.supportBtn}>
            {t('faq.supportBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    width: '100%',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  heroSection: {
    background: 'linear-gradient(135deg, #1b4d3e 0%, #2d6a4f 100%)',
    padding: '80px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  backBtn: {
    position: 'absolute',
    top: '30px',
    left: '40px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    padding: '10px 20px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease',
  },
  heroContent: {
    maxWidth: '700px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    zIndex: 2,
  },
  iconWrap: {
    width: '80px',
    height: '80px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  heroTitle: {
    fontSize: '42px',
    fontWeight: '800',
    color: 'white',
    margin: '0 0 16px 0',
    letterSpacing: '-0.03em',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: '1.6',
    margin: '0 0 40px 0',
  },
  searchWrap: {
    position: 'relative',
    width: '100%',
    maxWidth: '560px',
  },
  searchIcon: {
    position: 'absolute',
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  searchInput: {
    width: '100%',
    padding: '20px 20px 20px 56px',
    borderRadius: '20px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    color: '#212529',
    backgroundColor: '#ffffff',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  container: {
    maxWidth: '900px',
    margin: '-40px auto 60px',
    padding: '0 24px',
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  categoryContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '40px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryBtn: {
    padding: '12px 28px',
    backgroundColor: '#ffffff',
    color: '#6c757d',
    border: '1px solid #dee2e6',
    borderRadius: '16px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
  },
  categoryBtnActive: {
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    borderColor: '#2d6a4f',
    boxShadow: '0 8px 24px rgba(45, 106, 79, 0.2)',
  },
  faqList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '48px',
  },
  faqCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e9ecef',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  },
  faqCardOpen: {
    borderColor: '#b7e4c7',
    boxShadow: '0 12px 32px rgba(45, 106, 79, 0.08)',
  },
  faqHeader: {
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    userSelect: 'none',
  },
  questionText: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#212529',
    margin: 0,
    transition: 'color 0.2s ease',
  },
  questionTextOpen: {
    color: '#2d6a4f',
  },
  chevronWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.3s ease',
  },
  faqBody: {
    padding: '0 32px 28px 32px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px dashed #e9ecef',
    animation: 'fadeIn 0.3s ease forwards',
  },
  answerText: {
    fontSize: '15px',
    color: '#495057',
    lineHeight: '1.7',
    margin: 0,
    paddingTop: '20px',
  },
  supportBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid #e9ecef',
    boxShadow: '0 12px 36px rgba(0,0,0,0.04)',
    gap: '24px',
  },
  supportIconWrap: {
    width: '64px',
    height: '64px',
    backgroundColor: '#e9f5ee',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#212529',
    margin: '0 0 8px 0',
  },
  supportText: {
    fontSize: '14px',
    color: '#6c757d',
    lineHeight: '1.5',
    margin: 0,
  },
  supportBtn: {
    padding: '16px 32px',
    backgroundColor: '#1b4d3e',
    color: '#ffffff',
    borderRadius: '16px',
    fontSize: '15px',
    fontWeight: '800',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 8px 24px rgba(27, 77, 62, 0.2)',
    flexShrink: 0,
  },
  emptyState: {
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px dashed #dee2e6',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#212529',
    margin: '0 0 8px 0',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6c757d',
    margin: 0,
  }
};

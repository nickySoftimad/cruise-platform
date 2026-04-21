import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import CruiseCard from '../components/CruiseCard';
import SearchEngine from '../components/SearchEngine';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function CruiseListing() {
  const [cruises, setCruises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    continent: 'All',
    provider: 'All',
    duration: 'All',
    maxPrice: ''
  });
  const [sort, setSort] = useState('default');

  useEffect(() => {
    axios.get(`${API_URL}/cruises`)
      .then(r => setCruises(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const continents = useMemo(() =>
    ['All', ...new Set(cruises.map(c => c.continent))], [cruises]);

  const providers = useMemo(() =>
    ['All', ...new Set(cruises.map(c => c.provider))], [cruises]);

  const filteredCruises = useMemo(() => {
    let list = cruises.filter(c => {
      const matchCont = filters.continent === 'All' || c.continent === filters.continent;
      const matchProv = filters.provider === 'All' || c.provider === filters.provider;
      let matchDur = true;
      if (filters.duration === 'Short') matchDur = c.durationDays <= 7;
      if (filters.duration === 'Medium') matchDur = c.durationDays > 7 && c.durationDays <= 12;
      if (filters.duration === 'Long') matchDur = c.durationDays > 12;
      const matchPrice = !filters.maxPrice || c.price <= parseInt(filters.maxPrice);
      return matchCont && matchProv && matchDur && matchPrice;
    });

    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'duration') list = [...list].sort((a, b) => a.durationDays - b.durationDays);

    return list;
  }, [filters, sort, cruises]);

  return (
    <>
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="hero-content">
          <p className="hero-eyebrow">Agence de voyage sur mesure</p>
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            L'art de voyager <em>autrement</em>,<br />sur toutes les mers du monde
          </motion.h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Partez pour une aventure inoubliable, entre élégance et exploration. 
            Nos croisières sont rigoureusement sélectionnées pour vous offrir des 
            expériences uniques — escales exclusives, confort raffiné, itinéraires 
            riches en découvertes culturelles.
          </motion.p>
        </div>
      </section>

      {/* SEARCH ENGINE */}
      <SearchEngine
        filters={filters}
        setFilters={setFilters}
        continents={continents}
        providers={providers}
        sort={sort}
        setSort={setSort}
      />

      {/* LISTING */}
      <main className="main-container">
        <div className="section-header">
          <p className="section-label">Nos Compagnies Partenaires</p>
          <h2>Consulter nos croisières</h2>
          {/* Provider quick links */}
          {!loading && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '1rem 0' }}>
              {providers.filter(p => p !== 'All').map(p => (
                <button
                  key={p}
                  onClick={() => setFilters(prev => ({ ...prev, provider: prev.provider === p ? 'All' : p }))}
                  style={{
                    padding: '5px 14px',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--sans)',
                    fontWeight: 600,
                    border: '1.5px solid',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderColor: filters.provider === p ? 'var(--blue)' : 'var(--border)',
                    background: filters.provider === p ? 'var(--gradient-nav)' : 'white',
                    color: filters.provider === p ? 'white' : 'var(--text-mid)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <p className="results-count">
            {loading
              ? 'Chargement en cours...'
              : `${filteredCruises.length} itinéraire${filteredCruises.length > 1 ? 's' : ''} disponible${filteredCruises.length > 1 ? 's' : ''}`
            }
          </p>
        </div>

        {loading ? (
          <div className="skeleton-grid">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        ) : filteredCruises.length === 0 ? (
          <div className="empty-state">
            <h3>Aucun itinéraire trouvé</h3>
            <p>Modifiez vos critères de recherche pour voir plus de résultats.</p>
            <span
              className="reset-link"
              onClick={() => setFilters({ continent: 'All', provider: 'All', duration: 'All', maxPrice: '' })}
            >
              Réinitialiser les filtres
            </span>
          </div>
        ) : (
          <motion.div layout className="cruise-grid">
            <AnimatePresence mode="popLayout">
              {filteredCruises.map(cruise => (
                <CruiseCard key={cruise.id} cruise={cruise} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </>
  );
}

export default CruiseListing;

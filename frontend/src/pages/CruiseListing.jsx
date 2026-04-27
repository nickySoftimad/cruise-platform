import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import CruiseCard from '../components/CruiseCard';
import SearchEngine from '../components/SearchEngine';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function CruiseListing() {
  const [cruises, setCruises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(9);
  const [filters, setFilters] = useState({
    continent: 'All',
    provider: 'All',
    duration: 'All',
    maxPrice: '',
    q: ''
  });
  const [sort, setSort] = useState('default');
  const heroImages = useMemo(() => [
    "https://itinerairesdumonde.com/wp-content/uploads/2021/06/car-color-contrast-1660990.jpg",
    "https://itinerairesdumonde.com/wp-content/uploads/2021/05/etats-unis-70.jpg",
    "https://itinerairesdumonde.com/wp-content/uploads/2021/05/oman15.jpg",
    "https://itinerairesdumonde.com/wp-content/uploads/2020/04/danakilethiopie1.jpg"
  ], []);

  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroImage(prev => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    axios.get(`${API_URL}/cruises`)
      .then(r => setCruises(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  // Reset pagination when filters or sort changes
  useEffect(() => {
    setVisibleCount(9);
  }, [filters, sort]);

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

      const matchSearch = !filters.q ||
        c.name.toLowerCase().includes(filters.q.toLowerCase()) ||
        c.destination.toLowerCase().includes(filters.q.toLowerCase()) ||
        c.ship.toLowerCase().includes(filters.q.toLowerCase());

      return matchCont && matchProv && matchDur && matchPrice && matchSearch;
    });

    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'duration') list = [...list].sort((a, b) => a.durationDays - b.durationDays);

    return list;
  }, [filters, sort, cruises]);

  const displayedCruises = useMemo(() => {
    return filteredCruises.slice(0, visibleCount);
  }, [filteredCruises, visibleCount]);

  const [isMoreLoading, setIsMoreLoading] = useState(false);

  const handleLoadMore = () => {
    setIsMoreLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 9);
      setIsMoreLoading(false);
    }, 400); // Smooth transition delay
  };

  return (
    <>
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-slideshow-container">
          <AnimatePresence>
            <motion.div
              key={currentHeroImage}
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: 1, scale: 1.15 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 1.5 },
                scale: { duration: 8, ease: "linear" }
              }}
              className="hero-slideshow-image"
              style={{ backgroundImage: `url(${heroImages[currentHeroImage]})` }}
            />
          </AnimatePresence>
          <div className="hero-slideshow-overlay" />
        </div>

        <motion.div
          className="hero-content"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
        >
          <p className="hero-eyebrow">Expertise & Passion</p>
          <motion.h2
            className="hero-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            L'art de voyager <em>autrement</em>,<br />sur toutes les mers du monde
          </motion.h2>
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
        </motion.div>
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

          {!loading && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '1rem 0' }}>
              {providers.filter(p => p !== 'All').map(p => (
                <button
                  key={p}
                  onClick={() => setFilters(prev => ({ ...prev, provider: prev.provider === p ? 'All' : p }))}
                  className={`provider-chip ${filters.provider === p ? 'active' : ''}`}
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
              onClick={() => setFilters({ continent: 'All', provider: 'All', duration: 'All', maxPrice: '', q: '' })}
            >
              Réinitialiser les filtres
            </span>
          </div>
        ) : (
          <>
            <div className="cruise-grid">
              <AnimatePresence>
                {displayedCruises.map((cruise, idx) => (
                  <motion.div
                    key={cruise.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: (idx % 9) * 0.05 }}
                  >
                    <CruiseCard cruise={cruise} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {visibleCount < filteredCruises.length && (
              <div className="load-more-container">
                <button
                  className={`btn-load-more ${isMoreLoading ? 'loading' : ''}`}
                  onClick={handleLoadMore}
                  disabled={isMoreLoading}
                >
                  {isMoreLoading ? 'Chargement...' : 'Charger plus d\'itinéraires'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default CruiseListing;

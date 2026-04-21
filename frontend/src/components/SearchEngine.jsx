import React from 'react';
import { Search, MapPin, Clock, Euro, SlidersHorizontal, Building2 } from 'lucide-react';

function SearchEngine({ filters, setFilters, continents, providers, sort, setSort }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <section className="search-section">
      <div className="search-container">
        <div className="search-grid">

          {/* Continent */}
          <div className="search-field">
            <label><MapPin size={13} /> Destination</label>
            <select name="continent" value={filters.continent} onChange={handleChange}>
              {continents.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'Tous les continents' : c}</option>
              ))}
            </select>
          </div>

          {/* Provider */}
          <div className="search-field">
            <label><Building2 size={13} /> Compagnie</label>
            <select name="provider" value={filters.provider} onChange={handleChange}>
              {providers.map(p => (
                <option key={p} value={p}>{p === 'All' ? 'Toutes les compagnies' : p}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="search-field">
            <label><Clock size={13} /> Durée</label>
            <select name="duration" value={filters.duration} onChange={handleChange}>
              <option value="All">Toutes les durées</option>
              <option value="Short">Court (7 nuits ou moins)</option>
              <option value="Medium">Moyen (8 à 12 nuits)</option>
              <option value="Long">Long (plus de 12 nuits)</option>
            </select>
          </div>

          {/* Max Price */}
          <div className="search-field">
            <label><Euro size={13} /> Budget max (€)</label>
            <input
              type="number"
              name="maxPrice"
              placeholder="Ex : 5000"
              value={filters.maxPrice}
              onChange={handleChange}
            />
          </div>

          {/* Sort */}
          <div className="search-field">
            <label><SlidersHorizontal size={13} /> Trier par</label>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="default">Recommandés</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="duration">Durée</option>
            </select>
          </div>

          <div className="search-btn-container">
            <button
              className="search-btn"
              onClick={() => setFilters({ continent: 'All', provider: 'All', duration: 'All', maxPrice: '' })}
            >
              <Search size={16} />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SearchEngine;

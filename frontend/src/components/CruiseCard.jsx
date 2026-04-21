import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CruiseCard = ({ cruise }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="cruise-card"
    >
      <Link to={`/cruise/${cruise.id}`} className="cruise-card-link">
        <div className="cruise-card-img-wrap">
          <img
            src={cruise.image}
            alt={cruise.name}
            className="cruise-card-img"
            loading="lazy"
          />
          <div className="cruise-card-badge">{cruise.provider}</div>
        </div>

        <div className="cruise-card-body">
          <div className="cruise-card-continent">{cruise.continent} · {cruise.destination}</div>
          <h3 className="cruise-card-title">{cruise.name}</h3>
          <p className="cruise-card-ship">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 20l10-7 10 7"/><path d="M12 3v10"/><path d="M5 11V7h14v4"/>
            </svg>
            {cruise.ship}
          </p>

          <div className="cruise-card-meta">
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {cruise.departureDate}
            </span>
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              {cruise.duration}
            </span>
          </div>

          <div className="cruise-card-footer">
            <div className="cruise-price">
              <span className="cruise-price-label">À partir de</span>
              <span className="cruise-price-amount">
                {cruise.price.toLocaleString('fr-FR')}
                <span style={{ fontSize: '1rem', marginLeft: 4 }}>{cruise.currency === 'EUR' ? '€' : cruise.currency}</span>
              </span>
            </div>
            <button className="cruise-card-btn">Voir le programme</button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CruiseCard;

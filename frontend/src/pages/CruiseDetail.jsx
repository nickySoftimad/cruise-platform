import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Ship, MapPin, Clock, Mail, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function CruiseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cruise, setCruise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    const fetchCruise = async () => {
      try {
        const response = await axios.get(`${API_URL}/cruises`);
        const found = response.data.find(c => c.id === id);
        setCruise(found);
      } catch (error) {
        console.error('Error fetching cruise details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCruise();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return (
    <div className="loading-state">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <Anchor size={40} style={{ color: 'var(--gold)', opacity: 0.5 }} />
        <p>Chargement des détails...</p>
      </div>
    </div>
  );

  if (!cruise) return (
    <div className="error-state">
      <ChevronLeft style={{ margin: '0 auto 1rem', opacity: 0.3 }}  size={40} />
      <p>Croisière introuvable.</p>
      <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/')}>
        Retour à la liste
      </button>
    </div>
  );

  const images = cruise.gallery?.length ? [cruise.image, ...cruise.gallery] : [cruise.image];

  return (
    <motion.div
      className="detail-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Breadcrumb */}
      <div className="detail-breadcrumb">
        <span style={{ color: 'var(--text-light)' }}>Accueil</span>
        <span className="sep">/</span>
        <span style={{ color: 'var(--text-light)' }}>Croisières</span>
        <span className="sep">/</span>
        <span>{cruise.name}</span>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Retour à la liste
        </button>
      </div>

      <div className="detail-grid">
        {/* LEFT COLUMN */}
        <div className="detail-main">
          {/* Gallery */}
          <div className="detail-gallery">
            <img
              src={images[activeImg]}
              alt={cruise.name}
              className="main-image"
            />
            {images.length > 1 && (
              <div className="gallery-thumbs">
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Vue ${i + 1}`}
                    className={`gallery-thumb ${activeImg === i ? 'active' : ''}`}
                    onClick={() => setActiveImg(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="detail-section">
            <h2>À propos de cette croisière</h2>
            <p style={{ color: 'var(--text-mid)', lineHeight: 1.9, fontSize: '1rem' }}>
              {cruise.description}
            </p>
          </div>

          {/* Itinerary */}
          {cruise.itineraryDetailed?.length > 0 && (
            <div className="detail-section">
              <h2>Programme jour par jour</h2>
              <div className="itinerary-timeline">
                {cruise.itineraryDetailed.map((item, index) => (
                  <div key={index} className="itinerary-item">
                    <div className="itinerary-day-num">
                      <span className="itinerary-day-label">Jour {item.day}</span>
                    </div>
                    <div className="itinerary-line">
                      <div className="itinerary-dot" />
                      <div className="itinerary-connector" />
                    </div>
                    <div style={{ paddingBottom: '1.5rem' }}>
                      <div className="stop-name">{item.port}</div>
                      <div className="stop-desc">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cabin pricing */}
          {cruise.cabins?.length > 0 && (
            <div className="detail-section">
              <h2>Tarifs par catégorie de cabine</h2>
              <table className="cabin-table">
                <thead>
                  <tr>
                    <th>Catégorie de cabine</th>
                    <th>Prix par personne</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cruise.cabins.map((cabin, i) => (
                    <tr key={i}>
                      <td>
                        <strong style={{ fontWeight: 500 }}>{cabin.category}</strong>
                      </td>
                      <td>
                        <span className="cabin-price">
                          {cabin.price.toLocaleString('fr-FR')} €
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="cruise-card-btn">Demander un devis</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT — Booking Card */}
        <aside>
          <div className="booking-card">
            <div className="booking-card-header">
              <div className="provider-badge-large">{cruise.provider}</div>
              <h1 className="booking-card-header h1"
                style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 400, lineHeight: 1.25, color: 'white', marginTop: '0.75rem' }}
              >
                {cruise.name}
              </h1>
            </div>
            <div className="booking-card-body">
              <div className="info-pills">
                <div className="info-pill">
                  <Ship size={16} />
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-light)', fontWeight: 700 }}>Navire</div>
                    <strong>{cruise.ship}</strong>
                  </div>
                </div>
                <div className="info-pill">
                  <MapPin size={16} />
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-light)', fontWeight: 700 }}>Destination</div>
                    <strong>{cruise.destination}</strong>
                  </div>
                </div>
                <div className="info-pill">
                  <Clock size={16} />
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-light)', fontWeight: 700 }}>Durée</div>
                    <strong>{cruise.duration}</strong>
                  </div>
                </div>
                <div className="info-pill">
                  <Calendar size={16} />
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-light)', fontWeight: 700 }}>Départ</div>
                    <strong>{cruise.departureDate}</strong>
                  </div>
                </div>
              </div>

              <div className="price-box">
                <span className="price-label">À partir de</span>
                <div className="price-value">
                  {cruise.price.toLocaleString('fr-FR')}<span> {cruise.currency === 'EUR' ? '€' : cruise.currency}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>par personne</div>
              </div>

              <a
                href={`mailto:contact@itinerairesdumonde.com?subject=Demande de devis - ${cruise.name}&body=Bonjour, je souhaite recevoir un devis pour la croisière "${cruise.name}" (${cruise.departureDate}).`}
                className="btn-primary full-width"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', borderRadius: 'var(--radius)' }}
              >
                <Mail size={16} /> Demander un devis
              </a>

              <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--cream)', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--text-mid)' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-dark)' }}>Réponse garantie sous 24h</strong>
                Notre équipe vous contacte avec un devis personnalisé et les disponibilités.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

export default CruiseDetail;

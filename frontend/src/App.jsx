import { Routes, Route, Link, NavLink } from 'react-router-dom';
import { Anchor, Globe, ChevronDown, Menu as MenuIcon, X } from 'lucide-react';
import CruiseListing from './pages/CruiseListing';
import CruiseDetail from './pages/CruiseDetail';
import AdminPanel from './pages/AdminPanel';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="app-wrapper">
      {/* ── NAVBAR ─────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            <div className="logo-text-group">
              <div className="navbar-logo-text">ITINÉRAIRES <span>DU MONDE</span></div>
              <div className="logo-subtitle">Créateur de voyages</div>
            </div>
          </Link>

          {/* Desktop Links - hidden on mobile via CSS, but we also handle the mobile version */}
          <ul className={`navbar-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
            <li className="nav-item">
              <a href="#" onClick={() => setMobileMenuOpen(false)}>L'agence <ChevronDown size={14} /></a>
            </li>
            <li className="nav-item">
              <a href="#" onClick={() => setMobileMenuOpen(false)}>Destinations <ChevronDown size={14} /></a>
            </li>
            <li className="nav-item dropdown">
              <a href="#" className="dropdown-toggle">Types De Voyage <ChevronDown size={14} /></a>
              <ul className="dropdown-menu">
                <li><NavLink to="/" end onClick={() => setMobileMenuOpen(false)}>Croisières</NavLink></li>
                <li><a href="#" onClick={() => setMobileMenuOpen(false)}>Circuits</a></li>
                <li><a href="#" onClick={() => setMobileMenuOpen(false)}>Séjours</a></li>
              </ul>
            </li>
            <li className="nav-item">
              <a href="#" onClick={() => setMobileMenuOpen(false)}>Conseils Aux Voyageurs</a>
            </li>
            
            {/* Contact info in mobile menu */}
            <li className="mobile-only-contact">
              <a href="tel:+33493474006" className="phone-link">
                TEL : 04 93 47 40 06
              </a>
            </li>
          </ul>

          <div className="nav-contact desktop-only">
            <a href="tel:+33493474006" className="phone-link">
              TEL : 04 93 47 40 06
            </a>
          </div>

          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </nav>

      {/* ── ROUTES ────────────────────────────────── */}
      <Routes>
        <Route path="/" element={<CruiseListing />} />
        <Route path="/cruise/:id" element={<CruiseDetail />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>

      {/* ── INFO BANNER & LEAD GENERATION ──────────────── */}
      <section className="info-banner">
        <div className="info-banner-inner">
          <div className="info-banner-content">
            <div className="info-banner-eyebrow">Expertise & Passion</div>
            <h2 className="info-banner-title">
              <span className="info-banner-title-accent">Itinéraires du Monde</span>
              Nos Croisières d'Exception
            </h2>
            <hr className="info-banner-title-rule" />
            <div className="editorial-text">
              <p className="italic-intro">
                Yachts, voiliers, petits paquebots traditionnels, Liners, grands paquebots, megaships ou navires d’expéditions, les possibilités sont multiples et dépendent du type de séjour et de l’ambiance recherchée.
              </p>
              <p>
                Du voilier intimiste de 60 passagers au megaship pouvant accueillir 4500 croisiéristes, vous devrez choisir celui qui vous correspond le mieux.
              </p>
              <p>
                Les compagnies et les croisières que nous vous proposons sont rigoureusement sélectionnées pour le confort des cabines ou des suites, le niveau des services et la qualité de la gastronomie.
              </p>
              <p>
                Vous trouverez sur notre site Internet une offre parmi la plus diversifiée du marché (yachts, voiliers, petits paquebots, liners transatlantiques, mégaship…) avec différents types de tarifs s’adaptant à tous les budgets.
              </p>
            </div>
          </div>

          <div className="info-banner-divider"></div>

          <div className="info-banner-sidebar">
            <div className="company-list-wrap">
              <h3 className="sidebar-title">Répertoire des Compagnies</h3>
              <ul className="info-list">
                <li>
                  <span className="category-badge">Standard</span>
                  <span>Holland America, Norwegian Cruise Line, P&O, Star Clippers (Star Flyer / Clipper)</span>
                </li>
                <li>
                  <span className="category-badge luxury">Premium</span>
                  <span>Ponant, Oceania, Paul Gauguin, Azamara, Cunard, Disney Cruise Line</span>
                </li>
                <li>
                  <span className="category-badge luxury">Luxe 5★</span>
                  <span>Crystal Cruises, Silversea, Seabourn, SeaDream Yacht Club, Regent Seven Seas</span>
                </li>
                <li>
                  <span className="category-badge fluvial">Fluvial</span>
                  <span>CroisiEurope, Hurtigruten — navires sur mesure le long des plus belles voies d'eau</span>
                </li>
                <li>
                  <span className="category-badge">Expédition</span>
                  <span>Aranui 3 & 5, Quark Expeditions</span>
                </li>
              </ul>
            </div>

            <div className="contact-form-box dark-form">
              <h3 className="dark-form-title">Parlez-nous en détail de votre projet</h3>
              <form className="agency-form" onSubmit={(e) => { e.preventDefault(); alert('Merci ! Votre projet a bien été envoyé.'); }}>
                <div className="form-row">
                  <div className="form-group">
                    <input type="text" placeholder="Nom" required />
                  </div>
                  <div className="form-group">
                    <input type="text" placeholder="Prénom" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <input type="email" placeholder="E-mail" required />
                  </div>
                  <div className="form-group">
                    <input type="tel" placeholder="Téléphone" required />
                  </div>
                </div>
                <div className="form-group">
                  <textarea rows="4" placeholder="Votre projet plus en détail..." required></textarea>
                </div>
                <button type="submit" className="btn-primary">Envoyer</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-newsletter">
          <div className="container">
            <h2>Ne ratez pas le prochain départ</h2>
            <p>Inscrivez-vous à notre lettre d’information pour recevoir nos idées d’évasions, et nos prochaines destinations.</p>
            <form className="footer-newsletter-form">
              <div className="form-group">
                <input type="email" placeholder="Votre email" />
              </div>
              <div className="form-consent">
                <input type="checkbox" id="footer-consent" />
                <label htmlFor="footer-consent">En cochant cette case, j'accepte d'être informé sur les prochaines promotions et voyages</label>
              </div>
              <button type="submit" className="btn-subscribe">S'ABONNER</button>
            </form>
          </div>
        </div>

        <div className="footer-inner">
          <div className="footer-col">
            <h4>L'AGENCE</h4>
            <ul>
              <li><a href="#">L'agence de cannes</a></li>
              <li><a href="#">L’équipe de l’agence</a></li>
              <li><a href="#">Contacter l'agence</a></li>
              <li><a href="#">Vos témoignages</a></li>
              <li><a href="#">On parle de nous</a></li>
              <li><a href="#">Mentions légales</a></li>
              <li><a href="#">C.G.V</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>DESTINATIONS</h4>
            <ul>
              <li><a href="#">Afrique et Océan Indien</a></li>
              <li><a href="#">Amériques et Caraïbes</a></li>
              <li><a href="#">Asie</a></li>
              <li><a href="#">Europe</a></li>
              <li><a href="#">Moyen Orient</a></li>
              <li><a href="#">Océanie</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>THÉMATIQUES</h4>
            <ul>
              <li><a href="#">Voyage sur mesure</a></li>
              <li><a href="#">Voyage photo</a></li>
              <li><a href="#">Voyage de noce</a></li>
              <li><a href="#">Tour du monde</a></li>
              <li><a href="#">Croisières</a></li>
              <li><a href="#">Autotours</a></li>
              <li><a href="#">CE et Association</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>NOUS SUIVRE</h4>
            <div className="social-grid">
              <a href="#" className="social-icon" aria-label="Facebook">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              </a>
              <a href="#" className="social-icon" aria-label="Instagram">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </a>
              <a href="#" className="social-icon" aria-label="Pinterest">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.27 2.67 7.9 6.46 9.32-.08-.8-.16-2.02.03-2.89l1.17-4.97s-.3-.6-.3-1.48c0-1.39.81-2.43 1.82-2.43.85 0 1.27.64 1.27 1.41 0 .86-.55 2.14-.83 3.32-.24.99.5 1.8 1.47 1.8 1.77 0 3.12-1.86 3.12-4.55 0-2.38-1.71-4.04-4.14-4.04-2.82 0-4.48 2.12-4.48 4.3 0 .85.33 1.77.74 2.27.08.1.09.19.07.29l-.27 1.11c-.04.18-.14.22-.33.13-1.22-.57-1.99-2.35-1.99-3.79 0-3.09 2.25-5.93 6.48-5.93 3.4 0 6.04 2.42 6.04 5.66 0 3.38-2.13 6.1-5.1 6.1-.99 0-1.92-.52-2.24-1.12l-.61 2.32c-.22.84-.81 1.9-1.21 2.54 1.13.34 2.33.53 3.57.53 5.52 0 10-4.48 10-10S17.52 2 12 2z" /></svg>
              </a>
              <a href="#" className="social-icon" aria-label="YouTube">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.15 1 12 1 12s0 3.85.46 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.85 23 12 23 12s0-3.85-.46-5.58zM9.75 15.02V8.98L15 12l-5.25 3.02z" /></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Itinéraires du Monde. Tous droits réservés.</span>
          <Link to="/admin" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>Administration</Link>
        </div>
      </footer>
    </div>
  );
}

export default App;

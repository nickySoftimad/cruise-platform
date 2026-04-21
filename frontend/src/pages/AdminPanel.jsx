import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, RefreshCw, Plus, CheckCircle, XCircle, Shield, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function AdminPanel() {
  const [providers, setProviders] = useState([]);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncing, setSyncing] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState({ id: '', name: '', url: '', type: 'xml', enabled: true });

  useEffect(() => {
    if (isAuthenticated) fetchProviders();
  }, [isAuthenticated]);

  const fetchProviders = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/providers`);
      setProviders(response.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Mot de passe incorrect');
    }
  };

  const handleRefreshCache = async (providerId = null) => {
    setSyncing(providerId || 'all');
    try {
      await axios.post(`${API_URL}/admin/cache/refresh`, { providerId }, {
        headers: { password }
      });
      await fetchProviders();
    } catch (error) {
      alert('Erreur lors du rafraîchissement');
    } finally {
      setSyncing(null);
    }
  };

  const handleAddProvider = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/admin/providers`, newProvider, {
        headers: { password }
      });
      setShowAddForm(false);
      setNewProvider({ id: '', name: '', url: '', type: 'xml', enabled: true });
      fetchProviders();
    } catch (error) {
      alert('Erreur lors de l\'ajout');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <motion.form
          className="admin-login-form"
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Shield size={48} className="admin-icon" />
          <h2>Espace Administration</h2>
          <p>Gestion des fournisseurs de flux croisières</p>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-input"
            autoFocus
          />
          <button type="submit" className="btn-primary full-width">
            Accéder à l'administration
          </button>
        </motion.form>
      </div>
    );
  }

  return (
    <motion.div
      className="admin-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="admin-dashboard-header">
        <div>
          <p className="section-label">Administration</p>
          <h1>Gestion des Fournisseurs</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn-secondary"
            style={{ color: 'var(--navy)', borderColor: 'var(--border)', background: 'white' }}
            onClick={() => handleRefreshCache()}
            disabled={syncing === 'all'}
          >
            <RefreshCw size={16} className={syncing === 'all' ? 'spin' : ''} />
            Rafraîchir tout le cache
          </button>
          <button className="btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={16} /> Ajouter un fournisseur
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Fournisseurs actifs', value: providers.filter(p => p.enabled).length },
          { label: 'Croisières importées', value: providers.reduce((sum, p) => sum + (p.count || 0), 0) },
          { label: 'Dernière synchro', value: providers.some(p => p.lastSync) ? 'Récente' : 'Jamais' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'white', border: '1px solid var(--border)', padding: '1.5rem 2rem', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, color: 'var(--text-light)', marginBottom: '0.5rem' }}>{label}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700, color: 'var(--navy)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Provider list */}
      <div className="provider-list">
        {providers.map(provider => (
          <div key={provider.id} className="provider-item">
            <div className="provider-info">
              <h3>{provider.name}</h3>
              <p className="provider-url">{provider.url}</p>
              <div className="provider-meta">
                <span>Format: <strong style={{ color: 'var(--navy)' }}>{provider.type.toUpperCase()}</strong></span>
                <span>
                  Dernière synchro:{' '}
                  <strong style={{ color: 'var(--navy)' }}>
                    {provider.lastSync
                      ? new Date(provider.lastSync).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : 'Jamais'}
                  </strong>
                </span>
                <span>Croisières: <strong style={{ color: 'var(--navy)' }}>{provider.count || 0}</strong></span>
              </div>
            </div>
            <div className="provider-actions">
              <span className={`status-badge ${provider.enabled ? 'active' : 'inactive'}`}>
                {provider.enabled ? <CheckCircle size={13} /> : <XCircle size={13} />}
                {provider.enabled ? 'Actif' : 'Inactif'}
              </span>
              <button
                className="btn-icon"
                onClick={() => handleRefreshCache(provider.id)}
                title="Rafraîchir ce fournisseur"
                disabled={!!syncing}
              >
                <RefreshCw size={16} className={syncing === provider.id ? 'spin' : ''} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add provider modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '1.5rem'
            }}
            onClick={e => e.target === e.currentTarget && setShowAddForm(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              style={{ background: 'white', padding: '2.5rem', borderRadius: '8px', width: '100%', maxWidth: '520px', position: 'relative' }}
            >
              <button
                onClick={() => setShowAddForm(false)}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
              >
                <X size={20} />
              </button>
              <p className="section-label" style={{ marginBottom: '0.5rem' }}>Configuration</p>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.75rem', fontWeight: 400, marginBottom: '2rem' }}>
                Nouveau fournisseur
              </h2>
              <form onSubmit={handleAddProvider} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { field: 'id', label: 'Identifiant unique (ex: starclippers)', type: 'text' },
                  { field: 'name', label: 'Nom affiché', type: 'text' },
                  { field: 'url', label: 'URL du flux XML/CSV', type: 'url' },
                ].map(({ field, label, type }) => (
                  <div key={field}>
                    <label style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--text-light)', display: 'block', marginBottom: '5px' }}>
                      {label}
                    </label>
                    <input
                      type={type}
                      value={newProvider[field]}
                      onChange={e => setNewProvider(prev => ({ ...prev, [field]: e.target.value }))}
                      required
                      className="admin-input"
                      style={{ margin: 0 }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--text-light)', display: 'block', marginBottom: '5px' }}>
                    Format
                  </label>
                  <select
                    value={newProvider.type}
                    onChange={e => setNewProvider(prev => ({ ...prev, type: e.target.value }))}
                    className="admin-input"
                    style={{ margin: 0, width: '100%' }}
                  >
                    <option value="xml">XML</option>
                    <option value="csv">CSV</option>
                    <option value="soap">SOAP/XML</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Ajouter</button>
                  <button type="button" onClick={() => setShowAddForm(false)}
                    className="btn-primary"
                    style={{ flex: 1, background: 'var(--cream)', color: 'var(--text-dark)', border: '1px solid var(--border)' }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AdminPanel;

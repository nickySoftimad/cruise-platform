# Cruise Platform Monorepo

Plateforme d'agrégation et d'affichage de croisières multi-fournisseurs (Star Clippers, Costa, CroisiEurope, Ara Nui).

## Structure du projet

- `/backend` : API Proxy Node.js/Express.
    - Consomme les flux XML/SOAP/CSV.
    - Normalise les données vers un schéma commun.
    - Mise en cache (TTL 6h).
    - Panel d'administration des fournisseurs.
- `/frontend` : Application React (Vite).
    - Moteur de recherche et filtres.
    - Grille de vignettes responsive.
    - Page détail croisière.
    - Espace Admin protégé.

## Configuration

1. **Backend** :
    - Allez dans `/backend`.
    - Créez un fichier `.env` (voir `.env.example`).
    - `npm install`
    - `npm start`
2. **Frontend** :
    - Allez dans `/frontend`.
    - `npm install`
    - `npm run dev`

## Administration

- Route : `/admin`
- Mot de passe par défaut : `admin123` (configurable dans le `.env` du backend).
- Fonctionnalités : Visualisation du statut de synchro, rafraîchissement manuel du cache.

## Schéma de données normalisé

```json
{
  "id": "string",
  "provider": "string",
  "name": "string",
  "ship": "string",
  "destination": "string",
  "continent": "string",
  "departureDate": "string",
  "duration": "string",
  "price": number,
  "currency": "string",
  "itinerary": ["string"],
  "image": "string",
  "description": "string"
}
```

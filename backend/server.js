require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const NodeCache = require('node-cache');
const fs = require('fs');
const path = require('path');
const { parseStarClippers, parseCosta, parseCroisiEurope, parseAraNui } = require('./utils/parsers');


const app = express();
const PORT = process.env.PORT || 4000;
const cache = new NodeCache({ stdTTL: 21600 }); // 6 hours
const xmlParser = new XMLParser({ ignoreAttributes: false });

// CORS configuration - sanitize origin to avoid trailing slash issues
const allowedOrigin = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : '*';

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'password']
}));
app.use(express.json());

const PROVIDERS_FILE = path.join(__dirname, 'data', 'providers.json');

const getProviders = () => {
  try {
    return JSON.parse(fs.readFileSync(PROVIDERS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
};

const saveProviders = (providers) => {
  fs.writeFileSync(PROVIDERS_FILE, JSON.stringify(providers, null, 2));
};

// Rich mock data with real Unsplash images
const MOCK_CRUISES = [
  {
    id: "sc-med-01",
    provider: "Star Clippers",
    name: "Trésors de la Méditerranée Orientale",
    ship: "Star Flyer",
    destination: "Grèce & Turquie",
    continent: "Europe",
    departureDate: "Mai 2026",
    duration: "7 nuits",
    durationDays: 7,
    price: 2450,
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1200&auto=format&fit=crop",
    description: "Voguez à bord du légendaire Star Flyer et découvrez les joyaux cachés de la Méditerranée orientale. Des eaux cristallines d'Athènes aux ruelles blanches de Santorin, ce voyage vous transportera hors du temps.",
    itinerary: ["Athènes (Pirée)", "Mykonos", "Santorin", "Rhodes", "Crète (Héraklion)", "Athènes (Pirée)"],
    itineraryDetailed: [
      { day: 1, port: "Athènes (Pirée)", description: "Embarquement l'après-midi. Dîner de bienvenue à bord." },
      { day: 2, port: "Mykonos", description: "Journée dans l'île des Cyclades, ruelles blanches et moulins à vent." },
      { day: 3, port: "Santorin", description: "Lever de soleil sur la caldeira, village d'Oia et vignobles." },
      { day: 4, port: "Rhodes", description: "Exploration de la cité médiévale classée UNESCO." },
      { day: 5, port: "Crète (Héraklion)", description: "Palais de Knossos et gastronomie crétoise." },
      { day: 6, port: "Navigation", description: "Journée en mer, activités à bord et conférences." },
      { day: 7, port: "Athènes (Pirée)", description: "Débarquement en matinée." }
    ],
    cabins: [
      { category: "Cabine Intérieure", price: 2450 },
      { category: "Cabine Extérieure", price: 3100 },
      { category: "Suite Owner", price: 5800 }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1602155320803-f0e738b8d679?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "sc-carib-01",
    provider: "Star Clippers",
    name: "Caraïbes : Îles du Vent & Grenadines",
    ship: "Royal Clipper",
    destination: "Grenadines",
    continent: "Amérique",
    departureDate: "Décembre 2025",
    duration: "7 nuits",
    durationDays: 7,
    price: 3100,
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
    description: "À bord du Royal Clipper, le plus grand voilier à mâts carrés du monde, naviguez vers les plus belles îles des Caraïbes. Chaque escale est une invitation au dépaysement total.",
    itinerary: ["Barbade", "Sainte-Lucie", "Dominique", "Antigua", "Saint-Barthélemy", "Barbade"],
    itineraryDetailed: [
      { day: 1, port: "Barbade (Bridgetown)", description: "Embarquement. Soirée avec musique live et cocktails tropicaux." },
      { day: 2, port: "Sainte-Lucie", description: "Les Pitons UNESCO, plantation de cacao et bains de boue volcanique." },
      { day: 3, port: "Dominique", description: "L'île nature des Caraïbes, cascades et forêt tropicale." },
      { day: 4, port: "Antigua", description: "365 plages, English Harbour et les chantiers navals Nelson's Dockyard." },
      { day: 5, port: "Saint-Barthélemy", description: "L'île chic des Antilles, shopping et gastronomie française." },
      { day: 6, port: "Navigation", description: "Journée en mer, plongée et snorkeling depuis le ship." },
      { day: 7, port: "Barbade (Bridgetown)", description: "Débarquement en matinée." }
    ],
    cabins: [
      { category: "Cabine Intérieure", price: 3100 },
      { category: "Cabine Extérieure", price: 3950 },
      { category: "Suite Owner", price: 7200 }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548574505-12c011f42698?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "sc-panama-01",
    provider: "Star Clippers",
    name: "Passage du Canal de Panama",
    ship: "Star Clipper",
    destination: "Costa Rica & Panama",
    continent: "Amérique",
    departureDate: "Novembre 2025",
    duration: "14 nuits",
    durationDays: 14,
    price: 4580,
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1517309230475-6736d926b979?q=80&w=1200&auto=format&fit=crop",
    description: "Une traversée épique à bord du Star Clipper, du Pacifique à l'Atlantique par le célèbre Canal de Panama. Ce grand voyage vous fera découvrir la biodiversité exceptionnelle d'Amérique Centrale.",
    itinerary: ["Carthagène (Colombie)", "Archipel San Blas", "Canal de Panama", "Manuel Antonio", "Quepos", "Puntarenas"],
    itineraryDetailed: [
      { day: 1, port: "Carthagène (Colombie)", description: "Embarquement dans la ville coloniale fortifiée." },
      { day: 3, port: "Archipel San Blas", description: "Paradis du Pacifique, rencontre avec les Indiens Kuna." },
      { day: 5, port: "Canal de Panama", description: "Franchissement du canal, expérience unique au monde." },
      { day: 8, port: "Quepos", description: "Parc National Manuel Antonio, paressa et singes." },
      { day: 10, port: "Puntarenas", description: "Volcans et paysages costa-ricains." },
      { day: 14, port: "Colón", description: "Débarquement." }
    ],
    cabins: [
      { category: "Cabine Intérieure", price: 4580 },
      { category: "Cabine Extérieure", price: 5900 },
      { category: "Suite Owner", price: 10500 }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544211107-df1600c5c4e9?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "ce-rhin-01",
    provider: "CroisiEurope",
    name: "Croisière sur le Rhin — De Bâle à Amsterdam",
    ship: "MS Alsace",
    destination: "Rhin & Moselle",
    continent: "Europe",
    departureDate: "Mars 2026",
    duration: "8 nuits",
    durationDays: 8,
    price: 1890,
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1200&auto=format&fit=crop",
    description: "Découvrez au fil de l'eau les châteaux rhénans, les vignobles en terrasses et les cités médiévales préservées. Une croisière fluviale d'exception à bord du confortable MS Alsace.",
    itinerary: ["Bâle", "Strasbourg", "Coblence", "Cologne", "Rotterdam", "Amsterdam"],
    itineraryDetailed: [
      { day: 1, port: "Bâle", description: "Embarquement. Visite du musée d'Art de Bâle." },
      { day: 2, port: "Strasbourg", description: "La cathédrale Notre-Dame et le quartier de la Petite France." },
      { day: 3, port: "Rüdesheim", description: "Vignobles du Rheingau et Vallée du Rhin moyen." },
      { day: 4, port: "Coblence", description: "Forteresse d'Ehrenbreitstein et confluence Rhin-Moselle." },
      { day: 5, port: "Cologne", description: "La cathédrale gothique et le quartier de la vieille ville." },
      { day: 7, port: "Rotterdam", description: "Architecture contemporaine et port d'Europe." },
      { day: 8, port: "Amsterdam", description: "Débarquement. Canaux et maisons du Golden Age." }
    ],
    cabins: [
      { category: "Cabine Standard", price: 1890 },
      { category: "Cabine Supérieure", price: 2350 },
      { category: "Suite Panoramique", price: 3200 }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1468413253980-75fec7c44d6f?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1559628233-100c798642d9?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "ce-danube-01",
    provider: "CroisiEurope",
    name: "Magie du Danube — Vienne à Budapest",
    ship: "MS Michelangelo",
    destination: "Danube",
    continent: "Europe",
    departureDate: "Juillet 2026",
    duration: "8 nuits",
    durationDays: 8,
    price: 2100,
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop",
    description: "Au fil du Danube, traversez les grandes capitales de l'Europe centrale. De Vienne impériale à Budapest fastueuse, en passant par Bratislava et les méandres du fleuve, un voyage au cœur de l'histoire.",
    itinerary: ["Vienne", "Bratislava", "Budapest", "Kalocsa", "Mohács", "Budapest"],
    itineraryDetailed: [
      { day: 1, port: "Vienne", description: "Embarquement dans la capitale impériale. Opéra et Ringstrasse." },
      { day: 2, port: "Bratislava", description: "La capitale slovaque et son château médiéval." },
      { day: 3, port: "Budapest", description: "La reine du Danube, Buda et Pest, parlement et thermes." },
      { day: 5, port: "Kalocsa", description: "La capitale hongroise du paprika et de la broderie." },
      { day: 8, port: "Budapest", description: "Débarquement au cœur de Budapest." }
    ],
    cabins: [
      { category: "Cabine Standard", price: 2100 },
      { category: "Cabine Supérieure", price: 2650 },
      { category: "Suite Panoramique", price: 3600 }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1558610070-5e1655d3e8b8?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560969184-10fe8719e047?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1551918120-9739cb430c6d?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "an-poly-01",
    provider: "Ara Nui",
    name: "Polynésie Française — Marquises & Tuamotu",
    ship: "Aranui 5",
    destination: "Polynésie",
    continent: "Asie-Pacifique",
    departureDate: "Septembre 2026",
    duration: "14 nuits",
    durationDays: 14,
    price: 5900,
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?q=80&w=1200&auto=format&fit=crop",
    description: "À bord de l'unique cargo-croisière Aranui 5, vivez l'expérience authentique des Marquises. Accostez dans des baies inaccessibles aux grands paquebots, rencontrez artisans et sculpteurs locaux.",
    itinerary: ["Papeete", "Nuku Hiva", "Ua Pou", "Hiva Oa", "Fatu Hiva", "Rangiroa", "Papeete"],
    itineraryDetailed: [
      { day: 1, port: "Papeete", description: "Embarquement au port de Papeete." },
      { day: 3, port: "Nuku Hiva", description: "Capitale des Marquises, vallée de Taipivai de Herman Melville." },
      { day: 5, port: "Ua Pou", description: "Aiguilles volcaniques spectaculaires et artisanat local." },
      { day: 7, port: "Hiva Oa", description: "Tombe de Paul Gauguin et Jacques Brel, tikis géants." },
      { day: 9, port: "Fatu Hiva", description: "La plus belle baie des Marquises, sculpture sur bois." },
      { day: 12, port: "Rangiroa", description: "Lagon de l'atoll, plongée avec raies mantas et requins." },
      { day: 14, port: "Papeete", description: "Débarquement." }
    ],
    cabins: [
      { category: "Cabine Touriste", price: 5900 },
      { category: "Cabine Confort", price: 7500 },
      { category: "Suite Deluxe", price: 12000 }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1544211107-df1600c5c4e9?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1567139537450-f8bdf413ef5a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "costa-med-01",
    provider: "Costa",
    name: "Méditerranée Occidentale — Ibiza & Baléares",
    ship: "Costa Magica",
    destination: "Espagne & France",
    continent: "Europe",
    departureDate: "Juillet 2026",
    duration: "7 nuits",
    durationDays: 7,
    price: 1650,
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=1200&auto=format&fit=crop",
    description: "Naviguez à bord du Costa Magica le long des côtes ensoleillées d'Espagne et de France. Profitez des plages de sable d'Ibiza, des criques secrètes de Majorque et du charme de Barcelone.",
    itinerary: ["Barcelone", "Ibiza", "Palma de Majorque", "Mahon (Minorque)", "Marseille", "Barcelone"],
    itineraryDetailed: [
      { day: 1, port: "Barcelone", description: "Embarquement. Ramblas et Sagrada Familia." },
      { day: 2, port: "Ibiza", description: "Dalt Vila et couchés de soleil mythiques." },
      { day: 3, port: "Palma de Majorque", description: "Cathédrale, Bellver et Serra de Tramuntana UNESCO." },
      { day: 4, port: "Mahon", description: "Gin local et port naturel de Minorque." },
      { day: 5, port: "Marseille", description: "Le Vieux-Port et les Calanques." },
      { day: 7, port: "Barcelone", description: "Débarquement." }
    ],
    cabins: [
      { category: "Cabine Intérieure", price: 1650 },
      { category: "Cabine Vue Mer", price: 2200 },
      { category: "Suite", price: 4100 }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1564421994-9e5e6a5c1b5a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1571899981867-c9f2d23bb720?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1529254866403-47b83fa24e2f?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "sc-indian-01",
    provider: "Star Clippers",
    name: "Joyaux de l'Océan Indien — Seychelles",
    ship: "Star Flyer",
    destination: "Seychelles",
    continent: "Afrique",
    departureDate: "Janvier 2026",
    duration: "11 nuits",
    durationDays: 11,
    price: 4200,
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=1200&auto=format&fit=crop",
    description: "Découvrez les Seychelles à bord du Star Flyer, navigant vers des plages de rêve aux rochers de granit rose. Un archipel préservé, paradis des tortues géantes et des raies manta.",
    itinerary: ["Mahé", "Praslin", "La Digue", "Bird Island", "Denis Island", "Mahé"],
    itineraryDetailed: [
      { day: 1, port: "Mahé", description: "Embarquement. Victoria et son marché coloré." },
      { day: 3, port: "Praslin", description: "Vallée de Mai UNESCO, coco de mer géants." },
      { day: 5, port: "La Digue", description: "Anse Source d'Argent, élue plus belle plage du monde." },
      { day: 7, port: "Bird Island", description: "Réserve naturelle, nidification des tortues marines." },
      { day: 9, port: "Denis Island", description: "Île privée, plongée et récifs coralliens." },
      { day: 11, port: "Mahé", description: "Débarquement." }
    ],
    cabins: [
      { category: "Cabine Intérieure", price: 4200 },
      { category: "Cabine Extérieure", price: 5400 },
      { category: "Suite Owner", price: 9500 }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1588596096936-4f3f46f3ba27?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1569049690075-5e96a1e06f1d?q=80&w=800&auto=format&fit=crop"
    ]
  }
];

app.get('/api/cruises', async (req, res) => {
  let allCruises = cache.get('all_cruises');

  if (!allCruises) {
    // In production: fetch from real provider URLs and normalize
    // For now: serve the rich mock dataset
    allCruises = MOCK_CRUISES;
    cache.set('all_cruises', allCruises);

    // Update sync status for all active providers
    const providers = getProviders();
    const providerNames = [...new Set(MOCK_CRUISES.map(c => c.provider))];
    providers.forEach(p => {
      if (providerNames.some(name => name.toLowerCase().includes(p.name.split(' ')[0].toLowerCase()))) {
        p.lastSync = new Date().toISOString();
        p.count = MOCK_CRUISES.filter(c => c.provider === p.name).length;
      }
    });
    saveProviders(providers);
  }

  res.json(allCruises);
});

app.get('/api/admin/providers', (req, res) => {
  res.json(getProviders());
});

app.post('/api/admin/providers', (req, res) => {
  const { password } = req.headers;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const providers = getProviders();
  const newProvider = { ...req.body, lastSync: null, count: 0 };
  providers.push(newProvider);
  saveProviders(providers);
  res.json(newProvider);
});

app.post('/api/admin/cache/refresh', (req, res) => {
  const { password } = req.headers;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const { providerId } = req.body;
  if (providerId) {
    cache.del(`cruises_${providerId}`);
  } else {
    cache.flushAll();
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

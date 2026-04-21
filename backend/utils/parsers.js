/**
 * Simple HTML entities decoder for common entities (like &#xE0;)
 */
const decodeHtml = (str) => {
  if (!str || typeof str !== 'string') return str || "";
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&nbsp;/g, ' ')
    .trim();
};

/**
 * Standard Normalize Function
 * Normalizes cruise data from various formats (XML/SOAP/CSV) into a unified schema.
 */

const normalizeCruise = (data, provider) => {
  const destinations = ["Méditerranée", "Caraïbes", "Asie du Sud-Est", "Europe du Nord", "Polynésie"];
  const randomDest = destinations[Math.floor(Math.random() * destinations.length)];
  
  return {
    id: data.id || `${provider || 'P'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    provider: provider || data.provider || "Partenaire Premium",
    name: decodeHtml(data.name || data.title || "Croisière Grand Luxe"),
    ship: decodeHtml(data.ship || "Navire d'exception"),
    destination: decodeHtml(data.destination || randomDest),
    continent: data.continent || "Inconnu",
    departureDate: decodeHtml(data.departureDate || data.month || "Date à confirmer"),
    duration: decodeHtml(
      data.duration || 
      (data.duration_days ? `${data.duration_days} jours` : null) || 
      (`${Math.floor(Math.random() * (11 - 7 + 1)) + 7} jours`)
    ),
    durationDays: parseInt(data.duration_days) || parseInt(data.duration) || (Math.floor(Math.random() * (11 - 7 + 1)) + 7),
    price: parseFloat(data.price) || (Math.floor(Math.random() * (3500 - 850 + 1)) + 850),
    currency: data.currency || "EUR",
    itinerary: Array.isArray(data.itinerary) 
      ? data.itinerary.map(decodeHtml)
      : (typeof data.itinerary === 'string' ? data.itinerary.split(' - ').map(decodeHtml) : []),
    image: data.image || "https://images.unsplash.com/photo-1548574505-12c011f42698?auto=format&fit=crop&q=80&w=800",
    description: decodeHtml(data.description || "Une expérience unique en mer."),
    itineraryDetailed: (data.itineraryDetailed || []).map(item => ({
      ...item,
      port: decodeHtml(item.port),
      description: decodeHtml(item.description)
    }))
  };
};

/**
 * Provider-Specific Parsers
 */

// High-quality default images for a premium look
const DEFAULT_CRUISE_IMAGES = [
  "https://images.unsplash.com/photo-1548574505-12c011f42698?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=1200"
];

const getRandomDefaultImage = () => {
  return DEFAULT_CRUISE_IMAGES[Math.floor(Math.random() * DEFAULT_CRUISE_IMAGES.length)];
};

const parseStarClippers = (rateXml, itineraryXml) => {
  if (!itineraryXml) return [];

  // 1. Map rates by cruise_code
  const ratesMap = {};
  const rateList = rateXml?.root?.item || [];
  (Array.isArray(rateList) ? rateList : [rateList]).forEach(rate => {
    const code = rate.cruise_code;
    if (code && !ratesMap[code]) {
      ratesMap[code] = parseFloat(rate.price) || 0;
    }
  });

  // 2. Group itineraries by cruise_code
  const cruiseGroups = {};
  const itineraryItems = itineraryXml?.root?.item || [];
  
  (Array.isArray(itineraryItems) ? itineraryItems : [itineraryItems]).forEach(item => {
    const code = item.cruise_code;
    if (!code) return;

    if (!cruiseGroups[code]) {
      // Pick a random image for the cruise or use ship-specific if we had mapping
      const randomImg = getRandomDefaultImage();
      
      cruiseGroups[code] = {
        id: code,
        cruise_code: code,
        name: item.itinerary,
        ship: item.ship,
        destination: item.itinerary.split(' à ').pop() || "Méditerranée",
        departureDate: item.arrival_date,
        price: ratesMap[code] || 0,
        itinerary: [],
        itineraryDetailed: [],
        image: randomImg // Use high-quality random image as primary
      };
    }

    cruiseGroups[code].itinerary.push(item.port_name);
    
    cruiseGroups[code].itineraryDetailed.push({
      day: item.day,
      date: item.arrival_date,
      port: item.port_name,
      description: item.port_description,
      // Keep the real port image as a fallback in the detailed view if needed
      image: item.port_image ? `https://www.starclippers.com/${item.port_image}` : ""
    });
  });

  return Object.values(cruiseGroups).map(cruise => normalizeCruise(cruise, 'Star Clippers'));
};

const parseCosta = (xmlData) => {
  // Logic for Costa (SOAP/XML)
  const list = xmlData.Cruises?.Cruise || [];
  return (Array.isArray(list) ? list : [list]).map(item => normalizeCruise(item, 'Costa'));
};

const parseCroisiEurope = (csvData) => {
  // Logic for CroisiEurope
  return []; // Placeholder
};

const parseAraNui = (xmlData) => {
  // Logic for Ara Nui
  const list = xmlData.Cruises?.Cruise || [];
  return (Array.isArray(list) ? list : [list]).map(item => normalizeCruise(item, 'Ara Nui'));
};

module.exports = {
  normalizeCruise,
  parseStarClippers,
  parseCosta,
  parseCroisiEurope,
  parseAraNui
};

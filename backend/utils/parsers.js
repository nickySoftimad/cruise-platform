/**
 * Standard Normalize Function
 * Normalizes cruise data from various formats (XML/SOAP/CSV) into a unified schema.
 */

const normalizeCruise = (data, provider) => {
  return {
    id: data.id || `${provider}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    provider: provider,
    name: data.name || data.title || "Croisière sans titre",
    ship: data.ship || "Navire inconnu",
    destination: data.destination || "Destination non spécifiée",
    continent: data.continent || "Inconnu",
    departureDate: data.departureDate || data.month || "Date à confirmer",
    duration: data.duration || `${data.duration_days} jours` || "Durée inconnue",
    durationDays: data.duration_days || parseInt(data.duration) || 0,
    price: parseFloat(data.price) || 0,
    currency: data.currency || "EUR",
    itinerary: Array.isArray(data.itinerary) 
      ? data.itinerary 
      : (typeof data.itinerary === 'string' ? data.itinerary.split(' - ') : []),
    image: data.image || "https://images.unsplash.com/photo-1548574505-12c011f42698?auto=format&fit=crop&q=80&w=800",
    description: data.description || "Une expérience unique en mer.",
    itineraryDetailed: data.itineraryDetailed || [] // Day-by-day program
  };
};

/**
 * Provider-Specific Parsers
 */

const parseStarClippers = (xmlData) => {
  // Logic to parse Star Clippers XML
  // Using fast-xml-parser output...
  return (xmlData.Cruises?.Cruise || []).map(item => normalizeCruise(item, 'Star Clippers'));
};

const parseCosta = (xmlData) => {
  // Logic for Costa (SOAP/XML)
  return (xmlData.Cruises?.Cruise || []).map(item => normalizeCruise(item, 'Costa'));
};

const parseCroisiEurope = (csvData) => {
  // Logic for CroisiEurope
  return []; // Placeholder
};

const parseAraNui = (xmlData) => {
  // Logic for Ara Nui
  return []; // Placeholder
};

module.exports = {
  normalizeCruise,
  parseStarClippers,
  parseCosta,
  parseCroisiEurope,
  parseAraNui
};

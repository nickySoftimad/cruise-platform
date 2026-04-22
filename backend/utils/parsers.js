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
  return {
    id: data.id || data.externalId,
    provider: provider || data.provider || "Non spécifié",
    name: decodeHtml(data.name || data.title || "Sans titre"),
    ship: decodeHtml(data.ship || "Navire non spécifié"),
    destination: decodeHtml(data.destination || "Destination à confirmer"),
    continent: data.continent || "Inconnu",
    departureDate: decodeHtml(data.departureDate || data.month || "Date à confirmer"),
    duration: decodeHtml(
      data.duration || 
      (data.duration_days ? `${data.duration_days} jours` : null) || 
      "Durée à confirmer"
    ),
    durationDays: parseInt(data.duration_days) || parseInt(data.duration) || 0,
    price: parseFloat(data.price) || 0,
    currency: data.currency || "EUR",
    itinerary: Array.isArray(data.itinerary) 
      ? data.itinerary.map(decodeHtml)
      : (typeof data.itinerary === 'string' ? data.itinerary.split(' - ').map(decodeHtml) : []),
    image: data.image || "https://images.unsplash.com/photo-1548574505-12c011f42698?auto=format&fit=crop&q=80&w=800",
    itineraryMap: data.itineraryMap || "",
    description: decodeHtml(data.description || ""),
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

// High-quality default images for a premium look if provider doesn't have one
const DEFAULT_CRUISE_IMAGE = "https://images.unsplash.com/photo-1599640842225-85d111c60e6b?auto=format&fit=crop&q=80&w=1200";

const parseStarClippers = (rateXml, itineraryXml) => {
  if (!rateXml || !itineraryXml) {
    console.warn('parseStarClippers: Missing rate or itinerary data');
    return [];
  }

  // Handle potential variations in XML structure (e.g. root.item vs just root if single item)
  const rateList = Array.isArray(rateXml.item) ? rateXml.item : (rateXml.item ? [rateXml.item] : []);
  const itineraryItems = Array.isArray(itineraryXml.item) ? itineraryXml.item : (itineraryXml.item ? [itineraryXml.item] : []);

  const cruiseDataMap = {};
  
  // 1. Group rates by cruise_code and pick lowest price
  rateList.forEach(row => {
    const code = row.cruise_code;
    if (!code) return;

    const price = parseFloat(row.brochure_price) || 0;
    
    if (!cruiseDataMap[code]) {
      cruiseDataMap[code] = {
        id: code,
        externalId: code,
        name: decodeHtml(row.itinerary),
        ship: decodeHtml(row.ship),
        destination: decodeHtml(row.destination) || "Méditerranée",
        continent: "Europe", 
        departureDate: row.sdate,
        duration_days: parseInt(row.nights),
        price: price,
        itinerary: [],
        itineraryDetailed: [],
        cabins: [],
        image: DEFAULT_CRUISE_IMAGE
      };
    } else {
      // Keep cheapest price if multiple categories exist for the same cruise code
      if (price > 0 && (cruiseDataMap[code].price === 0 || price < cruiseDataMap[code].price)) {
        cruiseDataMap[code].price = price;
      }
    }

    // Add cabin category
    if (row.cabin_grade && price > 0) {
      cruiseDataMap[code].cabins.push({
        category: decodeHtml(row.cabin_grade),
        price: price
      });
    }
  });

  // 2. Map itineraries and images to cruises using cruise_code as link
  itineraryItems.forEach(row => {
    const code = row.cruise_code;
    const cruise = cruiseDataMap[code];
    
    if (cruise) {
      if (row.port_name && !cruise.itinerary.includes(row.port_name)) {
        cruise.itinerary.push(decodeHtml(row.port_name));
      }
      
      // Update cruise name if it's currently generic
      if (row.itinerary && (!cruise.name || cruise.name === "Croisière Grand Luxe")) {
        cruise.name = decodeHtml(row.itinerary);
      }

      // Prefix relative image paths with starclippers.com
      const prefixUrl = (path) => {
        if (!path || typeof path !== 'string') return "";
        if (path.startsWith('http')) return path;
        return `https://www.starclippers.com/${path.startsWith('/') ? path.substring(1) : path}`;
      };

      // Priority for the main cruise image:
      // 1. itinerary_image
      // 2. port_image (of any port found)
      // 3. itinerary_map
      if (row.itinerary_image) {
        cruise.image = prefixUrl(row.itinerary_image);
      } else if (row.port_image && (!cruise.image || cruise.image.includes('unsplash'))) {
        cruise.image = prefixUrl(row.port_image);
      } else if (row.itinerary_map && (!cruise.image || cruise.image.includes('unsplash'))) {
        cruise.image = prefixUrl(row.itinerary_map);
      }

      // Save the map image explicitly too
      if (row.itinerary_map && !cruise.itineraryMap) {
        cruise.itineraryMap = prefixUrl(row.itinerary_map);
      }
      
      // Check if this port detail already added
      const isDuplicate = cruise.itineraryDetailed.some(d => d.port === row.port_name && d.dayName === row.day);
      
      if (!isDuplicate) {
        cruise.itineraryDetailed.push({
          day: cruise.itineraryDetailed.length + 1,
          dayName: row.day,
          port: decodeHtml(row.port_name),
          description: decodeHtml(row.port_description),
          image: prefixUrl(row.port_image)
        });
      }
    }
  });

  return Object.values(cruiseDataMap).map(cruise => normalizeCruise(cruise, 'Star Clippers'));
};

const parseStarClippersCSV = (ratesJson, itinerariesJson) => {
  if (!ratesJson || !itinerariesJson) return [];

  // 1. Group rates and pick lowest price per cruise_code
  const cruiseDataMap = {};
  
  ratesJson.forEach(row => {
    const code = row.cruise_code;
    if (!code) return;

    const price = parseFloat(row.brochure_price) || 0;
    
    if (!cruiseDataMap[code]) {
      cruiseDataMap[code] = {
        id: code,
        name: row.itinerary,
        ship: row.ship,
        destination: row.destination || "Méditerranée",
        continent: row.region || "Europe",
        departureDate: row.sdate,
        duration_days: parseInt(row.nights),
        price: price,
        itinerary: [],
        itineraryDetailed: [],
        cabins: [],
        image: DEFAULT_CRUISE_IMAGE
      };
    } else {
      // Keep cheapest price
      if (price > 0 && (cruiseDataMap[code].price === 0 || price < cruiseDataMap[code].price)) {
        cruiseDataMap[code].price = price;
      }
    }

    // Add cabin category
    if (row.cabin_grade && price > 0) {
      cruiseDataMap[code].cabins.push({
        category: row.cabin_grade,
        price: price
      });
    }
  });

  // 2. Map itineraries and images to cruises
  itinerariesJson.forEach(row => {
    const code = row.cruise_code;
    const cruise = cruiseDataMap[code];
    if (cruise) {
      if (row.port_name && !cruise.itinerary.includes(row.port_name)) {
        cruise.itinerary.push(row.port_name);
      }
      
      // Update cruise name if it's currently generic and CSV has a better one
      if (row.itinerary && (!cruise.name || cruise.name === "Croisière Grand Luxe")) {
        cruise.name = row.itinerary;
      }

      // Use itinerary_image as the main cruise image if available
      if (row.itinerary_image && (!cruise.image || cruise.image.includes('unsplash'))) {
        cruise.image = `https://www.starclippers.com/${row.itinerary_image}`;
      }

      // Save the map image
      if (row.itinerary_map && !cruise.itineraryMap) {
        cruise.itineraryMap = `https://www.starclippers.com/${row.itinerary_map}`;
      }
      
      cruise.itineraryDetailed.push({
        day: parseInt(row.day) || cruise.itineraryDetailed.length + 1,
        port: row.port_name,
        description: row.port_description,
        image: row.port_image ? `https://www.starclippers.com/${row.port_image}` : ""
      });
    }
  });

  return Object.values(cruiseDataMap).map(cruise => normalizeCruise(cruise, 'Star Clippers'));
};

const parseCosta = (xmlData) => {
  // Logic for Costa (SOAP/XML)
  const list = xmlData.Cruises?.Cruise || [];
  return (Array.isArray(list) ? list : [list]).map(item => normalizeCruise(item, 'Costa'));
};

const parseCroisiEurope = (csvData) => {
  if (!csvData) return [];
  
  // Basic CSV parsing for CroisiEurope
  // Expected format: id;name;ship;destination;continent;departureDate;duration;price;image;description
  const lines = csvData.split('\n');
  const cruises = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const [id, name, ship, destination, continent, departureDate, duration, price, image, description] = line.split(';');
    
    cruises.push(normalizeCruise({
      id,
      name,
      ship,
      destination,
      continent,
      departureDate,
      duration,
      price: parseFloat(price),
      image,
      description
    }, 'CroisiEurope'));
  }
  
  return cruises;
};

const parseAraNui = (xmlData) => {
  // Logic for Ara Nui
  const list = xmlData.Cruises?.Cruise || [];
  return (Array.isArray(list) ? list : [list]).map(item => normalizeCruise(item, 'Ara Nui'));
};

module.exports = {
  normalizeCruise,
  parseStarClippers,
  parseStarClippersCSV,
  parseCosta,
  parseCroisiEurope,
  parseAraNui
};

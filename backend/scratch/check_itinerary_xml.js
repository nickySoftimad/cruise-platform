const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
require('dotenv').config();

const ACCESS_TOKEN = process.env.STAR_CLIPPERS_TOKEN || '1234';
const STAR_CLIPPERS_ITINERARY_URL = `https://www.starclippers.com/accessdata/itenary_fr.xml?access_token=${ACCESS_TOKEN}`;

async function checkItineraryXML() {
  try {
    const itinerRes = await axios.get(STAR_CLIPPERS_ITINERARY_URL);
    const parser = new XMLParser({ ignoreAttributes: false });
    const itinerParsed = parser.parse(itinerRes.data);
    const item = Array.isArray(itinerParsed.root.item) ? itinerParsed.root.item[0] : itinerParsed.root.item;
    console.log(JSON.stringify(item, null, 2));
  } catch (err) {
    console.error(err);
  }
}

checkItineraryXML();

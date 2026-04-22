require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const Cruise = require('../models/Cruise');
const Provider = require('../models/Provider');
const { parseStarClippers } = require('../utils/parsers');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cruise-platform';
const ACCESS_TOKEN = process.env.STAR_CLIPPERS_TOKEN || '1234';

const STAR_CLIPPERS_RATE_URL = `https://www.starclippers.com/accessdata/rate_fr.xml?access_token=${ACCESS_TOKEN}`;
const STAR_CLIPPERS_ITINERARY_URL = `https://www.starclippers.com/accessdata/itenary_fr.xml?access_token=${ACCESS_TOKEN}`;

async function syncStarClippers() {
  const isDirectRun = require.main === module;
  try {
    if (isDirectRun) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(MONGODB_URI);
      console.log('Connected.');
    }

    console.log('Fetching Star Clippers XML data...');
    const [rateRes, itinerRes] = await Promise.all([
      axios.get(STAR_CLIPPERS_RATE_URL),
      axios.get(STAR_CLIPPERS_ITINERARY_URL)
    ]);

    console.log('Parsing XML data...');
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

    // Handle potential root-level tags in XML
    const ratesParsed = parser.parse(rateRes.data);
    const itinerParsed = parser.parse(itinerRes.data);

    // Star Clippers XML usually has a root like <rss> or nothing if it's just raw <item> list (unlikely)
    // Based on user snippet, it's a list of <item>
    // We'll normalize the input to the parser function which expects { item: [...] }
    const ratesData = ratesParsed.root || ratesParsed;
    const itinerData = itinerParsed.root || itinerParsed;

    console.log('Normalized XML to JS objects.');

    const normalizedCruises = parseStarClippers(ratesData, itinerData);
    console.log(`Normalized into ${normalizedCruises.length} unique cruises.`);

    if (normalizedCruises.length === 0) {
      console.warn('No cruises found to sync. Check XML structure or URLs.');
    }

    console.log('Upserting cruises into database...');
    let count = 0;
    for (const cruise of normalizedCruises) {
      await Cruise.findOneAndUpdate(
        { externalId: cruise.id, provider: 'Star Clippers' },
        { ...cruise, externalId: cruise.id, provider: 'Star Clippers' },
        { upsert: true, returnDocument: 'after' }
      );
      count++;
    }

    // Update provider status
    await Provider.findOneAndUpdate(
      { id: 'starclippers' },
      { 
        name: 'Star Clippers',
        type: 'xml',
        enabled: true,
        lastSync: new Date(),
        count: count
      },
      { upsert: true }
    );

    console.log(`Successfully synced ${count} Star Clippers cruises.`);
    if (isDirectRun) process.exit(0);
    return count;
  } catch (error) {
    console.error('Error syncing Star Clippers:', error.message);
    if (isDirectRun) process.exit(1);
    throw error;
  }
}

if (require.main === module) {
  syncStarClippers();
}

module.exports = syncStarClippers;

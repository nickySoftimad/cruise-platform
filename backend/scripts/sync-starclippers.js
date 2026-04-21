require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const { parse } = require('csv-parse/sync');
const Cruise = require('../models/Cruise');
const Provider = require('../models/Provider');
const { parseStarClippersCSV } = require('../utils/parsers');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cruise-platform';

const STAR_CLIPPERS_RATE_URL = 'https://www.starclippers.com/accessdata/rate_fr.csv?access_token=1234';
const STAR_CLIPPERS_ITINERARY_URL = 'https://www.starclippers.com/accessdata/itenary_fr.csv?access_token=1234';

async function syncStarClippers() {
  const isDirectRun = require.main === module;
  try {
    if (isDirectRun) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(MONGODB_URI);
      console.log('Connected.');
    }

    console.log('Fetching Star Clippers CSV data...');
    const [rateRes, itinerRes] = await Promise.all([
      axios.get(STAR_CLIPPERS_RATE_URL),
      axios.get(STAR_CLIPPERS_ITINERARY_URL)
    ]);

    console.log('Parsing CSV data...');
    const ratesJson = parse(rateRes.data, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });
    
    const itinerariesJson = parse(itinerRes.data, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });

    // DEBUG: Log headers to see exact column names
    if (ratesJson.length > 0) {
      console.log('Rate CSV Headers:', Object.keys(ratesJson[0]).join(', '));
    }
    if (itinerariesJson.length > 0) {
      console.log('Itinerary CSV Headers:', Object.keys(itinerariesJson[0]).join(', '));
    }

    console.log(`Found ${ratesJson.length} rate rows and ${itinerariesJson.length} itinerary rows.`);

    const normalizedCruises = parseStarClippersCSV(ratesJson, itinerariesJson);
    console.log(`Normalized into ${normalizedCruises.length} unique cruises.`);

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
        type: 'csv',
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

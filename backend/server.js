require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const mongoose = require('mongoose');
const { parseStarClippers, parseCosta, parseCroisiEurope, parseAraNui } = require('./utils/parsers');
const cron = require('node-cron');
const syncStarClippers = require('./scripts/sync-starclippers');

// Models
const Provider = require('./models/Provider');
const Cruise = require('./models/Cruise');

const app = express();
const PORT = process.env.PORT || 4000;
const xmlParser = new XMLParser({ ignoreAttributes: false });

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cruise-platform';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// CORS
const allowedOrigin = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'password']
}));
app.use(express.json());

// Helper to update provider stats
const updateProviderStats = async (providerId, count) => {
  await Provider.findOneAndUpdate(
    { id: providerId },
    { lastSync: new Date(), count: count },
    { returnDocument: 'after' }
  );
};

const syncProviderData = async (provider) => {
  try {
    console.log(`Syncing provider: ${provider.name}...`);
    let rawCruises = [];
    
    if (provider.id === 'starclippers') {
      const [rateRes, itineraryRes] = await Promise.all([
        axios.get(provider.rateUrl, { timeout: 10000 }),
        axios.get(provider.itineraryUrl, { timeout: 10000 })
      ]);
      if (!rateRes.data || !itineraryRes.data) throw new Error('Data empty');
      const rateObj = xmlParser.parse(rateRes.data);
      const itineraryObj = xmlParser.parse(itineraryRes.data);
      rawCruises = parseStarClippers(rateObj, itineraryObj);
    } else {
      if (!provider.url) return 0;
      const response = await axios.get(provider.url, { timeout: 10000 });
      if (!response.data) throw new Error('Data empty');
      
      if (provider.type === 'xml') {
        const xmlObj = xmlParser.parse(response.data);
        if (provider.id === 'costa') rawCruises = parseCosta(xmlObj);
        if (provider.id === 'aranui') rawCruises = parseAraNui(xmlObj);
      } else if (provider.type === 'csv') {
        rawCruises = parseCroisiEurope(response.data);
      }
    }

    // Save/Update in MongoDB
    if (rawCruises.length > 0) {
      for (const cruiseData of rawCruises) {
        await Cruise.findOneAndUpdate(
          { externalId: cruiseData.id || cruiseData.externalId, provider: provider.id },
          { ...cruiseData, externalId: cruiseData.id || cruiseData.externalId, provider: provider.id },
          { upsert: true, returnDocument: 'after' }
        );
      }
    }
    
    return rawCruises.length;
  } catch (error) {
    console.error(`Error syncing ${provider.name}:`, error.message);
    throw error; // Let caller handle the UI/Log response
  }
};

// Routes
app.get('/api/cruises', async (req, res) => {
  try {
    // Optimization: Don't send detailed itinerary in the listing to save bandwidth
    let cruises = await Cruise.find({}, { itineraryDetailed: 0, cabins: 0, gallery: 0 }).sort({ departureDate: 1 });

    // If DB is empty, maybe try to sync
    if (cruises.length === 0) {
      const providers = await Provider.find({ enabled: true });
      if (providers.length > 0) {
        console.log("No cruises in DB. Triggering initial sync...");
        await Promise.all(providers.map(p => syncProviderData(p)));
        cruises = await Cruise.find({}, { itineraryDetailed: 0, cabins: 0, gallery: 0 }).sort({ departureDate: 1 });
      }
    }

    res.json(cruises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single cruise with full details
app.get('/api/cruises/:id', async (req, res) => {
  try {
    const cruise = await Cruise.findById(req.params.id);
    if (!cruise) {
      // Try to find by externalId if not found by MongoDB ID
      const cruiseByExt = await Cruise.findOne({ externalId: req.params.id });
      if (!cruiseByExt) return res.status(404).json({ error: 'Cruise not found' });
      return res.json(cruiseByExt);
    }
    res.json(cruise);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/providers', async (req, res) => {
  try {
    const providers = await Provider.find();
    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/providers', async (req, res) => {
  const { password } = req.headers;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const newProvider = new Provider(req.body);
    await newProvider.save();
    res.json(newProvider);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/providers/:id/toggle', async (req, res) => {
  const { password } = req.headers;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const provider = await Provider.findOne({ id: req.params.id });
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    
    provider.enabled = !provider.enabled;
    await provider.save();
    res.json(provider);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/providers/:id', async (req, res) => {
  const { password } = req.headers;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const provider = await Provider.findOneAndDelete({ id: req.params.id });
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    
    // Optional: Delete all associated cruises
    await Cruise.deleteMany({ provider: req.params.id });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/admin/test-connection', async (req, res) => {
  const { password } = req.headers;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const { url, rateUrl, itineraryUrl, type, id } = req.body;
  try {
    let result = { success: false, count: 0 };
    if (id === 'starclippers') {
      const [rateRes, itineraryRes] = await Promise.all([
        axios.get(rateUrl, { timeout: 5000 }),
        axios.get(itineraryUrl, { timeout: 5000 })
      ]);
      const rateObj = xmlParser.parse(rateRes.data);
      const itineraryObj = xmlParser.parse(itineraryRes.data);
      const cruises = parseStarClippers(rateObj, itineraryObj);
      result = { success: true, count: cruises.length };
    } else {
      const response = await axios.get(url, { timeout: 5000 });
      if (type === 'xml') {
        const xmlObj = xmlParser.parse(response.data);
        let cruises = [];
        if (id === 'costa') cruises = parseCosta(xmlObj);
        else if (id === 'aranui') cruises = parseAraNui(xmlObj);
        else cruises = [1]; // Just to signal it works if custom
        result = { success: true, count: cruises.length };
      } else if (type === 'csv') {
        const cruises = parseCroisiEurope(response.data);
        result = { success: true, count: cruises.length };
      }
    }
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/cache/refresh', async (req, res) => {
  const { password } = req.headers;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const { providerId } = req.body;
  const errors = [];
  try {
    if (providerId) {
      const provider = await Provider.findOne({ id: providerId });
      if (provider) {
        try {
          const count = await syncProviderData(provider);
          await updateProviderStats(providerId, count);
        } catch (e) {
          errors.push({ provider: providerId, error: e.message });
        }
      }
    } else {
      const providers = await Provider.find({ enabled: true });
      for (const p of providers) {
        try {
          const count = await syncProviderData(p);
          await updateProviderStats(p.id, count);
        } catch (e) {
          errors.push({ provider: p.id, error: e.message });
        }
      }
    }
    res.json({ success: errors.length === 0, errors: errors.length > 0 ? errors : null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  
  // Initial sync on startup if Star Clippers data is missing
  try {
    const starClippersCount = await Cruise.countDocuments({ provider: 'Star Clippers' });
    if (starClippersCount === 0) {
      console.log('No Star Clippers data found. Running initial sync...');
      await syncStarClippers();
    }
  } catch (error) {
    console.error('Initial sync error:', error.message);
  }

  // Schedule daily sync at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('Running daily scheduled synchronization...');
    try {
      await syncStarClippers();
      console.log('Daily sync completed successfully.');
    } catch (error) {
      console.error('Daily sync failed:', error.message);
    }
  });
});

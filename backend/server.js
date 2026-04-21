require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const mongoose = require('mongoose');
const { parseStarClippers, parseCosta, parseCroisiEurope, parseAraNui } = require('./utils/parsers');

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
    { new: true }
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
      const rateObj = xmlParser.parse(rateRes.data);
      const itineraryObj = xmlParser.parse(itineraryRes.data);
      rawCruises = parseStarClippers(rateObj, itineraryObj);
    } else {
      if (!provider.url) return [];
      const response = await axios.get(provider.url, { timeout: 10000 });
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
          { upsert: true, new: true }
        );
      }
    }
    
    return rawCruises.length;
  } catch (error) {
    console.error(`Error syncing ${provider.name}:`, error.message);
    return 0;
  }
};

// Routes
app.get('/api/cruises', async (req, res) => {
  try {
    let cruises = await Cruise.find().sort({ createdAt: -1 });

    // If DB is empty, maybe try to sync or return something
    if (cruises.length === 0) {
      const providers = await Provider.find({ enabled: true });
      if (providers.length > 0) {
        console.log("No cruises in DB. Triggering initial sync...");
        await Promise.all(providers.map(p => syncProviderData(p)));
        cruises = await Cruise.find().sort({ createdAt: -1 });
      }
    }

    res.json(cruises);
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


app.post('/api/admin/cache/refresh', async (req, res) => {
  const { password } = req.headers;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const { providerId } = req.body;
  try {
    if (providerId) {
      const provider = await Provider.findOne({ id: providerId });
      if (provider) {
        const count = await syncProviderData(provider);
        await updateProviderStats(providerId, count);
      }
    } else {
      const providers = await Provider.find({ enabled: true });
      for (const p of providers) {
        const count = await syncProviderData(p);
        await updateProviderStats(p.id, count);
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

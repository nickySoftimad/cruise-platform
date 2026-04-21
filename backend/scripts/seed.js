require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Provider = require('../models/Provider');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cruise-platform';

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    const providersPath = path.join(__dirname, '../data/providers.json');
    const providers = JSON.parse(fs.readFileSync(providersPath, 'utf8'));

    for (const p of providers) {
      await Provider.findOneAndUpdate(
        { id: p.id },
        p,
        { upsert: true, new: true }
      );
    }

    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();

const mongoose = require('mongoose');
const Provider = require('../models/Provider');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cruise-platform';

async function listProviders() {
  try {
    await mongoose.connect(MONGODB_URI);
    const providers = await Provider.find();
    console.log(JSON.stringify(providers, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listProviders();

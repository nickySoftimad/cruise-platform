const mongoose = require('mongoose');
const Cruise = require('../models/Cruise');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cruise-platform';

async function dumpCruise() {
  try {
    await mongoose.connect(MONGODB_URI);
    const cruise = await Cruise.findOne({ provider: 'Star Clippers' });
    if (cruise) {
      console.log(JSON.stringify(cruise, null, 2));
    } else {
      console.log('No Star Clippers cruise found');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

dumpCruise();

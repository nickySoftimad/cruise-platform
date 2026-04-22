const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
require('dotenv').config();

const ACCESS_TOKEN = process.env.STAR_CLIPPERS_TOKEN || '1234';
const STAR_CLIPPERS_RATE_URL = `https://www.starclippers.com/accessdata/rate_fr.xml?access_token=${ACCESS_TOKEN}`;

async function checkXML() {
  try {
    const rateRes = await axios.get(STAR_CLIPPERS_RATE_URL);
    const parser = new XMLParser({ ignoreAttributes: false });
    const ratesParsed = parser.parse(rateRes.data);
    const item = Array.isArray(ratesParsed.root.item) ? ratesParsed.root.item[0] : ratesParsed.root.item;
    console.log(JSON.stringify(item, null, 2));
  } catch (err) {
    console.error(err);
  }
}

checkXML();

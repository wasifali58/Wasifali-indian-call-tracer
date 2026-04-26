const axios = require('axios');
const cheerio = require('cheerio');

// Target site (calltracer.in) – yehi actual API call hai
const TARGET_URL = 'https://calltracer.in/';
const COUNTRY = 'IN';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,ur-PK;q=0.8,ur;q=0.7',
  'Origin': 'https://calltracer.in',
  'Referer': 'https://calltracer.in/',
  'Content-Type': 'application/x-www-form-urlencoded',
  'DNT': '1',
  'Upgrade-Insecure-Requests': '1'
};

const COOKIE_STRING = '_ga=GA1.1.1110953256.1776689959; __gads=ID=4435b799c6bbcb67:T=1776689964:RT=1777199226:S=ALNI_MYlCqtpUH6u7vGDd6HQqflEemsHkQ; __gpi=UID=000013d6d640cde4:T=1776689964:RT=1777199226:S=ALNI_MbLED_wSPG3zVbrg_KB6pcpAOT2Cw; __eoi=ID=e6907e3b0e566f3d:T=1776689964:RT=1777199226:S=AA-AfjY8LYO6w4lRu4h9I1XWrp7_; FCCDCF=%5Bnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5B32%2C%22%5B%5C%22ba590a17-84cb-4642-9dc6-b011f73a0469%5C%22%2C%5B1776689973%2C113000000%5D%5D%22%5D%5D%5D; FCNEC=%5B%5B%22AKsRol-x1P2u6n-oAmI2ZKJmtj6Xv2ekJSsBxc6TuBQBaKX2XIpUXXe60auRouh76u7-4sPHK93974xB4lowtPJG1TTn-volSR0iaqKLGhkSTdUDuA2nILEAUkOd7CtGXi-LbchSTI3LR_Qfte7lAlewzzBj4sFylA%3D%3D%22%5D%5D; _ga_DCWW185VG5=GS2.1.s1777199128$o2$g1$t1777199982$j60$l0$h0';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { number } = req.method === 'GET' ? req.query : req.body;

  if (!number) {
    return res.send(JSON.stringify({
      success: false,
      message: '❌ Please provide an Indian mobile number. Example: /Calltrace?number=9876543210',
      developer: 'WASIF ALI',
      telegram: '@FREEHACKS95'
    }, null, 2));
  }

  const cleanNumber = number.replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    return res.send(JSON.stringify({
      success: false,
      message: '❌ Invalid Indian number (min 10 digits)',
      developer: 'WASIF ALI',
      telegram: '@FREEHACKS95'
    }, null, 2));
  }

  try {
    // YAHI HAI ACTUAL API CALL – calltracer.in ko POST karte hain
    const formData = new URLSearchParams();
    formData.append('country', COUNTRY);
    formData.append('q', cleanNumber);

    const response = await axios.post(TARGET_URL, formData.toString(), {
      headers: {
        ...DEFAULT_HEADERS,
        'Cookie': COOKIE_STRING,
        'Content-Length': Buffer.byteLength(formData.toString())
      },
      timeout: 20000
    });

    const html = response.data;
    const data = parseIndianData(html, cleanNumber);

    return res.send(JSON.stringify({
      success: true,
      message: '✅ Indian number traced successfully',
      data,
      developer: 'WASIF ALI',
      telegram: '@FREEHACKS95'
    }, null, 2));

  } catch (error) {
    return res.send(JSON.stringify({
      success: false,
      message: '❌ Trace failed (site blocking or cookies expired)',
      error: error.message,
      developer: 'WASIF ALI',
      telegram: '@FREEHACKS95'
    }, null, 2));
  }
};

function parseIndianData(html, phone) {
  const $ = cheerio.load(html);
  const result = {};

  // Extract JSON-like data from page
  const bodyText = $('body').text();
  const regex = /"([^"]+)"\s*:\s*"([^"]*)"/g;
  let match;
  while ((match = regex.exec(bodyText)) !== null) {
    result[match[1]] = match[2];
  }

  // Fallback: parse HTML list items
  if (Object.keys(result).length === 0) {
    $('li, .detail, .info, tr').each((i, el) => {
      const text = $(el).text();
      const colonIdx = text.indexOf(':');
      if (colonIdx > 0) {
        const key = text.substring(0, colonIdx).trim();
        const val = text.substring(colonIdx + 1).trim();
        if (key && val && key.length < 50 && val.length < 300) {
          result[key] = val;
        }
      }
    });
  }

  // Ensure all fields exist
  const fields = [
    'Complaints', 'Connection', 'Country', 'Hometown', 'IMEI Number', 'IP Address',
    'Language', 'MAC Address', 'Mobile Locations', 'Mobile State', 'Number',
    'Owner Address', 'Owner Name', 'Owner Personality', 'Reference City', 'SIM Card',
    'Tower Locations', 'Tracker ID', 'Tracking History'
  ];
  fields.forEach(f => { if (!result[f]) result[f] = 'N/A'; });

  result.Number = phone;
  result.Country = 'India';
  return result;
}

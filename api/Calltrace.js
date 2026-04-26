const axios = require('axios');

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
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const { number } = req.method === 'GET' ? req.query : req.body;

    if (!number) {
      return res.status(200).send(JSON.stringify({
        success: false,
        message: '❌ Please provide number: ?number=9876543210',
        developer: 'WASIF ALI',
        telegram: '@FREEHACKS95'
      }, null, 2));
    }

    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      return res.status(200).send(JSON.stringify({
        success: false,
        message: '❌ Invalid number (min 10 digits)',
        developer: 'WASIF ALI',
        telegram: '@FREEHACKS95'
      }, null, 2));
    }

    const formData = new URLSearchParams();
    formData.append('country', COUNTRY);
    formData.append('q', cleanNumber);

    const response = await axios.post(TARGET_URL, formData.toString(), {
      headers: {
        ...DEFAULT_HEADERS,
        'Cookie': COOKIE_STRING,
      },
      timeout: 20000
    });

    const html = response.data;
    const extracted = parseIndianData(html, cleanNumber);

    return res.status(200).send(JSON.stringify({
      success: true,
      message: '✅ Traced successfully',
      data: extracted,
      developer: 'WASIF ALI',
      telegram: '@FREEHACKS95'
    }, null, 2));

  } catch (err) {
    console.error('Crash error:', err);
    return res.status(200).send(JSON.stringify({
      success: false,
      message: 'Server error: ' + err.message,
      stack: err.stack,
      developer: 'WASIF ALI',
      telegram: '@FREEHACKS95'
    }, null, 2));
  }
};

function parseIndianData(html, phone) {
  const result = {};
  // Extract key-value pairs using regex
  const pairs = html.match(/"([^"]+)"\s*:\s*"([^"]*)"/g);
  if (pairs) {
    pairs.forEach(pair => {
      const match = pair.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
      if (match) result[match[1]] = match[2];
    });
  }
  // Fallback: look for patterns like <strong>Key:</strong> Value
  if (Object.keys(result).length === 0) {
    const lines = html.split('\n');
    for (let line of lines) {
      const idx = line.indexOf(':');
      if (idx > 5 && idx < 100) {
        const key = line.substring(0, idx).replace(/<[^>]*>/g, '').trim();
        let val = line.substring(idx+1).replace(/<[^>]*>/g, '').trim();
        if (key && val && key.length < 40 && val.length < 200) {
          result[key] = val;
        }
      }
    }
  }
  const fields = ['Complaints', 'Connection', 'IMEI Number', 'IP Address', 'MAC Address', 'SIM Card',
    'Owner Name', 'Owner Address', 'Owner Personality', 'Hometown', 'Reference City',
    'Mobile Locations', 'Tower Locations', 'Language', 'Mobile State', 'Tracker ID', 'Tracking History'];
  fields.forEach(f => { if (!result[f]) result[f] = 'N/A'; });
  result.Number = phone;
  result.Country = 'India';
  return result;
}

import { handleCampusStateRequest } from '../server/campusStore.ts';
import { getSessionUser } from '../server/auth.ts';

async function syncReadingToGoogleSheet(readingData: any) {
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby5omkKfa_WN1XIScQTNlfDedChl22agSzNefFm_AOJgU3Ov7sLz-F7UH4WuiNpReLPow/exec';
  try {
    await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify(readingData),
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Google Sheet Sync Error:', error);
  }
}

type VercelRequest = {
  method?: string;
  body?: unknown;
  headers?: { cookie?: string };
  query?: { id?: string | string[] };
};

type VercelResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const method = (req.method || 'GET').toUpperCase();
  const incoming =
    method === 'PUT' || method === 'POST'
      ? ((typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as Record<string, unknown>)
      : undefined;

  // गुगल शीटमधून ब्लॉक-वाईज डेटा आल्यावर इथे हँडल होईल
  if (method === 'POST' && incoming && incoming.type === 'block_reading_sync') {
    try {
      const { date, blockName, currentReading } = incoming;
      
      console.log(`Syncing -> Block: ${blockName}, Date: ${date}, Reading: ${currentReading}`);
      
      // TODO: इथे तुझ्या डेटाबेसची (Neon DB) इन्सर्ट क्वेरी टाक, 
      // जिथे blockName, date आणि currentReading सेव्ह होईल.
      
      return res.status(200).json({ status: "success", message: "Block reading synced" });
    } catch (err) {
      console.error("Block sync error:", err);
      return res.status(500).json({ error: "Failed to sync block data" });
    }
  }

  const result = await handleCampusStateRequest(method, getSessionUser(req.headers?.cookie), incoming);
  res.status(result.status).json(result.body);
}

import { handleCampusStateRequest, getCampusState, putCampusState } from '../server/campusStore.ts';
import { getSessionUser } from '../server/auth.ts';

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

  // गुगल शीटमधून ब्लॉक-वाईज डेटा आल्यावर इथे डेटाबेसमध्ये सेव्ह होईल
  if (method === 'POST' && incoming && incoming.type === 'block_reading_sync') {
    try {
      const { date, blockName, currentReading } = incoming;
      
      console.log(`Syncing -> Block: ${blockName}, Date: ${date}, Reading: ${currentReading}`);
      
      // 1. सध्याचा स्टेट लोड करणे
      const currentState = await getCampusState();
      
      // 2. ब्लॉकच्या नावावरून योग्य blockId शोधणे
      const targetBlock = currentState.blocks.find(b => b.name.toLowerCase() === String(blockName).toLowerCase());
      const blockId = targetBlock ? targetBlock.id : 'blk-a';
      
      // 3. नवीन रीडिंग तयार करणे
      const newReading = {
        id: `sheet-${date}-${blockId}-${Date.now()}`,
        blockId: blockId,
        date: String(date),
        current: Number(currentReading) || 0,
        previous: 0,
        mf: 1,
        units: Number(currentReading) || 0,
        cost: 0,
        recordedBy: "Google Sheet Sync"
      };

      // 4. Neon DB मध्ये डेटा सेव्ह करणे
      await putCampusState({
        readings: [...currentState.readings, newReading]
      });
      
      return res.status(200).json({ status: "success", message: "Block reading synced and saved to DB" });
    } catch (err) {
      console.error("Block sync error:", err);
      return res.status(500).json({ error: "Failed to sync block data" });
    }
  }

  const result = await handleCampusStateRequest(method, getSessionUser(req.headers?.cookie), incoming);
  res.status(result.status).json(result.body);
}
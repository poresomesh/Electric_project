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

  // Google Sheet kadhun block-wise sync request aalyavar ithe handle hoil
  if (method === 'POST' && incoming && incoming.type === 'block_reading_sync') {
    try {
      const { date, blockName, currentReading } = incoming;
      
      console.log(`Syncing -> Block: ${blockName}, Date: ${date}, Reading: ${currentReading}`);
      
      // 1. Sadhyacha state load karne
      const currentState = await getCampusState();
      
      // 2. Jar Google Sheet kadhun pura readingObject ala asel toh direct vapara, nahitar navin banva
      let newReading = incoming.readingObject as any;

      if (!newReading) {
        const targetBlock = currentState.blocks.find(b => b.name.toLowerCase() === String(blockName).toLowerCase());
        const blockId = targetBlock ? targetBlock.id : 'blk-a';
        const numVal = Number(currentReading) || 0;

        // Negative values la block karne sathi safety check
        if (numVal <= 0) {
          return res.status(200).json({ status: "ignored", message: "Negative or zero reading ignored" });
        }

        newReading = {
          id: `sheet-${date}-${blockId}-${Date.now()}`,
          blockId: blockId,
          date: String(date),
          current: numVal,
          previous: 0,
          mf: 1,
          units: numVal,
          cost: numVal * 12.5,
          recordedBy: "Google Sheet Sync"
        };
      }

      // 3. Neon DB madhe readings array madhe navin entry append karne
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
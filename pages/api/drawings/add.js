import { createClient } from '@vercel/kv';

let kv;
try {
  kv = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
} catch (error) {
  console.error('Failed to create KV client:', error);
}

export default async function handler(req, res) {
  if (!kv) {
    return res.status(500).json({ error: 'Database not available' });
  }

  if (req.method === 'POST') {
    try {
      const newDrawing = req.body;
      const drawings = await kv.get('pond_drawings') || [];
      drawings.push(newDrawing);
      await kv.set('pond_drawings', drawings);
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding drawing:', error);
      res.status(500).json({ error: 'Failed to add drawing' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

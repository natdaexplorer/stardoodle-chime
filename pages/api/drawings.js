import { createClient } from '@vercel/kv';

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const drawings = await kv.get('pond_drawings') || [];
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).json(drawings);
    } catch (error) {
      console.error('Error fetching drawings:', error);
      res.status(500).json({ error: 'Failed to fetch drawings' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

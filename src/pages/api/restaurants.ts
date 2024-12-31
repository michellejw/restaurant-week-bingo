import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Fetch all restaurants, or return an empty array if none exist
      const restaurants = await prisma.restaurant.findMany();
      return res.status(200).json(restaurants || []);
    } else {
      // Respond with method not allowed
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

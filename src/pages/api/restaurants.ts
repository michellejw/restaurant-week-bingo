import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Check if an ID param is supplied
        const { id } = req.query;

        if (id) {
          // Find a single restaurant by ID
          const restaurant = await prisma.restaurant.findUnique({
            where: { id: Number(id) },
          });
          if (!restaurant) {
            return res.status(404).json({ message: 'No restaurant with this id' });
          }
          return res.status(200).json(restaurant);
        }

        // Fetch all restaurants if no ID is supplied
        const restaurants = await prisma.restaurant.findMany();
        return res.status(200).json(restaurants);

      case 'POST':
        const { name, coordinates, url } = req.body;

        if (!name || !coordinates || !url) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        // Create a new restaurant
        const newRestaurant = await prisma.restaurant.create({
          data: {
            name,
            coordinates,
            url,
          },
        });

        return res.status(200).json(newRestaurant);

      case 'PUT':
        const { restaurantId, visited } = req.body;

        if (!restaurantId || visited === undefined) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        // Update restaurant's visited status
        const updatedRestaurant = await prisma.restaurant.update({
          where: { id: Number(restaurantId) },
          data: { visited },
        });

        return res.status(200).json(updatedRestaurant);

      case 'DELETE':
        const { deleteId } = req.query;

        if (!deleteId) {
          return res.status(400).json({ message: 'Missing restaurant ID' });
        }

        // Delete a restaurant
        await prisma.restaurant.delete({
          where: { id: Number(deleteId) },
        });

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

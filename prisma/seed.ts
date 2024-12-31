import prisma from '../lib/prisma';

async function seed() {
  await prisma.restaurant.createMany({
    data: [
      {
        name: "Michael's Seafood",
        visited: false,
        coordinates: [-77.9006, 34.0494],
        url: 'www.fakeurl1.com',
      },
      {
        name: 'Malama Cafe',
        visited: false,
        coordinates: [-77.9078, 34.0362],
        url: 'www.fakeurl2.com',
      },
      {
        name: 'Soul Flavor',
        visited: false,
        coordinates: [-77.9094, 34.0355],
        url: 'www.fakeurl3.com',
      },
    ],
  });

  console.log('Seeding completed!');
  process.exit(0);
}

seed().catch(e => {
  console.error('Error while seeding:', e);
  process.exit(1);
});

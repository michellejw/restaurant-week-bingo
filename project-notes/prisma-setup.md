# Setting Up Prisma

This guide walks through setting up Prisma in a Next.js project with Supabase.

## **Step 1: Set Up the Database Connection**

1. Open the `.env` file in your project (if it doesn't exist, create it).
2. Add your database connection strings. For Supabase, it will look like this:

``` env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[reference].supabase.co:5432/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[reference].supabase.co:5432/postgres"
```

Replace `<username>`, `<password>`, `<host>`, `<port>`, and `<database>` with your
Supabase details. You can find these in the **Supabase Dashboard** under **Settings →
Database → Connection String**. Note that the DATABASE_URL is from the transaction
pooling section and the DIRECT_URL is the direct connection. Also note that the
DATABASE_URL needs to have `?pgbouncer=true` manually added for it to work with supabase.

3. Update your `prisma/schema.prisma` with the following `datasource` configuration to
   ensure it reads from your `.env.local` file:

``` prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
```

## **Step 2: Define Your Data Models**

1. Open the `prisma/schema.prisma` file.
2. Define your database models. Here's an example for a project with `Restaurant`,
   `User`, and `Visit` tables:

``` prisma
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }

   model Restaurant {
     id          Int       @id @default(autoincrement())
     name        String
     visited     Boolean   @default(false)
     coordinates Float[]   // Stores latitude and longitude
     visits      Visit[]   // Relationship to Visit table
   }

   model User {
     id     Int     @id @default(autoincrement())
     email  String  @unique
     name   String?
     visits Visit[] // Relationship to Visit table
   }

   model Visit {
     id           Int         @id @default(autoincrement())
     timestamp    DateTime    @default(now())
     restaurantId Int
     userId       Int

     restaurant   Restaurant  @relation(fields: [restaurantId], references: [id])
     user         User        @relation(fields: [userId], references: [id])
   }
```

## **Step 3: Apply the Database Schema**

Now that the schema is defined, we need to apply it to the database:

1. Run the following command to create a migration and apply it:

``` bash
   npx prisma migrate dev --name init
```

This will:

- Create a migration file in the `prisma/migrations` folder.
- Apply the migration to the database, syncing the schema.

2. Verify that the tables are created:
    - Open Supabase and go to **Database → Table Editor**.
    - You should see the `Restaurant`, `User`, and `Visit` tables.

## **Step 4: Generate the Prisma Client**

1. Run the following command to generate the Prisma Client:

``` bash
   npx prisma generate
```

This generates the Prisma Client, which you can use to query your database
programmatically.

2. Confirm successful setup by checking if `node_modules/@prisma/client` exists.

## **Step 5: Add Prisma to Your Project**

To use the Prisma Client across your project, create a reusable helper file.

1. Create a new file at `lib/prisma.ts`:

``` bash
   touch lib/prisma.ts
```

2. Add the following code to `lib/prisma.ts`:

``` typescript
   import { PrismaClient } from '@prisma/client';

   const prisma = new PrismaClient();

   export default prisma;
```

This creates and exports a single Prisma Client instance for your application.

## **Step 6: Test the Integration**

Test that Prisma is set up and working by creating a simple API route.

1. Create a new API route at `pages/api/restaurants.ts`:

``` bash
   touch pages/api/restaurants.ts
```

2. Add the following code:

``` typescript
   import { NextApiRequest, NextApiResponse } from 'next';
   import prisma from '@/lib/prisma';

   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     try {
       if (req.method === 'GET') {
         // Fetch all restaurants from the database
         const restaurants = await prisma.restaurant.findMany();
         res.status(200).json(restaurants);
       } else {
         res.status(405).json({ message: 'Method Not Allowed' });
       }
     } catch (error) {
       console.error('Error fetching restaurants:', error);
       res.status(500).json({ error: 'Internal Server Error' });
     }
   }
```

3. Start your development server:

``` bash
   npm run dev
```

4. Visit `http://localhost:3000/api/restaurants` in your browser:
    - You should see an empty array (`[]`) if no restaurants exist in your database.

## **Step 7: Seed the Database (Optional)**

If you'd like to add some initial data to test your database, you can create a seed
script.

1. Add the script at `prisma/seed.ts`:

``` bash
   touch prisma/seed.ts
```

2. Add the following code to `prisma/seed.ts`:

``` typescript
   import prisma from '../lib/prisma';

   async function seed() {
     await prisma.restaurant.createMany({
       data: [
         { name: "Michael's Seafood", visited: false, coordinates: [-77.9006, 34.0494], url: "www.fakeurl1.com" },
         { name: 'Malama Cafe', visited: false, coordinates: [-77.9078, 34.0362], url: "www.fakeurl2.com" },
         { name: 'Soul Flavor', visited: false, coordinates: [-77.9094, 34.0355], url: "www.fakeurl3.com"  },
       ],
     });

     console.log('Seeding completed!');
     process.exit(0);
   }

   seed().catch((e) => {
     console.error('Error while seeding:', e);
     process.exit(1);
   });
```

3. Run the seeding script:

``` bash
   npx ts-node prisma/seed.ts
```

Note that I tried this and couldn't get node to recognize the typescript file, even
though I installed ts-node. So instead I precompiled the seed.ts script into a js file
using: `npx tsc prisma/seed.ts`. After that I was able to run `node prisma/seed.js`
without errors.
npx tsc prisma/seed.ts

4. Verify the data in **Supabase → Table Editor** or by testing the `/api/restaurants`
   endpoint again.

## **Next Steps**

1. Update your API routes to handle additional functionality (e.g., updating, deleting
   records).
2. Build your frontend to interact with the database using these API routes.
3. Explore advanced Prisma features like aggregations, transactions, and optimizing
   queries.

# Restaurant Week Bingo

A web application for the local chamber of commerce that gamifies restaurant week participation through a digital bingo card system. Users can check in at participating restaurants and earn raffle entries based on their visits.

## Features

- Email/password authentication
- Interactive bingo card that updates as users visit restaurants
- Interactive map using OpenStreetMap and Leaflet
- Check-in system with unique restaurant codes
- Automatic raffle entry tracking (1 entry per 5 restaurants visited)
- Real-time visit statistics
- Responsive design for both mobile and desktop

## Tech Stack

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)
- Leaflet with OpenStreetMap

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Supabase project and run the SQL setup commands found in `supabase/init.sql`. This will create:
   - `restaurants` table for restaurant information
   - `visits` table for tracking user check-ins
   - `user_stats` table for caching visit counts and raffle entries
   - Necessary indexes and RLS policies
   - Automatic triggers for updating statistics

4. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

### restaurants
```sql
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    url TEXT,
    code TEXT UNIQUE NOT NULL,
    latitude FLOAT8 NOT NULL,
    longitude FLOAT8 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### visits
```sql
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    restaurant_id UUID REFERENCES restaurants NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id)
);
```

### user_stats
```sql
CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users,
    visit_count INTEGER DEFAULT 0,
    raffle_entries INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

## Supabase Setup

1. Enable Email Auth in Authentication settings
2. Run all SQL commands from `supabase/init.sql` in the SQL editor
3. The SQL file includes:
   - Table creation
   - RLS policies
   - Automatic triggers for stats updates
   - Performance indexes

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project's anon/public key

## Static Assets

Static files (images, fonts, etc.) should be placed in the appropriate subdirectory under `public/`:
- Images go in `public/images/`
- Fonts go in `public/fonts/`
- Other static assets should be organized in appropriate subdirectories

When referencing these files in the code, use paths relative to the `public` directory:
```jsx
// Example image usage
<Image src="/images/example.png" alt="Example" />
```

The middleware is configured to serve static files without authentication, supporting the following:
- All files in `public/images/` and `public/fonts/`
- Common file types: .png, .svg, .jpg, .ico
- Next.js system files (_next/static, _next/image)
- favicon.ico

If you need to add support for additional file types, update the matcher in `src/middleware.ts`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

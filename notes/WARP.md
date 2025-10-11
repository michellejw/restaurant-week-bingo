# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Fix linting issues
npm run lint --fix
```

### Database Operations
```bash
# Generate QR codes for all restaurants
node scripts/generate-qr-codes.js

# Initialize Supabase schema (run SQL in Supabase dashboard)
# File: supabase/init.sql
```

### Restaurant Data Management
```bash
# Interactive map editor for restaurant locations
open tools/map-editor/index.html
# or
cd tools/map-editor && ./launch.sh

# Smart import restaurants from Excel
node scripts/smart-import-restaurants.js
```

### Testing Individual Features
```bash
# Test database connection and QR generation
node scripts/generate-qr-codes.js

# Check specific component by navigating to:
# - /contact - Contact page
# - /how-to-play - Game instructions
# - /my-info - User settings page  
# - /sponsors - Sponsor listing page
# - /reset-password - Password reset
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom coral theme
- **Authentication**: Clerk (for user management) + Supabase (for data)
- **Database**: Supabase PostgreSQL
- **Maps**: Leaflet with OpenStreetMap
- **Deployment**: Designed for Vercel

### Dual Authentication Pattern
This project uses a **hybrid authentication approach**:
- **Clerk**: Handles user registration, login, session management
- **Supabase**: Database operations with user ID mapping

Key files:
- `src/components/UserInitializer.tsx` - Syncs Clerk users to Supabase
- `src/lib/supabase.ts` - Supabase client with auth disabled
- `src/lib/services/database.ts` - Database service layer

### Core Architecture

#### Database Schema (Supabase)
- `restaurants` - Restaurant data with codes and locations
- `sponsors` - Sponsor information with retail flag
- `user_stats` - Cached user visit counts and raffle entries
- `visits` - User check-ins at restaurants (unique constraint)
- Automatic triggers update stats when visits are added

#### Component Structure
```
src/
├── app/                    # Next.js App Router pages
├── components/            # React components
│   ├── BingoCard.tsx     # Main game interface
│   ├── RestaurantMap.tsx # Leaflet map component
│   ├── CheckInModal.tsx  # Code entry system
│   └── NavBar.tsx        # Navigation
├── hooks/                 # Custom React hooks
├── lib/
│   ├── services/database.ts  # Database abstraction layer
│   └── supabase.ts       # Supabase client setup
└── types/supabase.ts     # Generated types
```

### Key Business Logic

#### Bingo Card System
- Displays all restaurants in a responsive grid
- Shows visited restaurants with coral highlighting
- Updates in real-time when users check in

#### Check-in System
- Users enter unique restaurant codes
- Creates visit record with unique constraint (user_id, restaurant_id)
- Automatically updates visit count and raffle entries
- Raffle entries = floor(visits / 4)

#### Map Integration
- Leaflet map with clustering for better UX
- Shows both restaurants and retail sponsors
- Different markers for different types
- Auto-centers on all location markers

## Important Patterns & Guidelines

### Database Operations
Always use the database service layer (`DatabaseService`) rather than direct Supabase calls:
```typescript
// Good
const restaurants = await DatabaseService.restaurants.getAll();
const visits = await DatabaseService.visits.create(userId, restaurantId);

// Avoid direct Supabase calls in components
```

### User ID Handling
User IDs come from Clerk and are mapped to Supabase as TEXT:
```typescript
const { user } = useUser(); // Clerk
const userId = user?.id; // Use this for all DB operations
```

### Component Data Flow
- Use hooks for data fetching (`useUser`, `useUserStats`)
- Pass update callbacks to child components for state refresh
- BingoCard receives `onVisitUpdate` callback for real-time updates

### Styling Patterns
- Use Tailwind CSS with custom coral theme (`coral-100`, `coral-500`, etc.)
- Responsive design with mobile-first approach
- Consistent spacing and border patterns

## Environment Setup

Required environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For scripts only
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

## Project Rules & Conventions

Based on `.cursorrules`:
- Follow the `projectBrief.md` for project requirements
- Use tried and tested patterns, avoid over-engineering
- Don't make unnecessary design changes unless specifically requested
- Keep solutions straightforward without adding bloat
- Avoid endless back-and-forth iterations

## Data Management

### Restaurant Data
- Managed through Supabase admin dashboard
- Each restaurant has unique code for check-ins
- Coordinates used for map positioning
- Phone, description, specials fields available

### User Statistics
- Automatically calculated via database triggers
- `user_stats` table caches visit counts and raffle entries
- Real-time updates when users check in

### QR Code Generation
- Use `scripts/generate-qr-codes.js` to create QR codes
- Generates PNG files in `/qr-codes` directory
- Based on restaurant codes from database

### Administrative Tools
- **Map Editor** (`tools/map-editor/`): Interactive visual tool for editing restaurant locations
  - Drag & drop markers to fix coordinates
  - Full editing of all restaurant fields
  - Excel import/export with existing file structure
  - Standalone tool that works offline

## Known Issues & Considerations

1. **Authentication Complexity**: Dual auth system (Clerk + Supabase) requires careful user ID mapping
2. **Mobile Map Performance**: Leaflet clustering helps with marker overlap at default zoom
3. **Database Triggers**: Stats updates are handled automatically via SQL triggers
4. **Type Safety**: Uses generated Supabase types but not comprehensive validation

## Future Architecture Recommendations

The `PROJECT_ANALYSIS_AND_RECOMMENDATIONS.md` file contains detailed suggestions for:
- Better project structure with feature-based organization  
- Enhanced type safety with Zod validation
- Improved state management with Zustand + React Query
- Comprehensive testing setup
- Performance optimizations
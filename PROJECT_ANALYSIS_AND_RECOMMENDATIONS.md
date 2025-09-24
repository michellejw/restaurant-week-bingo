# Restaurant Week Bingo Project Analysis & Recommendations

## Executive Summary

This project is a well-functioning React/Next.js web application for gamifying restaurant week participation. The codebase demonstrates solid fundamentals but has several areas for improvement in organization, scalability, and maintainability. This document provides comprehensive analysis and recommendations for rebuilding the project with best practices.

---

## Current Project Analysis

### Strengths ✅

**1. Modern Tech Stack**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Solid foundation choices

**2. Functional Features**
- Working authentication (Clerk)
- Interactive map with Leaflet
- Bingo card gamification
- Check-in system with unique codes
- Raffle entry tracking

**3. Database Design**
- Well-structured PostgreSQL schema
- Proper foreign key relationships
- RLS (Row Level Security) policies
- Automated triggers for stats updates

### Areas for Improvement 🔧

**1. Project Structure**
- Components lack clear organization
- No separation of concerns between UI and business logic
- Missing consistent patterns for data fetching
- No clear folder structure for different types of components

**2. Code Architecture**
- Mixed authentication strategies (Clerk + Supabase confusion)
- No proper error handling patterns
- Limited state management approach
- Components doing too many things

**3. Development Experience**
- Missing proper TypeScript configuration
- No testing setup
- Limited documentation
- No clear development workflow

---

## Recommended Tech Stack for New Version

### Core Framework
```json
{
  "framework": "Next.js 14+",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "deployment": "Vercel"
}
```

### State Management
```json
{
  "client_state": "Zustand",
  "server_state": "TanStack Query (React Query)",
  "forms": "React Hook Form + Zod"
}
```

### Database & Backend
```json
{
  "database": "PostgreSQL (Supabase)",
  "auth": "Supabase Auth",
  "file_storage": "Supabase Storage",
  "api": "Next.js API Routes + tRPC"
}
```

### Development Tools
```json
{
  "testing": "Vitest + Testing Library",
  "linting": "ESLint + Prettier",
  "pre_commit": "Husky + lint-staged",
  "ci_cd": "GitHub Actions"
}
```

---

## Recommended Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   ├── (dashboard)/              # Protected routes
│   ├── api/                      # API routes
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Reusable UI components
│   ├── ui/                       # Base components (Button, Input, etc.)
│   ├── forms/                    # Form components
│   ├── layout/                   # Layout components (Header, Nav, etc.)
│   └── features/                 # Feature-specific components
├── features/                     # Feature-based organization
│   ├── auth/
│   ├── restaurants/
│   ├── bingo/
│   └── map/
├── lib/                          # Utilities and configurations
│   ├── auth.ts
│   ├── db.ts
│   ├── utils.ts
│   ├── validations.ts
│   └── constants.ts
├── hooks/                        # Custom React hooks
├── stores/                       # State management (Zustand stores)
├── types/                        # TypeScript type definitions
└── tests/                        # Test files
```

---

## Architecture Improvements

### 1. Component Organization

**Current Issue**: Components mix UI logic with business logic

**Recommendation**: Implement feature-based architecture

```typescript
// Example: features/restaurants/components/RestaurantCard.tsx
export function RestaurantCard({ restaurant, onVisit }: RestaurantCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{restaurant.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{restaurant.address}</p>
        {restaurant.visited && <Badge>Visited</Badge>}
      </CardContent>
      <CardFooter>
        <Button onClick={() => onVisit(restaurant.id)}>
          Check In
        </Button>
      </CardFooter>
    </Card>
  );
}

// Business logic separated in: features/restaurants/hooks/useRestaurants.ts
export function useRestaurants() {
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.getAll(),
  });
}
```

### 2. State Management

**Current Issue**: useState scattered throughout components

**Recommendation**: Use Zustand for client state + React Query for server state

```typescript
// stores/auth.ts
interface AuthState {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  // ... methods
}));

// hooks/useRestaurants.ts
export function useRestaurants() {
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: restaurantService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 3. Type Safety

**Current Issue**: Basic TypeScript usage

**Recommendation**: Comprehensive type system with Zod validation

```typescript
// lib/validations.ts
import { z } from 'zod';

export const RestaurantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  code: z.string().min(1),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;

// API route with validation
export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = RestaurantSchema.parse(body);
  // ... handle request
}
```

### 4. Error Handling

**Current Issue**: Inconsistent error handling

**Recommendation**: Standardized error handling with error boundaries

```typescript
// components/ErrorBoundary.tsx
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error) => {
        console.error('Error caught by boundary:', error);
        // Log to error service
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (error: unknown) => {
  if (error instanceof AppError) {
    return { error: error.message, code: error.code };
  }
  // Handle other error types
};
```

---

## Database Improvements

### Current Schema Issues
1. Missing `users` table in init.sql but referenced in code
2. Inconsistent ID types (UUID vs TEXT)
3. Missing indexes for performance

### Recommended Schema Updates

```sql
-- Enhanced schema with better organization
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    code TEXT UNIQUE NOT NULL,
    phone TEXT,
    website_url TEXT,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add proper indexes
CREATE INDEX idx_restaurants_location ON restaurants (latitude, longitude);
CREATE INDEX idx_visits_user_id ON visits (user_id);
CREATE INDEX idx_visits_restaurant_id ON visits (restaurant_id);
CREATE INDEX idx_visits_created_at ON visits (created_at);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## UI/UX Improvements

### 1. Design System

**Current Issue**: Inconsistent component styling

**Recommendation**: Implement a proper design system

```typescript
// components/ui/button.tsx
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

### 2. Responsive Design

**Recommendation**: Mobile-first approach with proper breakpoints

```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      colors: {
        primary: {
          50: '#fff1f0',
          500: '#ff5436',
          900: '#a31b0b',
        },
      },
    },
  },
};
```

---

## Development Workflow

### 1. Testing Strategy

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// tests/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
});
```

### 2. Code Quality

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error"
  }
}

// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 3. Git Workflow

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "db:generate": "supabase gen types typescript --local",
    "db:reset": "supabase db reset",
    "prepare": "husky install"
  }
}

// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged

// lint-staged.config.js
module.exports = {
  '**/*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  '**/*.{md,json}': [
    'prettier --write',
  ],
};
```

---

## Security Improvements

### 1. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. API Security

```typescript
// lib/auth.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function getUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new AppError('Unauthorized', 'UNAUTHORIZED', 401);
  }
  
  return session.user;
}

// middleware.ts
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // Protect API routes
  if (request.nextUrl.pathname.startsWith('/api/protected')) {
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  return response;
}
```

---

## Performance Optimizations

### 1. Code Splitting

```typescript
// app/dashboard/page.tsx
import dynamic from 'next/dynamic';

const RestaurantMap = dynamic(
  () => import('@/features/map/components/RestaurantMap'),
  {
    loading: () => <MapSkeleton />,
    ssr: false, // Map components often need client-side rendering
  }
);

export default function DashboardPage() {
  return (
    <div>
      <BingoCard />
      <RestaurantMap />
    </div>
  );
}
```

### 2. Image Optimization

```typescript
// components/RestaurantImage.tsx
import Image from 'next/image';

export function RestaurantImage({ src, alt, ...props }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      {...props}
    />
  );
}
```

---

## Documentation Structure

### 1. README.md Template

```markdown
# Restaurant Week Bingo

A modern web application for gamifying restaurant week participation.

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables: `cp .env.example .env.local`
4. Start the development server: `npm run dev`

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Testing**: Vitest + Testing Library

## Project Structure

- `/src/app` - Next.js App Router pages
- `/src/components` - Reusable UI components
- `/src/features` - Feature-based modules
- `/src/lib` - Utilities and configurations

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run linting
```

### 2. API Documentation

```markdown
# API Reference

## Authentication

All protected endpoints require a valid session cookie.

## Endpoints

### GET /api/restaurants

Returns a list of all restaurants.

**Response:**
```json
{
  "restaurants": [
    {
      "id": "uuid",
      "name": "Restaurant Name",
      "address": "123 Main St",
      "latitude": 34.0352,
      "longitude": -77.8936
    }
  ]
}
```
```

---

## Suggested Migration Strategy

### Phase 1: Foundation 
1. Set up new project with recommended tech stack
2. Implement basic project structure
3. Set up development tools (ESLint, Prettier, Husky)
4. Create base UI components

### Phase 2: Core Features 
1. Implement authentication system
2. Set up database schema
3. Create restaurant and visit management
4. Build bingo card functionality

### Phase 3: Enhanced Features 
1. Implement map functionality
2. Add check-in system
3. Create user dashboard
4. Add raffle system

### Phase 4: Polish & Deploy 
1. Add comprehensive testing
2. Optimize performance
3. Add proper error handling
4. Deploy to production

---

## Conclusion

The current project demonstrates solid functionality but would benefit significantly from a structured rebuild focusing on:

1. **Better Architecture**: Feature-based organization with clear separation of concerns
2. **Type Safety**: Comprehensive TypeScript usage with runtime validation
3. **Testing**: Full test coverage for reliability
4. **Performance**: Optimized loading and rendering
5. **Developer Experience**: Better tooling and documentation

This foundation will make the project more maintainable, scalable, and professional while preserving all existing functionality.
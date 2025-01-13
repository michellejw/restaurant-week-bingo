# Supabase Setup Guide for Next.js Applications

## Initial Setup

1. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```
   - Only use `NEXT_PUBLIC_` prefix for variables that need to be accessible in the browser
   - Keep service role key private (server-side only)

2. **Database Schema Best Practices**
   ```sql
   -- Always specify precise column types
   CREATE TABLE restaurants (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     address TEXT NOT NULL,
     website_url TEXT,
     -- Use double precision for GPS coordinates
     latitude DOUBLE PRECISION NOT NULL,
     longitude DOUBLE PRECISION NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

## Security Setup

1. **Row Level Security (RLS)**
   ```sql
   -- Enable RLS
   ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Allow public read access"
     ON restaurants
     FOR SELECT
     TO public
     USING (true);

   CREATE POLICY "Allow admin write access"
     ON restaurants
     FOR ALL
     TO authenticated
     USING (EXISTS (
       SELECT 1 FROM users
       WHERE users.email = auth.jwt()->>'email'
       AND users.isAdmin = true
     ));
   ```

2. **Schema Permissions**
   ```sql
   -- Grant necessary permissions
   GRANT USAGE ON SCHEMA public TO service_role;
   GRANT USAGE ON SCHEMA public TO anon;
   GRANT USAGE ON SCHEMA public TO authenticated;

   -- Grant table permissions
   GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

   -- Set default privileges for future tables
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
   GRANT ALL ON TABLES TO service_role;
   ```

## Client Setup

1. **Public Client (Browser-safe)**
   ```typescript
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
     {
       auth: {
         persistSession: true,
         autoRefreshToken: true,
       }
     }
   );
   ```

2. **Admin Client (Server-side only)**
   ```typescript
   export const createAdminClient = () => {
     if (typeof window !== 'undefined') {
       throw new Error('Admin client cannot be used in browser');
     }
     
     return createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.SUPABASE_SERVICE_KEY!,
       {
         auth: {
           persistSession: false,
           autoRefreshToken: false,
         }
       }
     );
   };
   ```

## API Routes Best Practices

1. **Server-Side Operations**
   ```typescript
   // src/app/api/admin/route.ts
   export async function POST(request: Request) {
     try {
       // 1. Verify authentication
       const session = await getSession();
       if (!session?.user?.email) {
         return NextResponse.json(
           { error: 'Unauthorized' },
           { status: 401 }
         );
       }

       // 2. Use admin client for operations
       const supabaseAdmin = createAdminClient();
       
       // 3. Perform database operations
       const { data, error } = await supabaseAdmin
         .from('your_table')
         .insert(await request.json());

       if (error) throw error;
       return NextResponse.json(data);
     } catch (error) {
       console.error('Error:', error);
       return NextResponse.json(
         { error: 'Internal Server Error' },
         { status: 500 }
       );
     }
   }
   ```

## Common Pitfalls to Avoid

1. **Security**
   - Never use service role key in client-side code
   - Always enable RLS on tables
   - Grant minimum necessary permissions to each role
   - Use server-side API routes for admin operations

2. **Database**
   - Use appropriate column types (e.g., DOUBLE PRECISION for coordinates)
   - Add appropriate constraints (NOT NULL, UNIQUE, etc.)
   - Create indexes for frequently queried columns

3. **Error Handling**
   - Add proper error handling in API routes
   - Log errors with sufficient detail
   - Return appropriate HTTP status codes
   - Validate data before sending to database

4. **Authentication**
   - Verify user sessions server-side
   - Check admin status in a secure way
   - Use middleware for protected routes

## Testing Setup

1. **Before Deployment**
   - Test all database policies
   - Verify RLS is working as expected
   - Check all roles have correct permissions
   - Test with both authenticated and anonymous users

2. **After Changes**
   - Test existing functionality still works
   - Verify new features work with proper permissions
   - Check error handling works correctly

## Maintenance

1. **Regular Tasks**
   - Keep track of migrations in version control
   - Monitor database performance
   - Review and update security policies
   - Keep dependencies updated

2. **Backup**
   - Enable point-in-time recovery
   - Set up regular backups
   - Test restore procedures 
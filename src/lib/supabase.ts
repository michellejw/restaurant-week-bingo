'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create a single instance to be shared across the app
export const supabase = createClientComponentClient(); 
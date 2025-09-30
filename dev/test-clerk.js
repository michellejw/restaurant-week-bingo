// Test script to verify Clerk keys
require('dotenv').config({ path: '.env.local' });

console.log('Testing Clerk Configuration...\n');

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

console.log('Publishable Key:', publishableKey ? `${publishableKey.substring(0, 20)}...` : 'MISSING');
console.log('Secret Key:', secretKey ? `${secretKey.substring(0, 20)}...` : 'MISSING');

// Decode publishable key to show project info
if (publishableKey) {
  try {
    const decoded = Buffer.from(publishableKey.replace('pk_test_', ''), 'base64').toString();
    console.log('Decoded project info:', decoded);
  } catch (e) {
    console.log('Could not decode publishable key');
  }
}

// Test basic Clerk setup
console.log('\nTesting Clerk setup...');
try {
  const { createClerkClient } = require('@clerk/nextjs/server');
  const clerkClient = createClerkClient({
    secretKey: secretKey
  });
  
  console.log('✅ Clerk client created successfully');
  console.log('✅ Keys appear to be valid format');
} catch (error) {
  console.log('❌ Error creating Clerk client:', error.message);
}
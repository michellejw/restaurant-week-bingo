'use client';

import { UserProvider } from '@auth0/nextjs-auth0/client';

export function Auth0ProviderComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserProvider>{children}</UserProvider>;
} 
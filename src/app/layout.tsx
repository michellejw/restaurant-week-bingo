import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Auth0ProviderComponent } from '@/components/providers/auth0-provider';
import { LogoutButton } from '@/components/auth/logout-button';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Restaurant Week Bingo',
  description: 'Pleasure Island Restaurant Week Bingo - Discover and enjoy local restaurants!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Auth0ProviderComponent>
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                  <div className="flex-shrink-0">
                    <h1 className="text-xl font-bold text-gray-900">Restaurant Week Bingo</h1>
                  </div>
                  <div>
                    <LogoutButton />
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </Auth0ProviderComponent>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Auth0ProviderComponent } from '@/components/providers/auth0-provider';
import Navbar from '@/components/nav/navbar';

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
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </Auth0ProviderComponent>
      </body>
    </html>
  );
}

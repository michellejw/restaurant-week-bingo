import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientNavWrapper from "@/components/ClientNavWrapper";
import { metadata } from "./metadata";
import { AuthProvider } from '@/lib/AuthContext';
import Link from 'next/link';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <ClientNavWrapper />
          <main className="pt-16 flex-grow">
            {children}
          </main>
          <footer className="py-6 px-4 mt-auto border-t border-gray-100">
            <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
              <p>
                Crafted in Wilmington, NC by{' '}
                <Link 
                  href="https://waveformanalytics.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-coral-500 hover:text-coral-600 transition-colors"
                >
                  Waveform Analytics
                </Link>
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

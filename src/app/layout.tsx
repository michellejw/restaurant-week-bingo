import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientNavWrapper from "@/components/ClientNavWrapper";
import { metadata } from "./metadata";
import {
  ClerkProvider,
} from '@clerk/nextjs';
import Link from 'next/link';
import ProfileBanner from "@/components/ProfileBanner";
import { UserInitializer } from "@/components/UserInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ClerkProvider
          appearance={{
            baseTheme: undefined,
            elements: {
              rootBox: "w-full",
              card: "w-full"
            }
          }}
        >
          <UserInitializer />
          <div className="flex flex-col min-h-screen">
            <ClientNavWrapper />
            <div className="mt-[4rem]">
              <ProfileBanner />
              <main className="flex-grow">
                {children}
              </main>
            </div>
          </div>
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
        </ClerkProvider>
      </body>
    </html>
  );
}
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientNavWrapper from "@/components/ClientNavWrapper";
import { metadata } from "./metadata";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientNavWrapper />
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}

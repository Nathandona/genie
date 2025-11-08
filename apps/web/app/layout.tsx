import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Genie - Transform Websites into Modern Next.js",
  description: "Convert any website into a blazing-fast Next.js application in minutes with AI-powered code generation.",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/icon.svg',
    shortcut: '/icon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "Genie - Transform Websites into Modern Next.js",
    description: "Convert any website into a blazing-fast Next.js application in minutes with AI-powered code generation.",
    type: "website",
    images: [
      {
        url: '/icon.svg',
        width: 1200,
        height: 630,
        alt: 'Genie Logo',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Genie - Transform Websites into Modern Next.js",
    description: "Convert any website into a blazing-fast Next.js application in minutes with AI-powered code generation.",
    images: ['/icon.svg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from 'react-hot-toast'
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TYPAMOOD - Retro Moodboard Creator",
  description: "Create stunning 90's inspired moodboards with drag & drop images, perfect for your creative projects.",
  keywords: "moodboard, retro, 90s, aesthetic, design, creative, images",
  authors: [{ name: "Typamood Team" }],
  creator: "Typamood",
  openGraph: {
    title: "TYPAMOOD - Retro Moodboard Creator",
    description: "Create stunning 90's inspired moodboards with drag & drop images",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TYPAMOOD - Retro Moodboard Creator",
    description: "Create stunning 90's inspired moodboards with drag & drop images",
  },
  robots: {
    index: true,
    follow: true,
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
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#000',
              color: '#00ffff',
              border: '2px solid #ff00ff',
              fontFamily: 'monospace',
            },
            success: {
              iconTheme: {
                primary: '#39FF14',
                secondary: '#000',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF4500',
                secondary: '#000',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
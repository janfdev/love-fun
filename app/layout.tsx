import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans, Space_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/providers/toast-provider';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400', '600', '700', '800', '900'],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'LoveFun · Love is Fun Studio & Couple Games',
  description: 'Ruang bermain digital untuk pasangan! Cetak photo strip manis, animasikan GIF, dan uji kekompakan berdua lewat game interaktif Sync or Sink.',
  keywords: ['lovefun', 'photobooth couple', 'couple games', 'sync or sink', 'photo strip', 'korean photobooth'],
  authors: [{ name: 'LoveFun Studio' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${outfit.variable} ${plusJakarta.variable} ${spaceMono.variable}`}>
      <body className="min-h-screen bg-[#FFF9FB] text-[#2B2D42] font-sans antialiased selection:bg-[#FB6F92] selection:text-white">
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}

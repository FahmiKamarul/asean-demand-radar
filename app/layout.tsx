import type { Metadata } from 'next';
import { Archivo, Big_Shoulders } from 'next/font/google';
import Link from 'next/link';
import { RadarShell } from '@/components/RadarShell';
import './globals.css';

const display = Big_Shoulders({ variable: '--font-display', subsets: ['latin'], weight: ['700', '900'] });
const body = Archivo({ variable: '--font-body', subsets: ['latin'], weight: ['400', '600', '800'] });

export const metadata: Metadata = {
  title: 'ASEAN Demand Radar',
  description: 'Find which book to test in which ASEAN country, with sources.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>
        <header className="topbar">
          <Link href="/" className="wordmark">ASEAN Demand Radar</Link>
          <nav aria-label="Main">
            <Link href="/">Radar</Link>
            <Link href="/dashboard">Results</Link>
          </nav>
        </header>
        <RadarShell>{children}</RadarShell>
      </body>
    </html>
  );
}

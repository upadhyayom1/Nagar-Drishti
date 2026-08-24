import Providers from '@/lib/providers';
import { Inter } from 'next/font/google';
import './globals.css';

// Configure Inter to swap smoothly and create a CSS variable
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'UrbanPulse | Command Center',
  description: 'AI-powered vehicle intelligence',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      {/* 
        Forcing the font-family directly via style guarantees it loads.
        If Inter fails, it instantly falls back to Apple's San Francisco / system UI.
      */}
      <body 
        className="antialiased bg-[#08080a] text-gray-100 selection:bg-cyan-500/30"
        style={{ fontFamily: 'var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
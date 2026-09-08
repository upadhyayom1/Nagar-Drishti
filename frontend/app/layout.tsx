import type { Metadata } from 'next';
import Providers from '@/lib/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'NagarDrishti | AI Command Center',
  description: 'AI-powered city-wide vehicle intelligence and traffic analytics platform',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-body bg-[var(--bg-void)] text-[var(--text-primary)] min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

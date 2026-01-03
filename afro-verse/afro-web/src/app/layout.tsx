import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import { BottomNav } from '../components/navigation/BottomNav';

export const metadata: Metadata = {
  title: 'AfroMoji - Become. Belong. Witness.',
  description: 'Identity-first AI transformation platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AfroMoji',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/app-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <div id="root">
          <main>{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}


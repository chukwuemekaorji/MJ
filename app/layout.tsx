import '../styles/globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'MJ – Couples Space',
  description: 'A private, playful, reflective space for two people.',
  icons: {
    apple: [{ url: '/logo.png', sizes: '180x180', type: 'image/png' }],
    icon:  [{ url: '/logo.png', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#F8DDE8" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="msapplication-TileColor" content="#F8DDE8" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <main className="min-h-screen flex flex-col items-center">
          <div className="w-full max-w-md px-4 py-6">{children}</div>
        </main>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}

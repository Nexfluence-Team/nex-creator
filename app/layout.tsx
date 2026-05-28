import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from './AuthProvider'

export const metadata: Metadata = {
  title:       'Creator Nexus by Nexfluence',
  description: 'The portfolio platform for Baltic UGC creators. Build your professional portfolio, attract brand deals, and grow your income.',
  metadataBase: new URL('https://nexus.nexfluence.eu'),
  openGraph: {
    type:        'website',
    siteName:    'Creator Nexus by Nexfluence',
    title:       'Creator Nexus by Nexfluence',
    description: 'The portfolio platform for Baltic UGC creators. Build your professional portfolio, attract brand deals, and grow your income.',
    url:         'https://nexus.nexfluence.eu',
    images: [
      {
        url:    '/og-default.png',
        width:  1200,
        height: 630,
        alt:    'Creator Nexus by Nexfluence',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    site:        '@nexfluence',
    title:       'Creator Nexus by Nexfluence',
    description: 'The portfolio platform for Baltic UGC creators.',
    images:      ['/og-default.png'],
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta property="og:locale" content="en_US" />
        <meta name="theme-color" content="#8061ff" />
        <link rel="icon" href="/favicon.ico" />

        {/* ── Google Fonts: Rubik (primary brand font) ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700;800;900&display=swap"
        />
      </head>
      <body>
        <AuthProvider />
        {children}
      </body>
    </html>
  )
}
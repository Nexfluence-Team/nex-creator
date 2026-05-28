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
      </head>
      <body>
        <AuthProvider />
        {children}
      </body>
    </html>
  )
}
import { Providers } from '@/components/Providers'
import './globals.css'
import '@radix-ui/themes/styles.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication App',
  description: 'A secure authentication system built with Next.js and Supabase',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

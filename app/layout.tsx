import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlipOff. — Free Split-Flap Display for Any TV',
  description: 'The classic flip-board look, without the $3,500 hardware.',
}

export const viewport: Viewport = {
  themeColor: '#111111',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

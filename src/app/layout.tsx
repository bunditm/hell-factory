import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hell Factory — Virtual Office for AI Agents',
  description: 'Pixel art canvas rendering with Hermes Agent integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
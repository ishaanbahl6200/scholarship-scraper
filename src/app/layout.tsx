import './globals.css'
import { Lora } from 'next/font/google'
import AuthProvider from '@/providers/AuthProvider'

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-heading',
})

export const metadata = {
  title: 'Scholarship Finder - Find Your Perfect Match',
  description: 'AI-powered scholarship matching for Canadian students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${lora.className} ${lora.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

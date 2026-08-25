import type React from "react"
import type { Metadata } from "next"
import { Toaster } from 'sonner'
import { Inter } from "next/font/google"
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "binj.Ai - AI-Powered Social Media Content Generator",
  description:
    "Create scroll-stopping social content in seconds. AI generates beautiful, on-brand posts from your vision.",
  generator: 'v0.app',
  other: {
    'tiktok-developers-site-verification': '9ztD7sMvHCEkwGx1fZuRIUjKIolKugdd'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={({
        baseTheme: dark,
        variables: {
          colorPrimary: '#10b981', // accent-green matching tailwind
        }
      }) as any}
    >
      <html lang="en" className={inter.variable}>
        <body className="dark">
          {children}
          <Toaster position="bottom-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}

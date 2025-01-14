'use client'

import { Theme } from '@radix-ui/themes'
import { AuthProvider } from '@/context/AuthContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Theme appearance="dark" accentColor="gray" grayColor="slate">
      <AuthProvider>{children}</AuthProvider>
    </Theme>
  )
} 
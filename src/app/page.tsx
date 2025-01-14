'use client'

import { useAuth } from '@/context/AuthContext'
import Auth from '@/components/Auth'
import { supabase } from '@/lib/supabase'
import { Button, Text, Card } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import Blogs from '@/components/Blogs'
import ExportNotes from '@/components/ExportNotes'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a0a0a] text-gray-300">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <Card className="max-w-4xl mx-auto p-6 bg-[#141414] border border-[#262626]">
        <div className="flex justify-between items-center mb-6">
          <Text size="6" weight="bold">
            Welcome, {user.email}
          </Text>
          <div className="flex items-center gap-4">
            <ExportNotes />
            <Button
              onClick={handleSignOut}
              variant="soft"
              color="red"
            >
              Sign Out
            </Button>
          </div>
        </div>
        <Text color="gray">
          You are now signed in to your account!
        </Text>
      </Card>
      <Blogs />
    </div>
  )
}

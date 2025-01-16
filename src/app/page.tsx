'use client'

import { useAuth } from '@/context/AuthContext'
import Auth from '@/components/Auth'
import { supabase } from '@/lib/supabase'
import { Button, Text, Card } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import Blogs from '@/components/Blogs'
import ExportNotes from '@/components/ExportNotes'
import UserProfile from '@/components/UserProfile'
import ArticleRecommendations from '@/components/ArticleRecommendations'
import { useState } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showProfile, setShowProfile] = useState(false)

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
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Text size="6" weight="bold">
              Welcome, {user.email}
            </Text>
            <Button
              onClick={handleSignOut}
              variant="soft"
              color="red"
            >
              Sign Out
            </Button>
          </div>
          
          <div className="flex justify-between items-center border-t border-[#262626] pt-4">
            <Text color="gray">
              Manage your AI learning experience
            </Text>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowProfile(!showProfile)}
                variant="soft"
                color="blue"
                size="3"
              >
                {showProfile ? 'Hide AI Profile' : 'Setup AI Profile'}
              </Button>
              <ExportNotes />
            </div>
          </div>
        </div>
      </Card>
      
      {showProfile && <div className="mt-6"><UserProfile /></div>}
      <div className="mt-6"><ArticleRecommendations /></div>
      <Blogs />
    </div>
  )
}

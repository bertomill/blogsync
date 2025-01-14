'use client'

import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { Container, Button } from '@radix-ui/themes'
import './Auth.css'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          email_confirm: false
        }
      }
    })
    
    if (signUpError) {
      setError(signUpError.message)
    }
    setIsLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (signInError) {
      setError(signInError.message)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <Container size="1">
        <form className="AuthForm" onSubmit={(e) => e.preventDefault()}>
          <h2 className="text-xl font-semibold text-center text-white mb-6">
            Sign in to your account
          </h2>
          
          {error && (
            <div className="AuthError" role="alert">
              {error}
            </div>
          )}

          <div className="AuthField">
            <input
              type="email"
              className="AuthInput"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="AuthField">
            <input
              type="password"
              className="AuthInput"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Button
              size="3"
              onClick={handleSignIn}
              disabled={isLoading}
              className="AuthButton"
              data-state={isLoading ? 'loading' : 'idle'}
              style={{ 
                backgroundColor: '#2c2c2c',
                width: '100%',
                color: 'white'
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            
            <Button
              size="3"
              onClick={handleSignUp}
              disabled={isLoading}
              variant="outline"
              className="AuthButton"
              data-state={isLoading ? 'loading' : 'idle'}
              style={{ 
                borderColor: '#262626',
                width: '100%',
                color: 'white'
              }}
            >
              {isLoading ? 'Signing up...' : 'Sign up'}
            </Button>
          </div>
        </form>
      </Container>
    </div>
  )
} 
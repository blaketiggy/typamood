'use client'

import { useState } from 'react'
import { X, Mail, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      })

      if (error) {
        toast.error(error.message)
      } else {
        setIsEmailSent(true)
        toast.success('Check your email for the magic link!')
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetModal = () => {
    setEmail('')
    setIsEmailSent(false)
    setIsLoading(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black border-2 border-cyber-pink max-w-md w-full relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyber-pink">
          <h2 className="text-cyber-pink font-mono text-xl uppercase tracking-wider">
            {isEmailSent ? 'CHECK EMAIL' : 'ACCESS GRANTED'}
          </h2>
          <button
            onClick={resetModal}
            className="text-cyber-pink hover:text-neon-green transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isEmailSent ? (
            <>
              <p className="text-cyber-cyan font-mono mb-6 text-sm">
                ENTER YOUR EMAIL FOR PASSWORDLESS ACCESS // NO SIGNUP REQUIRED
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-cyber-cyan font-mono text-sm mb-2">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@typamood.com"
                    className="retro-input w-full"
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="retro-button w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      SENDING...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      SEND MAGIC LINK
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 font-mono">
                  BY CONTINUING, YOU AGREE TO THE DIGITAL REALM&apos;S TERMS
                </p>
              </div>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">📧</div>
              <h3 className="text-cyber-pink font-mono text-lg">
                MAGIC LINK SENT!
              </h3>
              <p className="text-cyber-cyan font-mono text-sm">
                CHECK YOUR EMAIL AND CLICK THE LINK TO ACCESS YOUR ACCOUNT
              </p>
              <p className="text-xs text-gray-400 font-mono">
                EMAIL: {email}
              </p>
              <button
                onClick={() => setIsEmailSent(false)}
                className="text-cyber-cyan hover:text-neon-green font-mono text-sm underline"
              >
                USE DIFFERENT EMAIL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
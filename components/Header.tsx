'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, User, LogOut } from 'lucide-react'
import AuthModal from './AuthModal'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  return (
    <>
      <header className="border-b-2 border-cyber-pink bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="text-cyber-pink font-bold text-xl font-mono neon-text">
              TYPAMOOD
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link 
                href="/explore" 
                className="text-cyber-cyan hover:text-neon-green transition-colors font-mono"
              >
                EXPLORE
              </Link>
              <Link 
                href="/my-boards" 
                className="text-cyber-cyan hover:text-neon-green transition-colors font-mono"
              >
                MY BOARDS
              </Link>
            </nav>

            {/* Auth Button */}
            <div className="hidden md:block">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="retro-button text-sm"
              >
                LOGIN
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-cyber-pink hover:text-neon-green transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-cyber-pink bg-black/95 backdrop-blur-sm">
              <nav className="py-4 space-y-4">
                <Link 
                  href="/explore" 
                  className="block text-cyber-cyan hover:text-neon-green transition-colors font-mono px-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  EXPLORE
                </Link>
                <Link 
                  href="/my-boards" 
                  className="block text-cyber-cyan hover:text-neon-green transition-colors font-mono px-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  MY BOARDS
                </Link>
                <div className="px-4">
                  <button
                    onClick={() => {
                      setIsAuthModalOpen(true)
                      setIsMenuOpen(false)
                    }}
                    className="retro-button text-sm w-full"
                  >
                    LOGIN
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  )
}
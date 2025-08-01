'use client'

import { useState } from 'react'
import { Plus, Link, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

interface URLInputProps {
  onAddImage: (url: string) => void
}

export default function URLInput({ onAddImage }: URLInputProps) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validateImageUrl = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url
      
      // Timeout after 10 seconds
      setTimeout(() => resolve(false), 10000)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setIsLoading(true)

    try {
      // Check if it's a valid image URL
      const isValidImage = await validateImageUrl(url)
      
      if (!isValidImage) {
        toast.error('URL does not point to a valid image')
        return
      }

      onAddImage(url)
      setUrl('')
      
    } catch (error) {
      toast.error('Failed to validate image URL')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasteExample = () => {
    const examples = [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29'
    ]
    
    const randomExample = examples[Math.floor(Math.random() * examples.length)]
    setUrl(randomExample)
    toast.success('Example URL pasted!')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="retro-input w-full"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="retro-button flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin" size={16} />
                VALIDATING...
              </>
            ) : (
              <>
                <Plus size={16} />
                ADD IMAGE
              </>
            )}
          </button>
        </div>
      </form>

      {/* Helper Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between text-sm">
        <p className="text-gray-400 font-mono">
          PASTE ANY IMAGE URL FROM THE WEB
        </p>
        <button
          onClick={handlePasteExample}
          className="text-cyber-cyan hover:text-neon-green font-mono text-sm underline flex items-center gap-1"
        >
          <Link size={14} />
          TRY EXAMPLE URL
        </button>
      </div>

      {/* URL Tips */}
      <div className="text-xs text-gray-500 font-mono space-y-1">
        <p>💡 TIPS FOR BEST RESULTS:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>USE DIRECT IMAGE URLS (ENDING IN .JPG, .PNG, .GIF, ETC.)</li>
          <li>UNSPLASH, PINTEREST, AND IMGUR URLS WORK GREAT</li>
          <li>AVOID URLS THAT REQUIRE LOGIN OR HAVE RESTRICTIONS</li>
          <li>HIGHER RESOLUTION IMAGES LOOK BETTER ON THE CANVAS</li>
        </ul>
      </div>
    </div>
  )
}
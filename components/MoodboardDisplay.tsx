'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, User, ExternalLink, Copy, Heart, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, extractDomainFromUrl, generateAltText, generateHashtags } from '@/lib/utils'

interface MoodboardDisplayProps {
  moodboard: {
    id: string
    title: string
    slug: string
    description: string | null
    canvas_data: any
    image_urls: string[]
    user_id: string
    created_at: string
    updated_at: string
    is_public: boolean
    profiles?: {
      email: string
    }
  }
}

export default function MoodboardDisplay({ moodboard }: MoodboardDisplayProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${moodboard.slug}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${moodboard.title} - TYPAMOOD`,
          text: moodboard.description || `Check out this retro moodboard created with TYPAMOOD`,
          url,
        })
        toast.success('Shared successfully!')
      } catch (error) {
        // User cancelled share or error occurred
      }
    } else {
      // Fallback to copying URL
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleCopyUrl = async (imageUrl: string) => {
    await navigator.clipboard.writeText(imageUrl)
    toast.success('Image URL copied!')
  }

  const hashtags = generateHashtags(moodboard.title)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <Link 
          href="/" 
          className="inline-block text-cyber-cyan hover:text-neon-green font-mono text-sm mb-4"
        >
          ← BACK TO TYPAMOOD
        </Link>
        
        <h1 className="glitch text-3xl md:text-5xl font-bold" data-text={moodboard.title}>
          {moodboard.title}
        </h1>
        
        {moodboard.description && (
          <p className="text-cyber-cyan text-lg font-mono max-w-3xl mx-auto">
            {moodboard.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 font-mono">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            {formatDate(moodboard.created_at)}
          </div>
          <div className="flex items-center gap-2">
            <User size={16} />
            {moodboard.profiles?.email?.split('@')[0] || 'Anonymous'}
          </div>
          <div className="flex items-center gap-2">
            <span>{moodboard.image_urls.length} IMAGES</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={handleShare}
            className="retro-button flex items-center gap-2"
          >
            <Share2 size={16} />
            SHARE
          </button>
        </div>
      </div>

      {/* Canvas Preview */}
      {moodboard.canvas_data && (
        <div className="border-2 border-cyber-pink bg-black/50 p-6">
          <h2 className="text-cyber-pink font-mono text-xl mb-4 uppercase">
            CANVAS COMPOSITION
          </h2>
          <div className="flex justify-center">
            <div className="border border-gray-600 bg-black">
              {/* TODO: Render canvas data or exported image */}
              <div className="w-full h-64 flex items-center justify-center text-gray-500 font-mono">
                CANVAS PREVIEW COMING SOON
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      <div className="border-2 border-electric-blue bg-black/50 p-6">
        <h2 className="text-electric-blue font-mono text-xl mb-6 uppercase">
          SOURCE IMAGES ({moodboard.image_urls.length})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {moodboard.image_urls.map((imageUrl, index) => (
            <div 
              key={index} 
              className="group relative border border-cyber-cyan bg-black overflow-hidden hover:border-neon-green transition-colors"
            >
              <img
                src={imageUrl}
                alt={generateAltText(imageUrl, index, moodboard.title)}
                className="w-full h-48 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                onClick={() => setSelectedImage(imageUrl)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/api/placeholder/300/200'
                }}
              />
              
              {/* Image Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => setSelectedImage(imageUrl)}
                  className="text-white hover:text-cyber-pink transition-colors p-2"
                  title="View full size"
                >
                  <ExternalLink size={20} />
                </button>
                <button
                  onClick={() => handleCopyUrl(imageUrl)}
                  className="text-white hover:text-cyber-pink transition-colors p-2"
                  title="Copy URL"
                >
                  <Copy size={20} />
                </button>
              </div>

              {/* Source Domain */}
              <div className="absolute bottom-2 left-2 bg-black/80 text-xs text-cyber-cyan font-mono px-2 py-1 rounded">
                {extractDomainFromUrl(imageUrl)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image URLs List */}
      <div className="border-2 border-sunset-orange bg-black/50 p-6">
        <h2 className="text-sunset-orange font-mono text-xl mb-4 uppercase">
          SOURCE URLS
        </h2>
        <div className="space-y-3">
          {moodboard.image_urls.map((url, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border border-gray-600 bg-black/50">
              <span className="text-gray-400 font-mono text-sm min-w-[3rem]">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <code className="flex-1 text-cyber-cyan font-mono text-sm break-all">
                {url}
              </code>
              <button
                onClick={() => handleCopyUrl(url)}
                className="text-gray-400 hover:text-cyber-pink transition-colors"
                title="Copy URL"
              >
                <Copy size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hashtags */}
      <div className="text-center">
        <div className="flex flex-wrap justify-center gap-2">
          {hashtags.map((tag, index) => (
            <span 
              key={index}
              className="text-cyber-cyan font-mono text-sm bg-black/50 border border-cyber-cyan px-3 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Full Size Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-full relative">
            <img
              src={selectedImage}
              alt="Full size image"
              className="max-w-full max-h-full object-contain border-2 border-cyber-pink"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-cyber-pink hover:text-black transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
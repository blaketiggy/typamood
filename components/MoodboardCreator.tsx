'use client'

import { useState, useRef } from 'react'
import { Plus, Download, Save, RotateCw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import CanvasEditor from './CanvasEditor'
import URLInput from './URLInput'

export default function MoodboardCreator() {
  const [images, setImages] = useState<string[]>([])
  const [isCanvasMode, setIsCanvasMode] = useState(false)
  const [moodboardTitle, setMoodboardTitle] = useState('')
  const canvasRef = useRef<any>(null)

  const handleAddImage = (url: string) => {
    if (!images.includes(url)) {
      setImages(prev => [...prev, url])
      toast.success('Image added to collection!')
    } else {
      toast.error('Image already in collection')
    }
  }

  const handleRemoveImage = (url: string) => {
    setImages(prev => prev.filter(img => img !== url))
    toast.success('Image removed')
  }

  const handleStartCreating = () => {
    if (images.length === 0) {
      toast.error('Add at least one image to start creating')
      return
    }
    setIsCanvasMode(true)
  }

  const handleSaveMoodboard = async () => {
    if (!moodboardTitle.trim()) {
      toast.error('Enter a title for your moodboard')
      return
    }
    
    // TODO: Implement save functionality with Supabase
    toast.success('Moodboard saved! (Feature coming soon)')
  }

  const handleExportImage = () => {
    if (canvasRef.current) {
      canvasRef.current.exportCanvas()
    }
  }

  if (isCanvasMode) {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Canvas Mode Header */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <input
              type="text"
              placeholder="ENTER MOODBOARD TITLE"
              value={moodboardTitle}
              onChange={(e) => setMoodboardTitle(e.target.value)}
              className="retro-input flex-1 max-w-md"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsCanvasMode(false)}
                className="text-cyber-cyan hover:text-neon-green font-mono text-sm border border-cyber-cyan px-4 py-2"
              >
                ← BACK TO IMAGES
              </button>
              <button
                onClick={handleSaveMoodboard}
                className="retro-button flex items-center gap-2"
              >
                <Save size={16} />
                SAVE
              </button>
              <button
                onClick={handleExportImage}
                className="bg-neon-green text-black border-2 border-neon-green px-4 py-2 font-mono uppercase hover:bg-black hover:text-neon-green transition-all"
              >
                <Download size={16} className="inline mr-2" />
                EXPORT
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Editor */}
        <CanvasEditor ref={canvasRef} images={images} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* URL Input Section */}
      <div className="border-2 border-cyber-cyan bg-black/50 p-6">
        <h2 className="text-cyber-cyan font-mono text-xl mb-4 uppercase tracking-wider">
          ADD IMAGES TO YOUR COLLECTION
        </h2>
        <URLInput onAddImage={handleAddImage} />
      </div>

      {/* Image Collection */}
      {images.length > 0 && (
        <div className="border-2 border-electric-blue bg-black/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-electric-blue font-mono text-lg uppercase">
              IMAGE COLLECTION ({images.length})
            </h3>
            <button
              onClick={handleStartCreating}
              className="retro-button flex items-center gap-2"
            >
              <Plus size={16} />
              START CREATING
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Moodboard image ${index + 1}`}
                  className="w-full h-32 object-cover border border-cyber-cyan"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/api/placeholder/150/150'
                  }}
                />
                <button
                  onClick={() => handleRemoveImage(url)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {images.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-600">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-cyber-cyan font-mono text-lg mb-2">
            NO IMAGES YET
          </h3>
          <p className="text-gray-400 font-mono text-sm">
            ADD SOME IMAGES FROM URLS TO START CREATING YOUR MOODBOARD
          </p>
        </div>
      )}
    </div>
  )
}
'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { fabric } from 'fabric'
import { RotateCw, Move, Square, Download, Trash2, Scissors } from 'lucide-react'
import toast from 'react-hot-toast'

interface CanvasEditorProps {
  images: string[]
}

const CanvasEditor = forwardRef<any, CanvasEditorProps>(({ images }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)
  const [canvasBackground, setCanvasBackground] = useState('#0a0a0a')

  useImperativeHandle(ref, () => ({
    exportCanvas: () => {
      if (fabricCanvasRef.current) {
        const dataURL = fabricCanvasRef.current.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 2
        })
        
        // Create download link
        const link = document.createElement('a')
        link.download = 'typamood-moodboard.png'
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('Moodboard exported!')
      }
    }
  }))

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      // Initialize Fabric.js canvas
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: canvasBackground,
      })

      // Set canvas selection styling
      fabric.Object.prototype.set({
        borderColor: '#ff00ff',
        cornerColor: '#00ffff',
        cornerSize: 10,
        transparentCorners: false,
        cornerStyle: 'rect',
        borderScaleFactor: 2,
      })

      fabricCanvasRef.current = canvas

      // Handle object selection
      canvas.on('selection:created', (e) => {
        setSelectedObject(e.selected?.[0] || null)
      })

      canvas.on('selection:updated', (e) => {
        setSelectedObject(e.selected?.[0] || null)
      })

      canvas.on('selection:cleared', () => {
        setSelectedObject(null)
      })

      // Cleanup
      return () => {
        canvas.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [canvasBackground])

  useEffect(() => {
    // Add images to canvas when images array changes
    if (fabricCanvasRef.current && images.length > 0) {
      images.forEach((imageUrl, index) => {
        fabric.Image.fromURL(imageUrl, (img) => {
          if (!fabricCanvasRef.current) return

          // Scale image to fit canvas reasonably
          const maxSize = 200
          const scale = Math.min(maxSize / img.width!, maxSize / img.height!)
          
          img.set({
            left: 50 + (index % 4) * 180,
            top: 50 + Math.floor(index / 4) * 180,
            scaleX: scale,
            scaleY: scale,
            selectable: true,
            hasControls: true,
            hasBorders: true,
          })

          fabricCanvasRef.current!.add(img)
          fabricCanvasRef.current!.renderAll()
        }, {
          crossOrigin: 'anonymous'
        })
      })
    }
  }, [images])

  const handleRotate = () => {
    if (selectedObject) {
      const currentAngle = selectedObject.angle || 0
      selectedObject.rotate(currentAngle + 15)
      fabricCanvasRef.current?.renderAll()
      toast.success('Image rotated!')
    } else {
      toast.error('Select an image first')
    }
  }

  const handleDelete = () => {
    if (selectedObject && fabricCanvasRef.current) {
      fabricCanvasRef.current.remove(selectedObject)
      setSelectedObject(null)
      toast.success('Image removed from canvas')
    } else {
      toast.error('Select an image first')
    }
  }

  const handleBringToFront = () => {
    if (selectedObject && fabricCanvasRef.current) {
      fabricCanvasRef.current.bringToFront(selectedObject)
      fabricCanvasRef.current.renderAll()
      toast.success('Brought to front!')
    }
  }

  const handleSendToBack = () => {
    if (selectedObject && fabricCanvasRef.current) {
      fabricCanvasRef.current.sendToBack(selectedObject)
      fabricCanvasRef.current.renderAll()
      toast.success('Sent to back!')
    }
  }

  const handleBackgroundChange = (color: string) => {
    setCanvasBackground(color)
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setBackgroundColor(color, () => {
        fabricCanvasRef.current!.renderAll()
      })
    }
  }

  const backgroundColors = [
    '#0a0a0a', '#1a1a1a', '#ffffff', '#ff00ff', '#00ffff', 
    '#39ff14', '#ff4500', '#8a2be2', '#ffd700', '#ff1493'
  ]

  return (
    <div className="space-y-6">
      {/* Canvas Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-4 border-2 border-cyber-cyan bg-black/50">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRotate}
            className="retro-button text-sm flex items-center gap-2"
            disabled={!selectedObject}
          >
            <RotateCw size={16} />
            ROTATE
          </button>
          
          <button
            onClick={handleDelete}
            className="bg-red-600 border-2 border-red-600 text-white px-4 py-2 font-mono text-sm uppercase hover:bg-black hover:text-red-600 transition-all disabled:opacity-50"
            disabled={!selectedObject}
          >
            <Trash2 size={16} className="inline mr-2" />
            DELETE
          </button>

          <button
            onClick={handleBringToFront}
            className="text-cyber-cyan border border-cyber-cyan px-4 py-2 font-mono text-sm hover:bg-cyber-cyan hover:text-black transition-all disabled:opacity-50"
            disabled={!selectedObject}
          >
            FRONT
          </button>

          <button
            onClick={handleSendToBack}
            className="text-cyber-cyan border border-cyber-cyan px-4 py-2 font-mono text-sm hover:bg-cyber-cyan hover:text-black transition-all disabled:opacity-50"
            disabled={!selectedObject}
          >
            BACK
          </button>
        </div>

        <div className="text-cyber-cyan font-mono text-sm">
          {selectedObject ? 'IMAGE SELECTED' : 'SELECT AN IMAGE TO EDIT'}
        </div>
      </div>

      {/* Background Colors */}
      <div className="p-4 border-2 border-electric-blue bg-black/50">
        <h3 className="text-electric-blue font-mono text-sm mb-3 uppercase">
          CANVAS BACKGROUND
        </h3>
        <div className="flex flex-wrap gap-2">
          {backgroundColors.map((color) => (
            <button
              key={color}
              onClick={() => handleBackgroundChange(color)}
              className={`w-8 h-8 border-2 ${
                canvasBackground === color ? 'border-neon-green' : 'border-gray-600'
              } hover:border-cyber-pink transition-colors`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex justify-center">
        <div className="border-2 border-cyber-pink bg-black p-4 cyber-grid">
          <canvas
            ref={canvasRef}
            className="border border-gray-600"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-gray-400 font-mono text-sm space-y-2">
        <p>💡 CLICK AND DRAG IMAGES TO MOVE THEM AROUND</p>
        <p>🔄 USE THE CORNER HANDLES TO RESIZE</p>
        <p>⚡ SELECT MULTIPLE IMAGES WITH CTRL/CMD + CLICK</p>
        <p>🎨 EXPERIMENT WITH DIFFERENT BACKGROUNDS</p>
      </div>
    </div>
  )
})

CanvasEditor.displayName = 'CanvasEditor'

export default CanvasEditor
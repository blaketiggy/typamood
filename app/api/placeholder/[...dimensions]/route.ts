import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { dimensions: string[] } }
) {
  const [width = '300', height = '200'] = params.dimensions
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0a0a0a" stroke="#ff00ff" stroke-width="2"/>
      <text x="50%" y="50%" font-family="monospace" font-size="16" fill="#00ffff" text-anchor="middle" dy="0.3em">
        IMAGE NOT FOUND
      </text>
      <text x="50%" y="70%" font-family="monospace" font-size="12" fill="#666" text-anchor="middle" dy="0.3em">
        ${width}x${height}
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
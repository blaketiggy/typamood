import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50) // Limit length
}

export function generateMoodboardSlug(title: string, images: string[]): string {
  const baseSlug = generateSlug(title)
  
  // Add a random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  
  return `${baseSlug}-${randomSuffix}`
}

export function generateAltText(imageUrl: string, index: number, title: string): string {
  // Extract potential descriptive words from URL
  const urlParts = imageUrl.split('/').pop()?.split('.')[0] || ''
  const descriptors = urlParts
    .replace(/[-_]/g, ' ')
    .replace(/[0-9]/g, '')
    .trim()
  
  if (descriptors && descriptors.length > 3) {
    return `${title} moodboard image featuring ${descriptors}`
  }
  
  return `Image ${index + 1} from ${title} moodboard - retro aesthetic inspiration`
}

export function generateDescription(title: string, images: string[]): string {
  const adjectives = [
    'stunning', 'vibrant', 'captivating', 'mesmerizing', 'artistic',
    'creative', 'inspiring', 'beautiful', 'curated', 'aesthetic'
  ]
  
  const themes = [
    '90s nostalgia', 'retro vibes', 'cyber aesthetic', 'neon dreams',
    'vintage inspiration', 'creative expression', 'visual storytelling',
    'artistic vision', 'mood inspiration', 'design elements'
  ]
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomTheme = themes[Math.floor(Math.random() * themes.length)]
  
  return `A ${randomAdjective} moodboard titled "${title}" featuring ${images.length} carefully selected images. Perfect for ${randomTheme} and creative inspiration. Created with TYPAMOOD's retro moodboard maker.`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return 'Unknown source'
  }
}

export function validateImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()
    
    // Check for common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
    const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext))
    
    // Allow known image hosting domains even without extensions
    const imageHosts = ['unsplash.com', 'imgur.com', 'pinterest.com', 'pexels.com']
    const isImageHost = imageHosts.some(host => urlObj.hostname.includes(host))
    
    return hasImageExtension || isImageHost
  } catch {
    return false
  }
}

export function generateHashtags(title: string): string[] {
  const words = title.toLowerCase().split(/\s+/)
  const hashtags = ['#typamood', '#moodboard', '#retro', '#90s', '#aesthetic']
  
  // Add words from title as hashtags (if suitable)
  words.forEach(word => {
    if (word.length > 3 && word.length < 15 && /^[a-zA-Z]+$/.test(word)) {
      hashtags.push(`#${word}`)
    }
  })
  
  return hashtags.slice(0, 8) // Limit to 8 hashtags
}
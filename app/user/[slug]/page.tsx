import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Metadata } from 'next'
import MoodboardDisplay from '@/components/MoodboardDisplay'
import { generateSlug } from '@/lib/utils'

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()
  
  const { data: moodboard } = await supabase
    .from('moodboards')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_public', true)
    .single()

  if (!moodboard) {
    return {
      title: 'Moodboard Not Found - TYPAMOOD',
      description: 'The requested moodboard could not be found.',
    }
  }

  const description = moodboard.description || `A retro moodboard created with TYPAMOOD featuring ${moodboard.image_urls?.length || 0} curated images`

  return {
    title: `${moodboard.title} - TYPAMOOD`,
    description,
    keywords: `moodboard, ${moodboard.title}, retro, 90s, aesthetic, design, creative`,
    openGraph: {
      title: `${moodboard.title} - TYPAMOOD`,
      description,
      type: 'website',
      images: moodboard.image_urls?.slice(0, 4) || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${moodboard.title} - TYPAMOOD`,
      description,
    },
  }
}

async function getMoodboard(slug: string) {
  const supabase = createClient()
  
  const { data: moodboard, error } = await supabase
    .from('moodboards')
    .select(`
      *,
      profiles (
        email
      )
    `)
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (error || !moodboard) {
    return null
  }

  return moodboard
}

export default async function MoodboardPage({ params }: PageProps) {
  const moodboard = await getMoodboard(params.slug)

  if (!moodboard) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: moodboard.title,
    description: moodboard.description || `A retro moodboard created with TYPAMOOD`,
    creator: {
      '@type': 'Person',
      email: moodboard.profiles?.email,
    },
    dateCreated: moodboard.created_at,
    dateModified: moodboard.updated_at,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/user/${moodboard.slug}`,
    image: moodboard.image_urls?.[0],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen cyber-grid">
        <div className="container mx-auto px-4 py-8">
          <MoodboardDisplay moodboard={moodboard} />
        </div>
      </main>
    </>
  )
}
import MoodboardCreator from '@/components/MoodboardCreator'
import Header from '@/components/Header'

export default function Home() {
  return (
    <main className="min-h-screen cyber-grid">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 
            className="glitch text-4xl md:text-6xl font-bold mb-4" 
            data-text="TYPAMOOD"
          >
            TYPAMOOD
          </h1>
          <p className="text-cyber-cyan text-lg md:text-xl font-mono max-w-2xl mx-auto">
            CREATE RETRO MOODBOARDS // DRAG & DROP IMAGES // 90&apos;S VIBES GUARANTEED
          </p>
        </div>
        
        <MoodboardCreator />
        
        <footer className="text-center mt-16 text-cyber-cyan font-mono">
          <p>&copy; 2024 TYPAMOOD // MADE WITH ❤️ IN THE DIGITAL REALM</p>
        </footer>
      </div>
    </main>
  )
}
// Real Supabase client using official library
const supabaseUrl = 'https://jjjfmsszuiofinrobgln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamZtc3N6dWlvZmlucm9iZ2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMDEwNDcsImV4cCI6MjA2OTY3NzA0N30.qRqM6YsrNgquw-2aA6WYzMqoq_PM82M5vz_rQ89GH94'

// Load Supabase from CDN
let supabase = null

async function initializeSupabase() {
  try {
    console.log('Loading Supabase from CDN...')
    
    // Try multiple CDN sources
    const cdnSources = [
      'https://unpkg.com/@supabase/supabase-js@2',
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
      'https://cdn.skypack.dev/@supabase/supabase-js@2'
    ]
    
    let createClient = null
    
    for (const cdnUrl of cdnSources) {
      try {
        console.log('Trying CDN:', cdnUrl)
        const module = await import(cdnUrl)
        createClient = module.createClient
        console.log('Successfully loaded from:', cdnUrl)
        break
      } catch (error) {
        console.log('Failed to load from:', cdnUrl, error.message)
      }
    }
    
    if (!createClient) {
      throw new Error('Failed to load Supabase from any CDN')
    }
    
    // Initialize Supabase client
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
    
    console.log('Supabase client initialized successfully')
    return supabase
    
  } catch (error) {
    console.error('Failed to initialize Supabase:', error)
    throw error
  }
}

// Initialize immediately
initializeSupabase().catch(console.error)

// Auth functions
export const auth = {
  // Sign up with email (passwordless)
  async signUp(email) {
    try {
      if (!supabase) {
        await initializeSupabase()
      }
      
      console.log('Signing up user:', email)
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/auth.html'
        }
      })
      
      console.log('Sign up result:', { data, error })
      return { data, error }
    } catch (error) {
      console.error('Sign up error:', error)
      return { data: null, error }
    }
  },

  // Sign in with email (passwordless)
  async signIn(email) {
    try {
      if (!supabase) {
        await initializeSupabase()
      }
      
      console.log('Signing in user:', email)
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/auth.html'
        }
      })
      
      console.log('Sign in result:', { data, error })
      return { data, error }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    }
  },

  // Sign out
  async signOut() {
    try {
      if (!supabase) {
        await initializeSupabase()
      }
      
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      if (!supabase) {
        await initializeSupabase()
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    try {
      if (!supabase) {
        console.warn('Supabase not initialized, cannot set up auth listener')
        return { data: { subscription: null } }
      }
      
      return supabase.auth.onAuthStateChange(callback)
    } catch (error) {
      console.error('Auth state change error:', error)
      return { data: { subscription: null } }
    }
  },

  // Check if user is anonymous (not signed in)
  async isAnonymous() {
    try {
      const user = await this.getCurrentUser()
      return !user
    } catch (error) {
      console.error('Is anonymous error:', error)
      return true
    }
  }
}

// API functions
export const api = {
  // Publish moodboard (works for both authenticated and anonymous users)
  async publishMoodboard(moodboardData) {
    try {
      const user = await auth.getCurrentUser()
      const userId = user ? user.id : 'anon'

      console.log('Publishing moodboard with userId:', userId)

      const response = await fetch('/.netlify/functions/server/api/publish-moodboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...moodboardData,
          userId: userId
        })
      })

      console.log('Publish response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('Publish error response:', error)
        throw new Error(error.error || 'Failed to publish moodboard')
      }

      const result = await response.json()
      console.log('Publish success:', result)
      return result
    } catch (error) {
      console.error('Publish moodboard error:', error)
      throw error
    }
  },

  // Get user's moodboards
  async getUserMoodboards() {
    try {
      const user = await auth.getCurrentUser()
      const userId = user ? user.id : 'anon'

      console.log('Fetching moodboards for userId:', userId)

      const response = await fetch(`/.netlify/functions/server/api/moodboards?userId=${userId}`)
      
      console.log('Get moodboards response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('Get moodboards error response:', error)
        throw new Error(error.error || 'Failed to fetch moodboards')
      }

      const result = await response.json()
      console.log('Get moodboards success:', result)
      return result
    } catch (error) {
      console.error('Get user moodboards error:', error)
      throw error
    }
  },

  // Get public moodboard
  async getPublicMoodboard(title) {
    try {
      console.log('Fetching public moodboard:', title)

      const response = await fetch(`/.netlify/functions/server/api/moodboard/${title}`)
      
      console.log('Get public moodboard response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('Get public moodboard error response:', error)
        throw new Error(error.error || 'Moodboard not found')
      }

      const result = await response.json()
      console.log('Get public moodboard success:', result)
      return result
    } catch (error) {
      console.error('Get public moodboard error:', error)
      throw error
    }
  },

  // Delete moodboard
  async deleteMoodboard(id) {
    try {
      const user = await auth.getCurrentUser()
      const userId = user ? user.id : 'anon'

      console.log('Deleting moodboard:', id, 'for userId:', userId)

      const response = await fetch(`/.netlify/functions/server/api/moodboard/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId
        })
      })

      console.log('Delete moodboard response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('Delete moodboard error response:', error)
        throw new Error(error.error || 'Failed to delete moodboard')
      }

      const result = await response.json()
      console.log('Delete moodboard success:', result)
      return result
    } catch (error) {
      console.error('Delete moodboard error:', error)
      throw error
    }
  }
}

// UI helpers
export const ui = {
  // Show notification
  showNotification(message, type = 'success') {
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">×</button>
    `
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 5000)
  },

  // Show loading state
  showLoading(element) {
    const originalText = element.textContent
    element.textContent = 'Loading...'
    element.disabled = true
    return () => {
      element.textContent = originalText
      element.disabled = false
    }
  },

  // Show anonymous user reminder
  showAnonymousReminder() {
    const reminder = document.createElement('div')
    reminder.className = 'anonymous-reminder'
    reminder.innerHTML = `
      <div class="reminder-content">
        <span>📝 You're creating as an anonymous user. <a href="/auth.html">Sign in</a> to save your moodboards permanently.</span>
        <button onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `
    document.body.appendChild(reminder)
  }
}

export { supabase } 
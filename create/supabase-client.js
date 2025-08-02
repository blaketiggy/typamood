// Supabase client for browser
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://jjjfmsszuiofinrobgln.supabase.co'
const supabaseKey = 'sb_publishable_lgn5i16l4EJYRfv3GLGlVA_Q7rYuLiv'
const supabase = createClient(supabaseUrl, supabaseKey)

// Auth functions
export const auth = {
  // Sign up with email (passwordless)
  async signUp(email) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/create/'
      }
    })
    return { data, error }
  },

  // Sign in with email (passwordless)
  async signIn(email) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/create/'
      }
    })
    return { data, error }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Check if user is anonymous (not signed in)
  isAnonymous() {
    return !supabase.auth.getUser()
  }
}

// API functions
export const api = {
  // Publish moodboard (works for both authenticated and anonymous users)
  async publishMoodboard(moodboardData) {
    const user = await auth.getCurrentUser()
    const userId = user ? user.id : 'anon'

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

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to publish moodboard')
    }

    return response.json()
  },

  // Get user's moodboards
  async getUserMoodboards() {
    const user = await auth.getCurrentUser()
    const userId = user ? user.id : 'anon'

    const response = await fetch(`/.netlify/functions/server/api/moodboards?userId=${userId}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch moodboards')
    }

    return response.json()
  },

  // Get public moodboard
  async getPublicMoodboard(title) {
    const response = await fetch(`/.netlify/functions/server/api/moodboard/${title}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Moodboard not found')
    }

    return response.json()
  },

  // Delete moodboard
  async deleteMoodboard(id) {
    const user = await auth.getCurrentUser()
    const userId = user ? user.id : 'anon'

    const response = await fetch(`/.netlify/functions/server/api/moodboard/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete moodboard')
    }

    return response.json()
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
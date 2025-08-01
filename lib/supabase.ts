import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      moodboards: {
        Row: {
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
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          canvas_data: any
          image_urls: string[]
          user_id: string
          created_at?: string
          updated_at?: string
          is_public?: boolean
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          canvas_data?: any
          image_urls?: string[]
          user_id?: string
          created_at?: string
          updated_at?: string
          is_public?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
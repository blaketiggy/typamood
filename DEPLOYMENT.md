# Deployment Guide: Typaboard to Netlify with Supabase

## Prerequisites
- Node.js installed
- Git repository
- Netlify account
- Supabase account

## Step 1: Set up Supabase

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `typaboard`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
5. Click "Create new project"

### 1.2 Set up Database Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL to create the moodboards table:

```sql
-- Create moodboards table
CREATE TABLE IF NOT EXISTS moodboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT,
  products JSONB DEFAULT '[]',
  canvas_size JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  public_url TEXT,
  is_public BOOLEAN DEFAULT false
);

-- Create RLS policies
ALTER TABLE moodboards ENABLE ROW LEVEL SECURITY;

-- Users can only see their own moodboards
CREATE POLICY "Users can view own moodboards" ON moodboards
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own moodboards
CREATE POLICY "Users can insert own moodboards" ON moodboards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own moodboards
CREATE POLICY "Users can update own moodboards" ON moodboards
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own moodboards
CREATE POLICY "Users can delete own moodboards" ON moodboards
  FOR DELETE USING (auth.uid() = user_id);

-- Anonymous users can insert moodboards (user_id is null)
CREATE POLICY "Anonymous users can insert moodboards" ON moodboards
  FOR INSERT WITH CHECK (user_id IS NULL);

-- Anonymous users can view their own moodboards (user_id is null)
CREATE POLICY "Anonymous users can view own moodboards" ON moodboards
  FOR SELECT USING (user_id IS NULL);

-- Anonymous users can delete their own moodboards (user_id is null)
CREATE POLICY "Anonymous users can delete own moodboards" ON moodboards
  FOR DELETE USING (user_id IS NULL);

-- Public moodboards can be viewed by everyone
CREATE POLICY "Public moodboards are viewable by everyone" ON moodboards
  FOR SELECT USING (is_public = true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_moodboards_updated_at 
  BEFORE UPDATE ON moodboards 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.3 Set up Storage
1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Name: `moodboard-images`
4. Make it **Public**
5. Click **Create bucket**

### 1.4 Configure Authentication
1. Go to **Authentication** → **Settings**
2. Configure your site URL (you'll get this from Netlify)
3. Add redirect URLs:
   - `https://your-site.netlify.app/auth.html`
   - `https://your-site.netlify.app/create/`
4. **Enable Email OTP**: Go to **Authentication** → **Providers** → **Email** and enable "Enable email confirmations"
5. Save settings

### 1.5 Get API Keys
1. Go to **Settings** → **API**
2. Copy your:
   - **Project URL**
   - **Anon public key**

## Step 2: Update Configuration Files

### 2.1 Update Supabase Client
Edit `create/supabase-client.js`:
```javascript
const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
```

### 2.2 Update Environment Variables
Create `.env` file (for local development):
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 3: Deploy to Netlify

### 3.1 Install Netlify CLI
```bash
npm install -g netlify-cli
```

### 3.2 Login to Netlify
```bash
netlify login
```

### 3.3 Initialize Netlify
```bash
netlify init
```

### 3.4 Set Environment Variables
```bash
netlify env:set SUPABASE_URL your_supabase_project_url
netlify env:set SUPABASE_ANON_KEY your_supabase_anon_key
```

### 3.5 Deploy
```bash
netlify deploy --prod
```

## Step 4: Configure Netlify

### 4.1 Set up Functions
1. Go to your Netlify dashboard
2. Navigate to **Functions**
3. Verify your serverless function is deployed

### 4.2 Configure Redirects
1. Go to **Site settings** → **Redirects**
2. Add redirect rules:
   - From: `/api/*` → To: `/.netlify/functions/server`
   - From: `/*` → To: `/index.html`

### 4.3 Set Environment Variables in Netlify Dashboard
1. Go to **Site settings** → **Environment variables**
2. Add:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key

## Step 5: Test Your Deployment

### 5.1 Test Anonymous Creation
1. Visit your Netlify site
2. Click "Start Creating" without signing in
3. Create a moodboard and publish it
4. Verify it's saved with `user_id = null`

### 5.2 Test Passwordless Authentication
1. Click "Sign In" on the landing page
2. Enter your email address
3. Check your email for the magic link
4. Click the link to sign in
5. Verify you're redirected back to the create page

### 5.3 Test Moodboard Creation (Signed In)
1. Create a moodboard while signed in
2. Add images and publish
3. Verify it's saved with your user ID

### 5.4 Test Public Pages
1. Visit the published moodboard URL
2. Verify the image loads
3. Check product links

## Features Overview

### Anonymous Users
- ✅ Can create moodboards without signing up
- ✅ Moodboards saved with `user_id = null`
- ✅ Anonymous reminder appears after 2 seconds
- ✅ Can publish and share moodboards

### Passwordless Authentication
- ✅ Email-only sign in (no passwords)
- ✅ Magic link sent to email
- ✅ Automatic redirect after sign in
- ✅ Seamless user experience

### User Experience
- ✅ Clean, Notion-inspired design
- ✅ Mobile-first responsive design
- ✅ Touch and mouse gesture support
- ✅ Product URL extraction (Amazon, Dior, etc.)
- ✅ Copy/paste image support

## Troubleshooting

### Common Issues

#### 1. CORS Errors
- Ensure your Supabase project URL is correct
- Check that your Netlify domain is added to Supabase auth settings

#### 2. Function Not Found
- Verify the `functions/` directory exists
- Check that `netlify.toml` is configured correctly
- Ensure all dependencies are in `package.json`

#### 3. Database Connection Issues
- Verify your Supabase credentials
- Check that RLS policies are set up correctly
- Ensure the moodboards table exists

#### 4. Storage Issues
- Verify the `moodboard-images` bucket exists
- Check that the bucket is public
- Ensure proper CORS settings

#### 5. Email OTP Not Working
- Check Supabase Email settings
- Verify redirect URLs are correct
- Check spam folder for magic links

### Debug Commands

```bash
# Check Netlify function logs
netlify functions:list
netlify functions:invoke server

# Check environment variables
netlify env:list

# Redeploy functions
netlify deploy --prod --functions
```

## Security Considerations

1. **Environment Variables**: Never commit API keys to Git
2. **RLS Policies**: Ensure proper row-level security
3. **CORS**: Configure allowed origins properly
4. **Rate Limiting**: Consider adding rate limiting for production
5. **Anonymous Data**: Anonymous moodboards are temporary and not tied to users

## Performance Optimization

1. **Image Optimization**: Consider compressing images before upload
2. **CDN**: Netlify provides global CDN
3. **Caching**: Implement proper caching headers
4. **Database Indexing**: Add indexes for frequently queried columns

## Monitoring

1. **Netlify Analytics**: Monitor site performance
2. **Supabase Dashboard**: Monitor database usage
3. **Error Tracking**: Consider adding error tracking (Sentry, etc.)

## Next Steps

1. **Custom Domain**: Set up a custom domain
2. **SSL Certificate**: Netlify provides automatic SSL
3. **Analytics**: Add Google Analytics or similar
4. **Backup Strategy**: Set up database backups
5. **Monitoring**: Add uptime monitoring
6. **User Management**: Add user profile pages
7. **Moodboard Gallery**: Show user's saved moodboards 
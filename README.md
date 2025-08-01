# TYPAMOOD - Retro Moodboard Creator

![TYPAMOOD Logo](https://via.placeholder.com/800x200/0a0a0a/ff00ff?text=TYPAMOOD+%2F%2F+90s+VIBES)

> Create stunning retro moodboards with a 90's aesthetic. Add images from URLs, manipulate them on a canvas, and share your creations with the world.

## ✨ Features

- 🎨 **Canvas Editor**: Drag, resize, rotate, and arrange images on an interactive canvas
- 🔗 **URL Image Import**: Add images directly from web URLs with validation
- 📱 **Mobile-First Design**: Responsive interface optimized for all devices
- 🎯 **90's Aesthetic**: Retro cyber-punk styling with neon colors and geometric patterns
- 🔐 **Passwordless Auth**: Email-based authentication via Supabase
- 🌐 **Static Pages**: Auto-generated slugs for shareable moodboard URLs
- 🏷️ **Auto Meta Tags**: Automatic SEO optimization and alt text generation
- 💾 **Export Functionality**: Download your moodboards as high-quality images
- 🔄 **Real-time Manipulation**: Instant feedback for all image operations

## 🚀 Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom retro theme
- **Canvas**: Fabric.js for image manipulation
- **Authentication**: Supabase Auth (passwordless)
- **Database**: Supabase PostgreSQL
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/typamood.git
   cd typamood
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your URL and anon key
   - Run the SQL setup script in the Supabase SQL editor:
     ```sql
     -- Copy and paste the contents of supabase-setup.sql
     ```

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
typamood/
├── app/
│   ├── api/                    # API routes
│   ├── auth/                   # Authentication pages
│   ├── user/[slug]/           # Dynamic moodboard pages
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Homepage
├── components/
│   ├── AuthModal.tsx          # Authentication modal
│   ├── CanvasEditor.tsx       # Canvas manipulation component
│   ├── Header.tsx             # Navigation header
│   ├── MoodboardCreator.tsx   # Main creator interface
│   ├── MoodboardDisplay.tsx   # Moodboard viewing component
│   └── URLInput.tsx           # URL input with validation
├── lib/
│   ├── supabase.ts           # Supabase client config
│   ├── supabase-server.ts    # Server-side Supabase client
│   └── utils.ts              # Utility functions
├── supabase-setup.sql        # Database schema
└── README.md
```

## 🎯 Usage

### Creating a Moodboard

1. **Add Images**: Paste image URLs or use example URLs
2. **Start Creating**: Click "START CREATING" to enter canvas mode
3. **Manipulate Images**: Drag, resize, rotate, and layer your images
4. **Customize Background**: Choose from retro color palette
5. **Export**: Download your creation as a PNG file
6. **Save & Share**: Save to get a shareable URL

### Canvas Controls

- **Move**: Click and drag images around the canvas
- **Resize**: Use corner handles to scale images
- **Rotate**: Select an image and click the rotate button
- **Layer**: Bring images to front or send to back
- **Delete**: Remove selected images from canvas

## 🎨 Styling Guide

The project uses a custom 90's-inspired color palette:

```css
--cyber-pink: #FF00FF
--cyber-cyan: #00FFFF  
--neon-green: #39FF14
--electric-blue: #0080FF
--sunset-orange: #FF4500
--retro-purple: #8A2BE2
--vintage-yellow: #FFD700
--matrix-green: #00FF41
```

## 🔐 Authentication

TYPAMOOD uses Supabase's passwordless authentication:

- Users enter their email address
- Magic link is sent to their email
- Clicking the link logs them in
- No passwords required!

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Heroku
- AWS Amplify

## 🛡️ Database Schema

The app uses two main tables:

- **profiles**: User information linked to Supabase auth
- **moodboards**: Moodboard data with canvas state and metadata

All tables use Row Level Security (RLS) for data protection.

## 🎭 Features Roadmap

- [ ] Background removal/transparency tools
- [ ] More canvas shapes and elements
- [ ] Collaborative moodboards
- [ ] Collections and folders
- [ ] Advanced image filters
- [ ] Video/GIF support
- [ ] Print-ready exports
- [ ] API for developers

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

If you have any questions or need help:

- Create an issue on GitHub
- Join our Discord community
- Email us at hello@typamood.com

## 🎉 Acknowledgments

- [Fabric.js](http://fabricjs.com/) for canvas manipulation
- [Supabase](https://supabase.com/) for backend services
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Next.js](https://nextjs.org/) for the React framework
- [Lucide](https://lucide.dev/) for beautiful icons

---

**Made with ❤️ and 90's nostalgia**

*TYPAMOOD - Where creativity meets retro vibes*

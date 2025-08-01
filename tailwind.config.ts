import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // 90's inspired palette
        'cyber-pink': '#FF00FF',
        'cyber-cyan': '#00FFFF',
        'neon-green': '#39FF14',
        'electric-blue': '#0080FF',
        'sunset-orange': '#FF4500',
        'retro-purple': '#8A2BE2',
        'vintage-yellow': '#FFD700',
        'matrix-green': '#00FF41',
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
        'pixel': ['monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          'from': { 'text-shadow': '0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 15px #ff00ff' },
          'to': { 'text-shadow': '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      boxShadow: {
        'neon': '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
        'retro': '5px 5px 0px 0px rgba(0,0,0,0.8)',
      }
    },
  },
  plugins: [],
};

export default config;
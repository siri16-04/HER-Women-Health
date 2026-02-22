/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          light: '#74AC82',
          dark: '#164A31',
          50: '#f0f7f2',
          100: '#dceee1',
          200: '#b9dcc3',
          300: '#8fc49e',
          400: '#74AC82',
          500: '#4a9362',
          600: '#357549',
          700: '#2a5d3b',
          800: '#164A31',
          900: '#0f3422',
        },
        // Clinical color palette (keeping for compatibility)
        clinical: {
          50: '#f0f7f2',
          100: '#dceee1',
          200: '#b9dcc3',
          300: '#8fc49e',
          400: '#74AC82',
          500: '#4a9362',
          600: '#357549',
          700: '#2a5d3b',
          800: '#164A31',
          900: '#0f3422',
        },
        // Soft healing tones (mapped to brand)
        healing: {
          50: '#f0f7f2',
          100: '#dceee1',
          200: '#b9dcc3',
          300: '#8fc49e',
          400: '#74AC82',
          500: '#4a9362',
          600: '#357549',
          700: '#2a5d3b',
          800: '#164A31',
          900: '#0f3422',
        },
        // Warm accent for urgency
        warmth: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Neutral grays
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 24px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.1)',
        'clinical': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'clinical-lg': '0 8px 40px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}

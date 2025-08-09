/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom brand colors as specified in TRS Section 8
      colors: {
        'brand-green': '#10b981',
        'brand-amber': '#f59e0b', 
        'brand-red': '#ef4444',
        'brand-gray': '#6b7280',
        // Stream-specific colors for Oil, Export Gas, Domestic Gas
        'oil': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#075985',
          600: '#0369a1',
          700: '#0284c7',
          800: '#0369a1',
          900: '#0c4a6e',
        },
        'exportgas': {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#065f46',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        'domgas': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#6b21a8',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      // Custom font family
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  // Dark mode support for cards
  darkMode: 'class',
} 
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: '#38BDF8', // Ice Blue for dark mode
          light: '#0EA5E9',   // Glacier Blue for light mode
        },
        // Secondary colors
        secondary: {
          DEFAULT: '#8B5CF6', // Purple for dark mode
          light: '#6366F1',   // Indigo for light mode
        },
        // Background colors
        background: '#F9FAFB',  // Default background
        'background-dark': '#121826',
        'background-light': '#F9FAFB',
        'ring-offset-background': '#F9FAFB',
        'ring-offset-background-dark': '#121826',
        'ring-offset-background-light': '#F9FAFB',
        // Card colors
        card: '#FFFFFF',
        'card-dark': '#1F2937',
        'card-light': '#FFFFFF',
        // Border colors
        border: '#E5E7EB',
        'border-dark': '#374151',
        'border-light': '#E5E7EB',
        // Status colors
        warning: {
          DEFAULT: '#F59E0B', // Dark mode
          light: '#D97706',   // Light mode
        },
        error: {
          DEFAULT: '#EF4444', // Dark mode
          light: '#DC2626',   // Light mode
        },
        success: {
          DEFAULT: '#10B981', // Dark mode
          light: '#059669',   // Light mode
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      transitionDuration: {
        '250': '250ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
}
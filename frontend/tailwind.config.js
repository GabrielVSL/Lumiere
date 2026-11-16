/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        editorial: ['"Cormorant Garamond"', '"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        lumiere: {
          orange: '#e04f26',
          coral: '#ff6738',
          gold: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}

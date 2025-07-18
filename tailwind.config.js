/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-black': '#121212',
        'app-gray': {
          light: '#383838',
          DEFAULT: '#282828',
          dark: '#1e1e1e'
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}

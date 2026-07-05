/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slateBg: '#0B0F19',
        electricPurple: '#A855F7',
        neonBlue: '#06B6D4'
      }
    },
  },
  plugins: [],
}

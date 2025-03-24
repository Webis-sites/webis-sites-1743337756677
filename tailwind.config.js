/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    '*/node_modules/**/*'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#2563eb', // כחול בהיר
        },
        secondary: {
          500: '#1e40af', // כחול כהה
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F8FAF5',
        'green-primary': '#4CAF50',
        'green-dark': '#2E5E3E'
      },
      borderRadius: {
        '2xl': '24px',
        '3xl': '28px'
      }
    }
  },
  plugins: []
}

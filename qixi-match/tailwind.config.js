/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'qixi-pink': '#ff6b9d',
        'qixi-purple': '#c44569',
        'qixi-blue': '#4ecdc4',
        'qixi-gold': '#ffe66d',
      },
    },
  },
  plugins: [],
}
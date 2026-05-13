/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        verixa: {
          bg: '#0a0a0f',
          surface: '#13131a',
          surface2: '#1a1a24',
          accent: '#c9a96e',
          text: '#f5f3ef',
          text2: 'rgba(245,243,239,0.65)',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

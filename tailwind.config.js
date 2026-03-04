/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fire: {
          50:  '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffc071',
          400: '#ff9b38',
          500: '#ff7d11',
          600: '#f06107',
          700: '#c74908',
          800: '#9e3a0f',
          900: '#7f3110',
        },
      },
    },
  },
  plugins: [],
}

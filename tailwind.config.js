/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36a8f7',
          500: '#0c8de6',
          600: '#006fc4',
          700: '#01589f',
          800: '#054b83',
          900: '#0a3f6e',
          950: '#062849',
        },
      },
    },
  },
  plugins: [],
};

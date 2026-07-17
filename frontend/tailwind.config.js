/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        royal: {
          50: '#e6e9ff',
          100: '#bcc3ff',
          200: '#939dff',
          300: '#6a77ff',
          400: '#4151ff',
          500: '#1e2bff',
          600: '#0022e6',
          700: '#001ab3',
          800: '#001380',
          900: '#000d4d',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
    },
  },
  plugins: [],
}

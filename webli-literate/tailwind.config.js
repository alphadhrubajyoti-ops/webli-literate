/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0E2742',
        paper: '#FAFAF6',
        brand: {
          50: '#EEF6FC',
          100: '#DCEBF7',
          200: '#B9D7EF',
          300: '#8CBEE4',
          500: '#2F7CC4',
          600: '#1F6BB5',
          700: '#18568F',
          800: '#154573',
          900: '#0E2742',
        },
        teal: { 50: '#E9F7F7', 100: '#CDEEED', 500: '#3FB8B5', 600: '#2A9C99', 700: '#217B79' },
        spark: { 50: '#FFF3E8', 100: '#FDE2C8', 400: '#F7AB68', 500: '#F59A4B', 600: '#D9782A', 700: '#A85A1B' },
      },
      fontFamily: {
        display: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(14,39,66,.06), 0 8px 24px -12px rgba(14,39,66,.18)',
        lift: '0 2px 4px rgba(14,39,66,.08), 0 18px 36px -16px rgba(14,39,66,.28)',
      },
    },
  },
  plugins: [],
};

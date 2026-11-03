/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#F1F3EE',
        ink: { DEFAULT: '#14211B', soft: '#5A675F' },
        pine: { 50: '#E6F0EB', 100: '#CFE3D9', 600: '#1E5B47', 700: '#174737', 800: '#10372A' },
        dust: { 50: '#FFF6DC', 100: '#FDE9AE', 400: '#E8A317', 700: '#7A5200' },
        alarm: { 50: '#FCECE8', 600: '#B3341F' },
      },
      boxShadow: {
        lift: '0 1px 0 rgba(20,33,27,0.06), 0 8px 24px -12px rgba(20,33,27,0.25)',
      },
    },
  },
  plugins: [],
};

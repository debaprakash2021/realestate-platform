/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(135deg, #fdf4ff 0%, #f8faff 35%, #fff1f2 70%, #f0f9ff 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.75))',
        'hero-gradient': 'linear-gradient(135deg, #fff1f2 0%, #fdf4ff 50%, #f0f9ff 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
        'card': '0 4px 24px rgba(0,0,0,0.07)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.12)',
        'glow-rose': '0 4px 20px rgba(244,63,94,0.35)',
      },
      backdropBlur: {
        xs: '4px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'fade-in-up': 'fadeInUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'float': 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

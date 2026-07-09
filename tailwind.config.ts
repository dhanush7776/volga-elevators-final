import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050B12',
          900: '#0A1420',
          800: '#0F1E2E',
          700: '#152A3D',
        },
        mint: {
          50: '#EAFFFB',
          100: '#D3FFF6',
          200: '#A7FEEB',
          300: '#6EF5DC',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0B7A70',
          800: '#0A5F58',
          900: '#083F3B',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      backgroundImage: {
        'aurora-gradient':
          'radial-gradient(circle at 20% 20%, rgba(45,212,191,0.16), transparent 45%), radial-gradient(circle at 80% 0%, rgba(167,254,235,0.10), transparent 40%), radial-gradient(circle at 50% 100%, rgba(13,148,136,0.14), transparent 50%)',
        'mint-line': 'linear-gradient(90deg, #0D9488 0%, #2DD4BF 50%, #A7FEEB 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0,0,0,0.35)',
        'glow-mint': '0 0 24px rgba(45,212,191,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        elevator: {
          '0%, 100%': { top: '4px' },
          '50%': { top: 'calc(100% - 32px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        shimmer: 'shimmer 2s linear infinite',
        elevator: 'elevator 2.4s cubic-bezier(0.65,0,0.35,1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;

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
          950: '#0A0A0A',
          900: '#141414',
          800: '#1F1F1F',
          700: '#2A2A2A',
        },
        mint: {
          50: '#FAFAFA',
          100: '#F0F0F0',
          200: '#D9D9D9',
          300: '#BFBFBF',
          400: '#A0A0A0',
          500: '#808080',
          600: '#5C5C5C',
          700: '#404040',
          800: '#2A2A2A',
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      backgroundImage: {
        'aurora-gradient':
          'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12), transparent 45%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.08), transparent 40%), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.10), transparent 50%)',
        'mint-line': 'linear-gradient(90deg, #404040 0%, #808080 50%, #D9D9D9 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0,0,0,0.35)',
        'glow-mint': '0 0 24px rgba(255,255,255,0.25)',
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

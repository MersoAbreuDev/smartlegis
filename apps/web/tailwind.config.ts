import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0B3C6D',
        secondary: '#12263A',
        accent: '#D4AF37',
        surface: '#F4F6F8',
        text: '#475569',
        approved: '#10B981',
        rejected: '#EF4444',
        pending: '#F2B705'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.10)'
      },
      borderRadius: {
        smart: '8px'
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ministry: {
          green: '#006C67', 'green-deep': '#004F4B',
          'green-light': '#E8F0EE', 'green-soft': '#F0F7F5',
          olive: '#8B7942', 'olive-light': '#D4C9A8',
        },
        status: {
          critical: '#D32F2F', high: '#F57C00', medium: '#FBC02D',
          low: '#388E3C', info: '#1976D2',
        },
        background: { DEFAULT: '#FAFAF7', card: '#FFFFFF', alt: '#F7F7F4' },
        border: { DEFAULT: '#E5E3DA', strong: '#C5C3BA' },
        text: { primary: '#2C2C2A', secondary: '#5F5F5C', muted: '#8A8A85' },
      },
      fontFamily: { sans: ['var(--font-tajawal)', 'Tajawal', 'system-ui', 'sans-serif'] },
      boxShadow: {
        soft: '0 1px 3px 0 rgba(0, 108, 103, 0.08), 0 1px 2px 0 rgba(0, 108, 103, 0.05)',
        medium: '0 4px 8px -2px rgba(0, 108, 103, 0.12), 0 2px 4px -1px rgba(0, 108, 103, 0.07)',
        strong: '0 10px 25px -5px rgba(0, 108, 103, 0.18), 0 4px 10px -3px rgba(0, 108, 103, 0.09)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
export default config;

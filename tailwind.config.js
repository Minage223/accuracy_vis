/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bias: {
          bg:      '#F5F1EC',   // gray — page background
          surface: '#FFFFFF',   // white — card surfaces
          border:  '#DDD5CB',   // warm gray — borders & dividers
          text:    '#2B2D42',   // deep navy — primary text
          muted:   '#3A3540',   // dark — secondary text

          // data accent colours
          red:     '#A85454',   // deep rose — disparity warnings
          orange:  '#A8856E',   // deep warm beige — proxy highlights
          blue:    '#5B7499',   // deep slate — interactive / info
          green:   '#5A8A6E',   // deep sage — positive / low-disparity
          purple:  '#7A6E7A',   // deep fog purple — callouts
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up':    'fadeInUp 0.6s ease-out forwards',
        'pulse-glow':    'pulseGlow 2s ease-in-out infinite',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'slide-in-right':'slideInRight 0.5s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(168,84,84,0)' },
          '50%':      { boxShadow: '0 0 16px 4px rgba(168,84,84,0.25)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}

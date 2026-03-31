/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07070F',
        surface: '#0F0F1A',
        surface2: '#161625',
        border: 'rgba(255,255,255,0.07)',
        accent: '#7C3AED',
        accent2: '#6366F1',
        accent3: '#A78BFA',
        cyan: '#22D3EE',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ["'SF Mono'", "'Fira Code'", 'Consolas', 'monospace'],
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'blob1': 'blob1 20s ease-in-out infinite',
        'blob2': 'blob2 17s ease-in-out infinite',
        'blob3': 'blob3 23s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'fade-in': 'fadeIn 0.3s ease',
        'blink': 'blink 1s step-end infinite',
        'bounce-dot': 'bounceDot 1.2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 20px rgba(124,58,237,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(124,58,237,0.8), 0 0 60px rgba(99,102,241,0.4)' },
        },
        blob1: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(80px,40px) scale(1.15)' },
          '66%': { transform: 'translate(-40px,80px) scale(0.9)' },
        },
        blob2: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '40%': { transform: 'translate(-60px,-40px) scale(1.1)' },
          '70%': { transform: 'translate(60px,-20px) scale(0.95)' },
        },
        blob3: {
          '0%,100%': { transform: 'translate(-50%,-50%) scale(1)' },
          '50%': { transform: 'translate(-50%,-50%) scale(1.2)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        blink: {
          '0%,49%': { opacity: '1' },
          '50%,100%': { opacity: '0' },
        },
        bounceDot: {
          '0%,60%,100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-8px)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

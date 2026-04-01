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
        'blink': 'blink 1s step-end infinite',
        'bounce-dot': 'bounceDot 1.2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        blink: {
          '0%,49%': { opacity: '1' },
          '50%,100%': { opacity: '0' },
        },
        bounceDot: {
          '0%,60%,100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-8px)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

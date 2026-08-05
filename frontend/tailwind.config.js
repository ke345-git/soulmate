/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 温暖柔和的配色方案
        warmth: {
          50: '#fef7f2',
          100: '#fdede0',
          200: '#fbd9c0',
          300: '#f7be94',
          400: '#f29d66',
          500: '#ec7d3e',
          600: '#d9652e',
          700: '#b44e27',
          800: '#914026',
          900: '#753722',
          950: '#3f1a0e',
        },
        rose: {
          50: '#fff1f3',
          100: '#ffe4e9',
          200: '#fecdd5',
          300: '#fda4b3',
          400: '#fb7189',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be122f',
          800: '#9f1229',
          900: '#881327',
        },
        cream: {
          50: '#fefdfb',
          100: '#fdf9f0',
          200: '#faf0db',
          300: '#f5e4be',
          400: '#efd39c',
          500: '#e8c07a',
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

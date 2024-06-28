import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    container: {
      center: true,
    },
    fontFamily: {
      display: ['Montserrat', 'sans-serif'],
      body: ['"Open Sans"', 'sans-serif'],
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      purple: {
        DEFAULT: '#4F22D7',
        50: '#F8F6FF',
        100: '#EEEBFF',
        300: '#CFBFFF',
        500: '#B39AFF',
        600: '#7355ED',
        700: '#4F22D7',
        900: '#361A8C',
      },
      grey: {
        100: '#F4F7FA',
        300: '#D3DAE0',
        500: '#8A95A0',
        700: '#4F5763',
      },
      blue: {
        100: '#E9F2FF',
        500: '#0B4EC7',
        700: '#0E2A87',
      },
      green: {
        100: '#E4F4E0',
        500: '#368704',
        700: '#1D5701',
      },
      orange: {
        100: '#FFF0CD',
        500: '#DA7C00',
        700: '#7A2D00',
      },
      red: {
        100: '#FFE3E3',
        500: '#C70000',
        700: '#940000',
      },
      yellow: {
        100: '#FFF6C6',
        500: '#FFD601',
        700: '#665606',
      },
      navy: '#00214D',
      white: '#FFFFFF',
      black: {
        DEFAULT: '#0F1218',
      },
    },
  },
  plugins: [],
} satisfies Config;

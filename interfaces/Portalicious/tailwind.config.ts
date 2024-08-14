import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

export default {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    container: {
      center: true,
    },
    fontFamily: {
      display: ['Montserrat', 'sans-serif'],
      body: ['"Open Sans"', 'sans-serif'],
      mono: ['monospace'],
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
    headingSizes: {
      1: '1.43rem', // ~20px
      2: '1.28rem', // ~18px
      3: '1.15rem', // ~16px
    },
    typographySizes: {
      s: '0.85rem', // ~12px
      m: '1rem', // ~14px
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      // heading utilities
      matchUtilities(
        {
          // Use like 'txt-h-1' or 'txt-h-2' or 'txt-h-3'
          ['txt-h']: (value: string) => ({
            fontSize: value,
            fontFamily: theme('fontFamily.display'),
            lineHeight: '140%',
          }),
        },
        { values: theme('headingSizes') },
      );
      // body text utilities
      matchUtilities(
        {
          // Use like 'txt-body-s' or 'txt-body-m'
          ['txt-body']: (value: string) => ({
            fontSize: value,
            fontFamily: theme('fontFamily.body'),
            lineHeight: value === '1rem' ? '140%' : '120%',
            letterSpacing: '0px',
          }),
        },
        { values: theme('typographySizes') },
      );
      // system text utilities
      // This is the only one that needs a different variant for bold text
      // because system texts don't default to 400 font weight
      matchUtilities(
        {
          // Use like 'txt-system-s' or 'txt-system-m'
          ['txt-system']: (value: string) => ({
            fontSize: value,
            fontFamily: theme('fontFamily.display'),
            lineHeight: '140%',
            letterSpacing: '0px',
            fontWeight: '500',
          }),
        },
        { values: theme('typographySizes') },
      );
      matchUtilities(
        {
          // Use like 'txt-system-bold-s' or 'txt-system-bold-m'
          ['txt-system-bold']: (value: string) => ({
            fontSize: value,
            fontFamily: theme('fontFamily.display'),
            lineHeight: '140%',
            letterSpacing: '0px',
            fontWeight: '700',
          }),
        },
        { values: theme('typographySizes') },
      );
    }),
  ],
} satisfies Config;

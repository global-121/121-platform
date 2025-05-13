import pluginGridAreas from '@savvywombat/tailwindcss-grid-areas';
import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    container: {
      center: true,
    },
    fontFamily: {
      // See loading of font-files in: src/fonts.css
      display: ['Montserrat', 'sans-serif'],
      body: ['"Open Sans"', 'sans-serif'],
      mono: ['monospace'],
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      purple: {
        DEFAULT: '#4F22D7',
        50: '#F3F0FF',
        100: '#EEEBFF',
        300: '#D0C0FF',
        500: '#AD92FE',
        600: '#5A32FD',
        700: '#4F22D7',
        900: '#361A8C',
      },
      grey: {
        50: '#F6F8FA',
        100: '#ECF0F4',
        300: '#D3DAE0',
        500: '#8A95A0',
        700: '#49515B',
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
      l: '1.85rem', // ~26px
    },
    extend: {
      gridTemplateAreas: {
        'project-monitoring': [
          'metric1 metric2',
          'metric3 metric4',
          'description description',
          'iframe iframe',
        ],
        'project-monitoring-wide': [
          'metric1 metric2 description',
          'metric3 metric4 description',
          'iframe iframe iframe',
        ],
        'project-payment': ['chart chart', 'metric1 metric2', 'table table'],
        'project-payment-wide': [
          'chart metric1',
          'chart metric2',
          'table table',
        ],
      },
      gridTemplateColumns: {
        'project-monitoring-wide': '16rem 16rem 1fr',
        'project-payment-wide': '1fr 24rem',
      },
      boxShadow: {
        'clickable-cards': '0px 4px 14px 0px #0000001A',
        menu: '0px 2px 12px 0px #0000001a',
        'project-menu': '0px 4px 14px 0px #0000001A',
        'payment-stepper': '4px 0px 14px 0px #00000033',
        toast: '0px 2px 12px 0px #0000001A',
        tooltip: '2px 0px 10px 0px #0000000F',
      },
    },
  },
  plugins: [
    pluginGridAreas,
    plugin(({ matchUtilities, theme }) => {
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
      matchUtilities(
        {
          // body text utilities
          // Use like 'txt-body-s' or 'txt-body-m'
          ['txt-body']: (value: string) => ({
            fontSize: value,
            fontFamily: theme('fontFamily.body'),
            lineHeight: value === '1rem' ? '140%' : '120%',
            letterSpacing: '0px',
          }),
          // system text utilities
          // This is the only one that needs a different variant for bold text
          // because system texts don't default to 400 font weight
          // Use like 'txt-system-s' or 'txt-system-m'
          ['txt-system']: (value: string) => ({
            fontSize: value,
            fontFamily: theme('fontFamily.display'),
            lineHeight: '140%',
            letterSpacing: '0px',
            fontWeight: '500',
          }),
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

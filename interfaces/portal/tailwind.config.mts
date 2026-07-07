import type { Config } from 'tailwindcss';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    container: {
      center: true,
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      purple: {
        DEFAULT: '#4F22D7',
        50: '#F8F6FF',
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
    extend: {
      boxShadow: {
        'clickable-cards': '0px 4px 14px 0px #0000001A',
        menu: '0px 2px 12px 0px #0000001a',
        'program-menu': '0px 4px 14px 0px #0000001A',
        'payment-stepper': '4px 0px 14px 0px #00000033',
        toast: '0px 2px 12px 0px #0000001A',
        tooltip: '2px 0px 10px 0px #0000000F',
      },
    },
  },
} satisfies Config;

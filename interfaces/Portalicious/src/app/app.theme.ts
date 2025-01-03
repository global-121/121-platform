//mypreset.ts
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import tailwindConfig from 'tailwind.config';

import { getTailwindConfig } from '~/utils/tailwind';

const colors = getTailwindConfig().theme.colors;

const severityVariant = (color: 'blue' | 'green' | 'red' | 'yellow') => ({
  background: colors[color][100],
  color: colors[color][700],
  border: {
    color: colors[color][500],
  },
  detail: {
    color: colors.black.DEFAULT,
  },
  shadow: tailwindConfig.theme.extend.boxShadow.toast,
});

const severityVariants = {
  info: severityVariant('blue'),
  warn: severityVariant('yellow'),
  success: severityVariant('green'),
  error: severityVariant('red'),
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const AppTheme = definePreset(Aura, {
  // Temporary theming, to be replaced with a proper theme created by G&T
  semantic: {
    primary: {
      50: colors.purple[50],
      100: colors.purple[100],
      200: colors.purple[300],
      300: colors.purple[300],
      400: colors.purple[500],
      500: colors.purple[500],
      600: colors.purple[600],
      700: colors.purple[700],
      800: colors.purple[900],
      900: colors.purple[900],
      950: colors.purple[900],
    },
    colorScheme: {
      light: {
        primary: {
          color: colors.purple.DEFAULT,
          activeColor: colors.purple.DEFAULT,
          hoverColor: colors.purple.DEFAULT,
        },
        content: {
          hoverBackground: colors.purple[100],
          hoverColor: colors.purple.DEFAULT,
        },
        text: {
          hoverColor: colors.purple.DEFAULT,
        },
        highlight: {
          background: colors.purple[100],
          focusBackground: colors.purple[100],
          color: colors.purple.DEFAULT,
          focusColor: colors.purple.DEFAULT,
        },
        formField: {
          hoverBorderColor: colors.purple.DEFAULT,
          invalidBorderColor: colors.red[500],
          invalidPlaceholder: colors.red[500],
        },
        navigation: {
          item: {
            focusBackground: colors.purple[100],
            activeBackground: colors.purple[100],
          },
        },
      },
    },
    focusRing: {
      color: colors.purple.DEFAULT,
    },
  },
  components: {
    button: {
      text: {
        primary: {
          color: colors.black.DEFAULT,
        },
      },
    },
    message: {
      colorScheme: {
        light: severityVariants,
      },
    },
    toast: {
      colorScheme: {
        light: severityVariants,
      },
    },
    chip: {
      paddingY: '0.125rem',
    },
  },
});

export default AppTheme;

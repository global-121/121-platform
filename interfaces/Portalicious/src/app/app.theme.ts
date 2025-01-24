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
          color: colors.black.DEFAULT,
          hoverColor: colors.purple.DEFAULT,
        },
        highlight: {
          background: colors.purple[100],
          focusBackground: colors.purple[100],
          color: colors.purple.DEFAULT,
          focusColor: colors.black.DEFAULT,
        },
        formField: {
          color: colors.black.DEFAULT,
          focusBorderColor: colors.purple[500],
          hoverBorderColor: colors.purple[500],
          invalidBorderColor: colors.red[500],
          invalidPlaceholder: colors.red[500],
        },
        navigation: {
          item: {
            focusColor: colors.black.DEFAULT,
            iconColor: colors.black.DEFAULT,
            iconFocusColor: colors.black.DEFAULT,
            focusBackground: colors.purple[100],
            activeBackground: colors.purple[100],
          },
        },
      },
    },
    focusRing: {
      color: colors.purple.DEFAULT,
    },
    borderRadius: {
      // used by cards
      xl: '1.125rem',
    },
  },
  components: {
    button: {
      gap: '0.625rem',
      paddingX: '1.25rem',
      paddingY: '0.6rem',
      sm: {
        paddingX: '1rem',
        paddingY: '0.25rem',
      },
      colorScheme: {
        light: {
          primary: {
            hover: {
              background: colors.purple[600],
            },
            active: {
              background: colors.purple[900],
            },
          },
          outlined: {
            primary: {
              hover: {
                background: colors.purple[100],
              },
              active: {
                background: colors.white,
                color: colors.purple[900],
              },
            },
            contrast: {
              border: {
                color: colors.grey[500],
              },
              hover: {
                background: colors.grey[100],
              },
              active: {
                background: colors.white,
              },
            },
          },
          text: {
            primary: {
              color: colors.black.DEFAULT,
            },
            secondary: {
              color: colors.black.DEFAULT,
            },
          },
        },
      },
    },
    card: {
      shadow: tailwindConfig.theme.extend.boxShadow.cards,
    },
    datatable: {
      body: {
        cell: {
          padding: '0.625rem 1rem',
        },
      },
      colorScheme: {
        light: {
          row: {
            hover: {
              color: colors.black.DEFAULT,
            },
          },
        },
      },
    },
    message: {
      colorScheme: {
        light: severityVariants,
      },
    },
    radiobutton: {
      colorScheme: {
        light: {
          icon: {
            checked: {
              color: colors.purple.DEFAULT,
              hover: {
                color: colors.purple.DEFAULT,
              },
            },
          },
          checked: {
            background: colors.white,
            hover: {
              background: colors.white,
            },
          },
        },
      },
    },
    scrollpanel: {
      colorScheme: {
        light: {
          bar: {
            background: colors.grey[700],
          },
        },
      },
      bar: {
        size: '0.5rem',
      },
    },
    tabs: {
      tab: {
        color: colors.black.DEFAULT,
        hover: {
          color: colors.grey[700],
          borderColor: colors.grey[700],
        },
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

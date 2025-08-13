//mypreset.ts
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import tailwindConfig from 'tailwind.config';

const colors = tailwindConfig.theme.colors;

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
          mutedColor: colors.grey[700],
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
      colorScheme: {
        light: {
          root: {
            gap: '0.625rem',
            paddingX: '1.25rem',
            paddingY: '0.6rem',
            sm: {
              paddingX: '1rem',
              paddingY: '0.25rem',
            },
            lg: {
              paddingX: '1rem',
              paddingY: '0.25rem',
              iconOnlyWidth: '2.5rem',
            },
            primary: {
              hoverBackground: colors.purple[600],
              activeBackground: colors.purple[900],
            },
          },
          outlined: {
            primary: {
              hoverBackground: colors.purple[100],
              activeBackground: colors.white,
            },
            contrast: {
              borderColor: colors.grey[500],
              hoverBackground: colors.grey[100],
              activeBackground: colors.white,
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
      colorScheme: {
        light: {
          root: {
            shadow: 'none',
          },
        },
      },
    },
    datatable: {
      colorScheme: {
        light: {
          bodyCell: {
            padding: '0.625rem 1rem',
          },
          row: {
            hoverColor: colors.black.DEFAULT,
          },
        },
      },
    },
    fileupload: {
      content: {
        padding: '1rem',
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
          root: {
            checkedBackground: colors.white,
            checkedHoverBackground: colors.white,
          },
          icon: {
            checkedColor: colors.purple.DEFAULT,
            checkedHoverColor: colors.purple.DEFAULT,
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
        hoverColor: colors.grey[700],
        hoverBorderColor: colors.grey[700],
      },
    },
    toast: {
      colorScheme: {
        light: severityVariants,
      },
    },
    tooltip: {
      colorScheme: {
        light: {
          root: {
            background: colors.white,
            color: colors.black.DEFAULT,
            shadow: tailwindConfig.theme.extend.boxShadow.tooltip,
          },
        },
      },
    },
    chip: {
      colorScheme: {
        light: {
          root: {
            paddingY: '0.125rem',
          },
        },
      },
    },
  },
});

export default AppTheme;

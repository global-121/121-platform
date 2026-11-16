import { Type } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { InfoTooltipData } from '~/components/info-tooltip/info-tooltip.component';
import { ColorVariant } from '~/utils/color-variant.enum';

export type DataListItem = (
  | {
      infoTooltipData: InfoTooltipData;
    }
  | {
      infoTooltipData?: undefined;
    }
) & {
  label: string | UILanguageTranslation;
  loading?: boolean;
  chipLabel?: string;
  chipVariant?: ColorVariant;
  fullWidth?: boolean;
  icon?: string;
  detailAction?: {
    component: Type<unknown>;
    inputs: Record<string, unknown>;
  };
  dataTestId?: string;
} & (
    | {
        type: 'boolean';
        value: boolean;
      }
    | {
        type: 'code';
        value?: null | string;
      }
    | {
        type: 'component';
        value: Type<unknown>;
        inputs?: Record<string, unknown>;
      }
    | {
        type: 'currency';
        value?: null | number;
        currencyCode?: null | string;
        currencyFormat?: string;
      }
    | {
        type: 'date';
        value?: Date | null | number | string;
      }
    | {
        type: 'koboImage';
        value: string;
      }
    | {
        type: 'number';
        value?: null | number;
      }
    | {
        type: 'options';
        value: string | string[];
        options?: {
          value: string;
          label?: string | UILanguageTranslation;
        }[];
      }
    | {
        type: 'tags';
        value: string | string[];
        options: {
          value: string;
          label?: string | UILanguageTranslation;
        }[];
      }
    | {
        type?: 'text';
        value?: null | string | UILanguageTranslation;
        routerLink?: RouterLink['routerLink'];
      }
  );

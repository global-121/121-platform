import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

export type LocalizedString = { [K in LanguageEnum]?: string };

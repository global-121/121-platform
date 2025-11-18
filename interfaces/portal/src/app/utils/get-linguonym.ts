import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';
import { Language } from '@121-service/src/shared/types/language.type';

/**
 * Example: the linguonym of "English" in French:
 * getLinguonym({ languageToDisplayNameOf: 'en', languageToShowNameIn: 'fr' });
 * returns "anglais"
 */
export const getLinguonym = ({
  languageToDisplayNameOf,
  languageToShowNameIn,
}: {
  languageToDisplayNameOf: Language;
  languageToShowNameIn: UILanguage;
}): string => {
  const names = new Intl.DisplayNames([languageToShowNameIn], {
    type: 'language',
  });
  // Unlikely but fallback to the language code itself.
  return names.of(languageToDisplayNameOf) ?? languageToDisplayNameOf;
};

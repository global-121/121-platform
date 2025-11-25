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
  let possibleResult: string | undefined;
  try {
    // The database can contain language codes that are not standard.
    // Calling this method with invalid input will produce a RangeError.
    // We catch this and fall back to the original language code, ex: 'et_AM'.
    possibleResult = names.of(languageToDisplayNameOf);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Error variable not needed.
  } catch (_err) {
    // do nothing
  }
  return possibleResult ?? languageToDisplayNameOf;
};

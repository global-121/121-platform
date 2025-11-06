import { ALL_AVAILABLE_LOCALES } from './_all_available-locales.mjs';

/**
 * @returns {string[]} - Required language-codes
 */
export const getRequiredTranslations = () => {
  const localesConfigValue = process.env.NG_LOCALES || ALL_AVAILABLE_LOCALES;
  return localesConfigValue
    .split(',')
    .filter((lang) => lang !== '' && lang !== 'en' && lang !== 'en-GB')
    .map((lang) => lang.trim());
};

/**
 * @param {string} lang - Language-code
 * @returns {string} - Full file-path
 */
export const getTranslationFilePath = (lang) =>
  `src/locale/messages.${lang}.xlf`;

/**
 * @param {string} lang - Language-code
 * @returns {string} - Mock XLIFF content
 */
export const createMockTranslations = (lang) =>
  `<xliff version="1.2"><file source-language="en-GB" target-language="${lang}"></file></xliff>`;

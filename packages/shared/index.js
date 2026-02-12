'use strict';

/**
 * String-enum runtime representation.
 * Kept as a plain object for minimal build tooling.
 */
const UILanguage = Object.freeze({
  ar: 'ar',
  en: 'en',
  nl: 'nl',
  es: 'es',
  fr: 'fr',
  sk: 'sk',
});

module.exports = {
  UILanguage,
};

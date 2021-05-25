const fs = require('fs');
const dotenv = require('dotenv');

// See https://www.npmjs.com/package/ansi-wrap
function ansiWrap(a, b, msg) {
  return '\u001b[' + a + 'm' + msg + '\u001b[' + b + 'm';
}
function bold(msg) {
  return ansiWrap(1, 22, msg);
}

function getEnabledLocales(env) {
  if (!env) return [];

  return env.trim().split(/\s*,\s*/);
}

function getTranslationFiles(path, type) {
  return fs.readdirSync(path).filter((file) => {
    return file.endsWith(type);
  });
}

///////////////////////////////////////////////////////////////////////////////

const translationsPath = './src/assets/i18n/';
const translationsFileType = '.json';

///////////////////////////////////////////////////////////////////////////////

// Load environment-variables from .env file (if available)
dotenv.config();

const enabledLocales = getEnabledLocales(process.env.NG_LOCALES);

enabledLocales.forEach((locale) => {
  const localeExists = fs.existsSync(
    `${translationsPath}${locale}${translationsFileType}`,
  );

  if (localeExists) {
    return console.log(`Translations file for ${bold(locale)} found.`);
  }

  if (!localeExists) {
    console.error(
      `Translations file for ${bold(locale)} does not exist. ⚠️ \n`,
    );
    console.error(
      `Check ${bold('NG_LOCALES')}: ${bold(process.env.NG_LOCALES)}`,
    );
    console.error(`Check files in ${bold(translationsPath)}:`);
    getTranslationFiles(translationsPath, translationsFileType).forEach(
      (file) => console.log(`  - ${file}`),
    );
    console.log(' ');

    return process.exit(1);
  }
});

#!/usr/bin/env node
import { accessSync, constants } from 'node:fs';
import { LokaliseDownload } from 'lokalise-file-exchange';

/**
 * See the README.md-file for more information.
 */

import { config } from 'dotenv';

// Load environment-variables from .env file
config({
  debug: process.env.DEBUG,
  override: process.env.DEBUG,
});

/////////////////////////////////////////////////////////////////////////////

if (!process.env.NG_DOWNLOAD_TRANSLATIONS_AT_BUILD) {
  console.info('Skipping download of translations.');
  process.exit(0);
}

/////////////////////////////////////////////////////////////////////////////

const requiredTranslations = process.env.NG_LOCALES.split(',')
  .filter((lang) => lang !== '' && lang !== 'en-GB')
  .map((lang) => lang.trim());

console.log('Required translations: ', requiredTranslations);

// Download translations for all languages
console.info(`Downloading all translations...`);
const lokaliseDownloader = new LokaliseDownload(
  {
    apiKey: process.env.LOKALISE_API_TOKEN,
    enableCompression: true,
  },
  {
    projectId: process.env.LOKALISE_PROJECT_ID,
  },
);
await lokaliseDownloader.downloadTranslations({
  downloadFileParams: {
    format: 'xlf',
    original_filenames: false,
    bundle_structure: 'src/locale/messages.%LANG_ISO%.%FORMAT%',
    export_empty_as: 'skip',
  },
});
console.info(`Download done ✅`);

/////////////////////////////////////////////////////////////////////////////

console.info(`Verify required translations have been downloaded...`);
for (const lang of requiredTranslations) {
  const filePath = `src/locale/messages.${lang}.xlf`;
  accessSync(filePath, constants.R_OK);
  console.info(`✅ ${filePath} exists.`);
}

/////////////////////////////////////////////////////////////////////////////

// Finish
console.info(`Done ✅`);

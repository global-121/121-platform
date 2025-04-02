#!/usr/bin/env node
import { accessSync, constants, writeFileSync } from 'node:fs';
import { LokaliseDownload } from 'lokalise-file-exchange';
import {
  getRequiredTranslations,
  getTranslationFilePath,
  createMockTranslations,
} from './_translations.utils.mjs';

/**
 * See the README.md-file for more information.
 */

/////////////////////////////////////////////////////////////////////////////

const requiredTranslations = getRequiredTranslations();
console.log('Required translations: ', requiredTranslations);

if (!process.env.NG_DOWNLOAD_TRANSLATIONS_AT_BUILD) {
  console.info('Skipping download of translations. Creating mocks instead.');
  for (const lang of requiredTranslations) {
    const filePath = getTranslationFilePath(lang);
    writeFileSync(
      filePath,
      // Use the most minimal, yet valid XLIFF file:
      createMockTranslations(lang),
    );
    console.info(`☑️  Mock created: ${filePath}`);
  }
  process.exit(0);
}

/////////////////////////////////////////////////////////////////////////////

// Download translations for all languages
console.info(`Downloading all translations...`);
const lokaliseDownloader = new LokaliseDownload(
  {
    apiKey: process.env.LOKALISE_API_TOKEN,
    enableCompression: true,
  },
  {
    projectId: process.env.LOKALISE_PROJECT_ID ?? '',
  },
);
await lokaliseDownloader.downloadTranslations({
  processDownloadFileParams: {
    asyncDownload: true,
  },
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
  const filePath = getTranslationFilePath(lang);
  accessSync(filePath, constants.R_OK);
  console.info(`✅ Translations downloaded: ${filePath}`);
}

/////////////////////////////////////////////////////////////////////////////

// Finish
console.info(`Done ✅`);

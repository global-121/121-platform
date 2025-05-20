#!/usr/bin/env node

import { LokaliseDownload } from 'lokalise-file-exchange';
import { accessSync, constants, existsSync, writeFileSync } from 'node:fs';

import { shouldBeEnabled } from './_env.utils.mjs';
import {
  createMockTranslations,
  getRequiredTranslations,
  getTranslationFilePath,
} from './_translations.utils.mjs';

/**
 * See the README.md-file for more information.
 */

/////////////////////////////////////////////////////////////////////////////

const requiredTranslations = getRequiredTranslations();
console.log('Required translations: ', requiredTranslations);

if (!shouldBeEnabled(process.env.NG_DOWNLOAD_TRANSLATIONS_AT_BUILD)) {
  console.info('Skipping download of translations.');

  for (const lang of requiredTranslations) {
    const filePath = getTranslationFilePath(lang);

    if (existsSync(filePath)) {
      console.info(`✅ Translations already available: ${filePath}`);
      continue;
    }

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
try {
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
    downloadFileParams: {
      bundle_structure: 'src/locale/messages.%LANG_ISO%.%FORMAT%',
      export_empty_as: 'skip',
      format: 'xlf',
      original_filenames: false,
    },
    processDownloadFileParams: {
      asyncDownload: false, // Disabled although recommended by Lokalise. It doesn't work reliable enough.
    },
  });
  console.info(`Download done ✅`);
} catch (error) {
  console.error(`Error downloading translations!`, error);
  process.exit(1);
}

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

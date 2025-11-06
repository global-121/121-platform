#!/usr/bin/env node

import { match, notEqual } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { shouldBeEnabled } from './_env.utils.mjs';
import {
  createMockTranslations,
  getRequiredTranslations,
  getTranslationFilePath,
} from './_translations.utils.mjs';

/////////////////////////////////////////////////////////////////////////////

const requiredTranslations = getRequiredTranslations();
console.log('Required translations: ', requiredTranslations);

test(
  'Translations do not contain mock-value',
  { skip: !shouldBeEnabled(process.env.NG_DOWNLOAD_TRANSLATIONS_AT_BUILD) },
  () => {
    requiredTranslations.forEach((lang) => {
      const filePath = getTranslationFilePath(lang);
      const contents = readFileSync(filePath, 'utf-8');
      const mockValue = createMockTranslations(lang);

      notEqual(
        contents,
        mockValue,
        `Mock translations-file found in: ${filePath}`,
      );
    });
  },
);

test(
  'Translations are downloaded',
  { skip: !shouldBeEnabled(process.env.NG_DOWNLOAD_TRANSLATIONS_AT_BUILD) },
  () => {
    const validTranslations = {
      ar: 'رسالة مخصصة',
      es: 'Mensaje personalizado',
      fr: 'Message personnalisé',
      nl: 'Custom bericht',
      sk: 'Vlastná správa',
    };

    requiredTranslations.forEach((lang) => {
      const filePath = getTranslationFilePath(lang);
      const contents = readFileSync(filePath, 'utf-8');
      const test =
        `<trans-unit id="(message-content-type-custom)" datatype="html">` +
        `\\s*<source>Custom message\\s*</source>` +
        `\\s*<target>${validTranslations[lang]}</target>` +
        `\\s*</trans-unit>`;

      match(
        contents,
        new RegExp(test),
        `Translation "${validTranslations[lang]}" not found in: ${filePath}`,
      );
    });
  },
);

/////////////////////////////////////////////////////////////////////////////

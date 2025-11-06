#!/usr/bin/env node

import { notEqual, ok } from 'node:assert/strict';
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

// The downloaded translation files for each language should contain (some)
// translations. We don't need them to have the same amount of translations as
// the source language because translations may be missing. We used to have a
// test here that tested for specific translated strings, but that was brittle.
test(
  'Translation files are downloaded aka: they contain translations',
  { skip: !shouldBeEnabled(process.env.NG_DOWNLOAD_TRANSLATIONS_AT_BUILD) },
  () => {
    requiredTranslations.forEach((lang) => {
      const filePath = getTranslationFilePath(lang);
      const contents = readFileSync(filePath, 'utf-8');

      // Count the number of trans-unit elements in the translation file
      const transUnitMatches = contents.match(/<trans-unit[^>]*>/g) || [];
      const translationCount = transUnitMatches.length;

      ok(
        translationCount > 0,
        `Translation file "${filePath}" exists but does not contain any translations. The download step may have failed.`,
      );
    });
  },
);

/////////////////////////////////////////////////////////////////////////////

#!/usr/bin/env node

import { match, notEqual } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
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
  { skip: !process.env.NG_DOWNLOAD_TRANSLATIONS_AT_BUILD },
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
  { skip: !process.env.NG_DOWNLOAD_TRANSLATIONS_AT_BUILD },
  () => {
    const validTranslations = {
      ar: 'اللغة:',
      es: 'Idioma:',
      fr: 'Langue :',
      nl: 'Taal:',
      sl: 'Jazyk:',
    };

    requiredTranslations.forEach((lang) => {
      const filePath = getTranslationFilePath(lang);
      const contents = readFileSync(filePath, 'utf-8');
      const test =
        `<trans-unit id="(1023894478419315290|language-switcher-selected)" datatype="html">` +
        `\\s*<source>Language: <x equiv-text="{{ selectedLanguageLabel\\(\\) }}" id="INTERPOLATION"/>\\s*</source>` +
        `\\s*<target>\\s*${validTranslations[lang]}\\s*<x equiv-text="{{ selectedLanguageLabel\\(\\) }}" id="INTERPOLATION"/>\\s*</target>` +
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

import { describe, expect, it } from 'vitest';

import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';

import {
  getAccessGroupValue,
  mergeUILanguageForProgramLanguageAttributes,
  programHasAccessGroups,
  programNeedsFullNameSetup,
} from '~/domains/program/program.helper';
import { Program } from '~/domains/program/program.model';

describe('programNeedsFullNameSetup', () => {
  it('should be false while the program is not loaded yet', () => {
    expect(programNeedsFullNameSetup(undefined)).toBe(false);
  });

  it.each([[[]], [null], [undefined]])(
    'should be true when the naming convention is %j',
    (fullnameNamingConvention) => {
      const program = { fullnameNamingConvention } as unknown as Program;

      expect(programNeedsFullNameSetup(program)).toBe(true);
    },
  );

  it('should be false when the naming convention has fields', () => {
    const program = {
      fullnameNamingConvention: ['firstName', 'lastName'],
    } as Program;

    expect(programNeedsFullNameSetup(program)).toBe(false);
  });
});

describe('Access group display helpers', () => {
  it('detects whether any access group levels are configured', () => {
    // Act & Assert
    expect(
      programHasAccessGroups({
        accessGroupRegistrationAttributeNames: ['region'],
      }),
    ).toBe(true);
    expect(
      programHasAccessGroups({
        accessGroupRegistrationAttributeNames: [],
      }),
    ).toBe(false);
    expect(programHasAccessGroups({})).toBe(false);
  });

  it('joins localized access group values in configured order', () => {
    // Arrange
    const attributeLabels: Record<string, Record<string, string>> = {
      region: { north: 'North' },
      district: { 'north-central': 'North Central' },
    };

    // Act
    const value = getAccessGroupValue({
      accessGroupRegistrationAttributeNames: ['region', 'district'],
      registration: { region: 'north', district: 'north-central' },
      localizeAttribute: ({ attributeName, attributeOptionValue }) =>
        attributeLabels[attributeName][attributeOptionValue],
    });

    // Assert
    expect(value).toBe('North > North Central');
  });

  it('skips missing and non-string access group values', () => {
    // Arrange
    const registration = {
      region: 'north',
      district: null,
      village: 42,
    };

    // Act
    const value = getAccessGroupValue({
      accessGroupRegistrationAttributeNames: [
        'region',
        'district',
        'village',
        'subVillage',
      ],
      registration,
      localizeAttribute: ({ attributeOptionValue }) => attributeOptionValue,
    });

    // Assert
    expect(value).toBe('north');
  });

  it('falls back to the stored value when the localized label is empty', () => {
    // Act
    const value = getAccessGroupValue({
      accessGroupRegistrationAttributeNames: ['region', 'district'],
      registration: { region: 'north', district: 'north-central' },
      localizeAttribute: () => '',
    });

    // Assert
    expect(value).toBe('north > north-central');
  });

  it('returns no value when registration has no valid access group values', () => {
    // Act
    const value = getAccessGroupValue({
      accessGroupRegistrationAttributeNames: ['region'],
      registration: { region: '' },
      localizeAttribute: ({ attributeOptionValue }) => attributeOptionValue,
    });

    // Assert
    expect(value).toBeUndefined();
  });
});

describe('mergeUILanguageForProgramLanguageAttributes', () => {
  const mockOriginalProgram: Partial<Program> = {
    titlePortal: {
      [UILanguage.en]: 'Original Title',
      [UILanguage.nl]: 'Oorspronkelijke Titel',
    },
    description: {
      [UILanguage.en]: 'Original Description',
      [UILanguage.es]: 'Descripción Original',
    },
    location: 'Kenya', // Non-translatable field
  };

  it('should merge translations correctly when original program exists', () => {
    const partialUpdate: Partial<Program> = {
      titlePortal: {
        [UILanguage.fr]: 'Titre Français',
        [UILanguage.en]: 'Updated Title',
      },
      description: {
        [UILanguage.ar]: 'وصف محدث',
      },
      location: 'Updated Location',
    };

    const result = mergeUILanguageForProgramLanguageAttributes({
      partialUpdatedProgram: partialUpdate,
      originalProgram: mockOriginalProgram as Program,
    });

    expect(result.titlePortal).toEqual({
      [UILanguage.en]: partialUpdate.titlePortal?.[UILanguage.en], // Updated
      [UILanguage.nl]: mockOriginalProgram.titlePortal?.[UILanguage.nl], // Preserved
      [UILanguage.fr]: partialUpdate.titlePortal?.[UILanguage.fr], // Added
    });

    expect(result.description).toEqual({
      [UILanguage.en]: mockOriginalProgram.description?.[UILanguage.en], // Preserved
      [UILanguage.es]: mockOriginalProgram.description?.[UILanguage.es], // Preserved
      [UILanguage.ar]: partialUpdate.description?.[UILanguage.ar], // Added
    });

    expect(result.location).toBe(partialUpdate.location);
  });

  it('should handle case when no original program exists', () => {
    const partialUpdate: Partial<Program> = {
      titlePortal: {
        [UILanguage.en]: 'New Title',
        [UILanguage.fr]: 'Nouveau Titre',
      },
      description: {
        [UILanguage.en]: 'New Description',
      },
    };

    const result = mergeUILanguageForProgramLanguageAttributes({
      partialUpdatedProgram: partialUpdate,
      originalProgram: undefined,
    });

    expect(result.titlePortal).toEqual(partialUpdate.titlePortal);
    expect(result.description).toEqual(partialUpdate.description);
  });
});

import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';

import { mergeUILanguageForProgramLanguageAttributes } from '~/domains/program/program.helper';
import { Program } from '~/domains/program/program.model';

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

import { describe, expect, it } from 'vitest';

import { MAX_ACCESS_GROUP_LEVELS } from '@121-service/src/programs/access-group-levels/const/max-access-group-levels.const';

import {
  canAddAccessGroupLevel,
  getAccessGroupAttributeNamesForSave,
  getAvailableAccessGroupAttributesByLevel,
} from '~/pages/program-settings-registration-data/components/access-groups-card/access-groups-card.helper';

const attributes = [
  { name: 'province', label: 'Province' },
  { name: 'city', label: 'City' },
  { name: 'neighbourhood', label: 'Neighbourhood' },
];

describe('Available fields for each access level', () => {
  it('keeps the current level selection and excludes selections from other levels', () => {
    // Act
    const result = getAvailableAccessGroupAttributesByLevel({
      attributes,
      selectedAttributeNames: ['province', 'city', null],
    });

    // Assert
    expect(
      result.map((levelAttributes) => levelAttributes.map(({ name }) => name)),
    ).toEqual([
      ['province', 'neighbourhood'],
      ['city', 'neighbourhood'],
      ['neighbourhood'],
    ]);
  });

  it('returns no per-level options when there are no levels', () => {
    // Act
    const result = getAvailableAccessGroupAttributesByLevel({
      attributes,
      selectedAttributeNames: [],
    });

    // Assert
    expect(result).toEqual([]);
  });
});

describe('Adding access levels', () => {
  it.each([MAX_ACCESS_GROUP_LEVELS, MAX_ACCESS_GROUP_LEVELS + 1])(
    'does not allow adding a level when there are %i levels',
    (levelCount) => {
      // Act
      const result = canAddAccessGroupLevel({ levelCount });

      // Assert
      expect(result).toBe(false);
    },
  );

  it('allows adding a level when there are no levels', () => {
    // Act
    const result = canAddAccessGroupLevel({
      levelCount: 0,
    });

    // Assert
    expect(result).toBe(true);
  });

  it('allows adding a level below the maximum regardless of field selections', () => {
    // Act
    const result = canAddAccessGroupLevel({
      levelCount: MAX_ACCESS_GROUP_LEVELS - 1,
    });

    // Assert
    expect(result).toBe(true);
  });
});

describe('Fields included when saving access groups', () => {
  it('filters out empty levels while preserving the selected level order', () => {
    // Act
    const result = getAccessGroupAttributeNamesForSave({
      selectedAttributeNames: ['province', null, 'neighbourhood'],
    });

    // Assert
    expect(result).toEqual(['province', 'neighbourhood']);
  });
});

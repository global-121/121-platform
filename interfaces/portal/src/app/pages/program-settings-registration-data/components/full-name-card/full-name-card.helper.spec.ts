import { describe, expect, it } from 'vitest';

import { getNameFieldsInConventionOrder } from '~/pages/program-settings-registration-data/components/full-name-card/full-name-card.helper';

const textAttributes = [
  { name: 'firstName', labelToShow: 'First name' },
  { name: 'middleName', labelToShow: 'Middle name' },
  { name: 'lastName', labelToShow: 'Last name' },
];

describe('getNameFieldsInConventionOrder', () => {
  it('should follow the order of the naming convention, not of the attributes', () => {
    const result = getNameFieldsInConventionOrder({
      textAttributes,
      fullnameNamingConvention: ['lastName', 'firstName'],
    });

    expect(result.map((attribute) => attribute.name)).toEqual([
      'lastName',
      'firstName',
    ]);
  });

  it('should skip convention fields that are not text attributes', () => {
    const result = getNameFieldsInConventionOrder({
      textAttributes,
      fullnameNamingConvention: ['lastName', 'age', 'firstName'],
    });

    expect(result.map((attribute) => attribute.name)).toEqual([
      'lastName',
      'firstName',
    ]);
  });

  it('should be empty for an empty naming convention', () => {
    const result = getNameFieldsInConventionOrder({
      textAttributes,
      fullnameNamingConvention: [],
    });

    expect(result).toEqual([]);
  });
});

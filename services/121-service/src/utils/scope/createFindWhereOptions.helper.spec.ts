import { FindOperator } from 'typeorm';
import { RegistrationDataEntity } from '../../registration/registration-data.entity';
import {
  convertToScopedOptions,
  FindOptionsCombined,
} from './createFindWhereOptions.helper';

describe('createFindWhereOptions helper', () => {
  it('should return correct scoped whereFilters', () => {
    // Arrange
    const options: FindOptionsCombined<RegistrationDataEntity> = {
      where: { program: { id: 3 }, registrationStatus: 'included' },
    } as unknown as FindOptionsCombined<RegistrationDataEntity>;
    const relationArrayToRegistration = [];
    const requestScope = 'utrecht';

    const expectedWhereQueryScope = {
      program: { id: 3 },
      registrationStatus: 'included',
      scope: new FindOperator('like', 'utrecht%', true, false),
    };
    const expectedWhereQueryScopeEnabled = {
      program: { id: 3, enableScope: false },
      registrationStatus: 'included',
    };
    const expectedOptions: FindOptionsCombined<RegistrationDataEntity> = {
      ...options,
      // This ensures the toEqual checks for the 'adding the where' part.
      where: [expectedWhereQueryScope, expectedWhereQueryScopeEnabled],
    } as unknown as FindOptionsCombined<RegistrationDataEntity>;

    // Act
    const convertedScopedOptions =
      convertToScopedOptions<RegistrationDataEntity>(
        options,
        relationArrayToRegistration,
        requestScope,
      );

    // Assert
    expect(convertedScopedOptions).toEqual(expectedOptions);
  });
});

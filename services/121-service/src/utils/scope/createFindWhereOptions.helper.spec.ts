import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import {
  convertToScopedOptions,
  FindOptionsCombined,
} from '@121-service/src/utils/scope/createFindWhereOptions.helper';
import { Equal, FindOperator } from 'typeorm';

describe('createFindWhereOptions helper', () => {
  it('should return correct scoped whereFilters', () => {
    // Arrange
    const options: FindOptionsCombined<RegistrationDataEntity> = {
      where: {
        program: { id: Equal(3) },
        registrationStatus: Equal('included'),
      },
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

    // Transform to comparable form
    const transformToComparableForm = (obj: any) => {
      if (obj instanceof FindOperator) {
        return obj.value; // Use the value method
      }
      if (Array.isArray(obj)) {
        return obj.map(transformToComparableForm);
      }
      if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
          Object.entries(obj).map(([key, value]) => [
            key,
            transformToComparableForm(value),
          ]),
        );
      }
      return obj;
    };

    const transformedExpectedOptions =
      transformToComparableForm(expectedOptions);
    const transformedConvertedScopedOptions = transformToComparableForm(
      convertedScopedOptions,
    );

    // Assert
    expect(transformedConvertedScopedOptions).toEqual(
      transformedExpectedOptions,
    );
  });
});

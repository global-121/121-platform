import { Equal, FindManyOptions, FindOperator } from 'typeorm';

import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import {
  convertToScopedOptions,
  FindOptionsCombined,
} from '@121-service/src/utils/scope/createFindWhereOptions.helper';

describe('createFindWhereOptions helper', () => {
  it('should return correct scoped whereFilters', () => {
    // Arrange
    const options: FindOptionsCombined<RegistrationAttributeDataEntity> = {
      where: {
        project: { id: Equal(3) },
        registrationStatus: Equal('included'),
      },
    } as unknown as FindOptionsCombined<RegistrationAttributeDataEntity>;
    const relationArrayToRegistration = [];
    const requestScope = 'utrecht';

    const expectedWhereQueryScope = {
      project: { id: 3 },
      registrationStatus: 'included',
      scope: new FindOperator('like', 'utrecht%', true, false),
    };
    const expectedWhereQueryScopeEnabled = {
      project: { id: 3, enableScope: false },
      registrationStatus: 'included',
    };
    const expectedOptions: FindOptionsCombined<RegistrationAttributeDataEntity> =
      {
        ...options,
        // This ensures the toEqual checks for the 'adding the where' part.
        where: [expectedWhereQueryScope, expectedWhereQueryScopeEnabled],
      } as unknown as FindOptionsCombined<RegistrationAttributeDataEntity>;

    // Act
    const convertedScopedOptions = convertToScopedOptions<
      RegistrationAttributeDataEntity,
      FindManyOptions<RegistrationAttributeDataEntity>
    >(options, relationArrayToRegistration, requestScope);

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

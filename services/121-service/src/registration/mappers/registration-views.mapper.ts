import { omit } from 'lodash';

import {
  RegistrationDataInfo,
  RegistrationDataRelation,
} from '@121-service/src/registration/dto/registration-data-relation.model';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';

type RegistrationViewWithoutData = Omit<RegistrationViewEntity, 'data'>;

// TODO: Add unit tests for this mapper class
export class RegistrationViewsMapper {
  static selectRegistrationRootFields({
    registration,
    select,
    hasPersonalReadPermission,
  }: {
    registration: RegistrationViewEntity;
    select?: string[];
    hasPersonalReadPermission?: boolean;
  }): RegistrationViewWithoutData {
    let mappedRegistration = omit(registration, 'data');

    if (select && select.length > 0) {
      mappedRegistration = new RegistrationViewEntity();
      for (const selectKey of select) {
        if (selectKey !== 'data' && registration[selectKey] !== undefined) {
          mappedRegistration[selectKey] = registration[selectKey];
        }
      }
    }

    if (!hasPersonalReadPermission) {
      delete mappedRegistration.phoneNumber;
    }

    return mappedRegistration;
  }

  static mapAttributeDataToRegistration(
    registrationDataArray: RegistrationAttributeDataEntity[],
    mappedRegistration: RegistrationViewWithoutData,
    registrationDataInfoArray: RegistrationDataInfo[],
  ) {
    if (!registrationDataInfoArray || registrationDataInfoArray.length < 1) {
      return mappedRegistration;
    }

    const findRelation = (
      dataRelation: RegistrationDataRelation,
      data: RegistrationAttributeDataEntity,
    ): boolean => {
      const propertiesToCheck = ['programRegistrationAttributeId'];
      for (const property of propertiesToCheck) {
        if (
          dataRelation[property] === data[property] &&
          data[property] !== null
        ) {
          return true;
        }
      }
      return false;
    };

    for (const dataRelation of registrationDataInfoArray) {
      const registrationData = registrationDataArray.find((x) =>
        findRelation(dataRelation.relation, x),
      );
      if (registrationData) {
        mappedRegistration[dataRelation.name] = registrationData.value;
      } else {
        mappedRegistration[dataRelation.name] = null;
      }
    }

    return mappedRegistration;
  }

  static appendNameUsingNamingConvention<
    T extends RegistrationViewWithoutData,
  >({
    registration,
    select,
    orignalSelect,
    fullnameNamingConvention,
  }: {
    registration: T;
    select?: string[];
    orignalSelect: string[];
    fullnameNamingConvention: string[];
  }): T & { name: string } {
    const name = this.mapNameUsingNamingConvention(
      registration,
      fullnameNamingConvention,
    );
    if (select && select.includes('name')) {
      const differenceOrignalSelect = select.filter(
        (x) => !orignalSelect.includes(x),
      );
      for (const key of differenceOrignalSelect) {
        delete registration[key];
      }
    }
    return {
      ...registration,
      name,
    };
  }

  static mapNameUsingNamingConvention(
    registrationRow: Partial<RegistrationViewEntity>,
    fullnameNamingConvention: string[],
  ): string {
    const fullnameConcat: string[] = [];
    const nameColumns = JSON.parse(JSON.stringify(fullnameNamingConvention));
    for (const nameColumn of nameColumns) {
      fullnameConcat.push(registrationRow[nameColumn]);
    }
    return fullnameConcat.join(' ');
  }
}

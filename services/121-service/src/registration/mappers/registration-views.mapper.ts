import { omit } from 'lodash';

import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import {
  RegistrationDataInfo,
  RegistrationDataRelation,
} from '@121-service/src/registration/dto/registration-data-relation.model';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';

type RegistrationViewWithoutData = Omit<RegistrationViewEntity, 'data'>;

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
        if (selectKey !== 'data' && (registration as any)[selectKey] !== undefined) {
          (mappedRegistration as any)[selectKey] = (registration as any)[selectKey];
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
          (dataRelation as any)[property] === (data as any)[property] &&
          (data as any)[property] !== null
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
        (mappedRegistration as any)[dataRelation.name] = registrationData.value;
      } else {
        (mappedRegistration as any)[dataRelation.name] = null;
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
        delete (registration as any)[key];
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

  static replaceDropdownValuesWithEnglishLabel({
    rows,
    attributes,
  }: {
    rows: Record<string, unknown>[];
    attributes: ProgramRegistrationAttributeEntity[];
  }): Record<string, unknown>[] {
    for (const attribute of attributes) {
      for (const row of rows) {
        row[attribute.name] = this.getDropdownEnglishLabel(
          attribute,
          row[attribute.name],
        );
      }
    }
    return rows;
  }

  private static getDropdownEnglishLabel(
    attribute: ProgramRegistrationAttributeEntity,
    value: unknown,
  ): unknown {
    const selectedOption = attribute.options?.find((o) => o.option === value);
    if (selectedOption && selectedOption.label && selectedOption.label['en']) {
      return selectedOption.label['en'];
    }
    return value;
  }
}

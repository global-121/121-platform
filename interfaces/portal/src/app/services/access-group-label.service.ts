import { inject, Injectable } from '@angular/core';

import { Program } from '~/domains/program/program.model';
import { TranslatableStringService } from '~/services/translatable-string.service';

interface AccessGroupValue {
  programRegistrationAttributeName: string;
  value: unknown;
}

type ProgramRegistrationAttributes = Program['programRegistrationAttributes'];

const ACCESS_GROUP_LABEL_SEPARATOR = ' / ';

@Injectable({
  providedIn: 'root',
})
export class AccessGroupLabelService {
  private readonly translatableStringService = inject(
    TranslatableStringService,
  );

  getRegistrationAccessGroupLabel({
    programRegistrationAttributes,
    accessGroupRegistrationAttributeNames,
    registration,
  }: {
    programRegistrationAttributes: ProgramRegistrationAttributes;
    accessGroupRegistrationAttributeNames: string[];
    registration?: Record<string, unknown>;
  }): string | undefined {
    if (!registration) {
      return;
    }

    return this.getAccessGroupLabel({
      programRegistrationAttributes,
      accessGroups: accessGroupRegistrationAttributeNames.map(
        (programRegistrationAttributeName) => ({
          programRegistrationAttributeName,
          value: registration[programRegistrationAttributeName],
        }),
      ),
    });
  }

  getAccessGroupLabel({
    programRegistrationAttributes,
    accessGroups,
  }: {
    programRegistrationAttributes: ProgramRegistrationAttributes;
    accessGroups: AccessGroupValue[];
  }): string | undefined {
    const accessGroupLabels: string[] = [];
    for (const { programRegistrationAttributeName, value } of accessGroups) {
      if (typeof value !== 'string' || value.length === 0) {
        continue;
      }

      accessGroupLabels.push(
        this.getOptionLabel({
          programRegistrationAttributes,
          attributeName: programRegistrationAttributeName,
          optionValue: value,
        }),
      );
    }

    if (accessGroupLabels.length === 0) {
      return;
    }

    return accessGroupLabels.join(ACCESS_GROUP_LABEL_SEPARATOR);
  }

  private getOptionLabel({
    programRegistrationAttributes,
    attributeName,
    optionValue,
  }: {
    programRegistrationAttributes: ProgramRegistrationAttributes;
    attributeName: string;
    optionValue: string;
  }): string {
    const attribute = programRegistrationAttributes.find(
      ({ name }) => name === attributeName,
    );
    if (!attribute) {
      return optionValue;
    }

    const option = attribute.options?.find(
      (attributeOption) => attributeOption.option === optionValue,
    );
    if (!option) {
      return optionValue;
    }

    const label = this.translatableStringService.translate(option.label);
    if (!label) {
      return optionValue;
    }

    return label;
  }
}

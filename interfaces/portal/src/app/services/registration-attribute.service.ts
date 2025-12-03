import { inject, Injectable, LOCALE_ID, Signal, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

import {
  QueryClient,
  queryOptions,
} from '@tanstack/angular-query-experimental';

import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import {
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { FinancialAttributes } from '@121-service/src/user/enum/registration-financial-attributes.const';

import { ProgramApiService } from '~/domains/program/program.api.service';
import { programHasInclusionScore } from '~/domains/program/program.helper';
import { Program } from '~/domains/program/program.model';
import {
  ATTRIBUTE_EDIT_INFO,
  ATTRIBUTE_LABELS,
  isGenericAttribute,
} from '~/domains/program/program-attribute.helpers';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { Registration } from '~/domains/registration/registration.model';
import { AuthService } from '~/services/auth.service';
import { GetRegistrationPreferredLanguageNameService } from '~/services/get-registration-preferrred-language-name.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

const getGenericAttributeType = (
  attributeName: GenericRegistrationAttributes,
): RegistrationAttributeTypes => {
  switch (attributeName) {
    case GenericRegistrationAttributes.maxPayments:
      return RegistrationAttributeTypes.numericNullable;
    case GenericRegistrationAttributes.paymentAmountMultiplier:
    case GenericRegistrationAttributes.inclusionScore:
    case GenericRegistrationAttributes.paymentCount:
    case GenericRegistrationAttributes.paymentCountRemaining:
      return RegistrationAttributeTypes.numeric;
    case GenericRegistrationAttributes.preferredLanguage:
    case GenericRegistrationAttributes.programFspConfigurationName:
      return RegistrationAttributeTypes.dropdown;
    case GenericRegistrationAttributes.programFspConfigurationLabel:
    case GenericRegistrationAttributes.referenceId:
    case GenericRegistrationAttributes.scope:
    case GenericRegistrationAttributes.status:
    case GenericRegistrationAttributes.registrationProgramId:
      return RegistrationAttributeTypes.text;
    case GenericRegistrationAttributes.created:
      return RegistrationAttributeTypes.date;
    case GenericRegistrationAttributes.phoneNumber:
      return RegistrationAttributeTypes.tel;
  }
};

export interface NormalizedRegistrationAttribute {
  name: GenericRegistrationAttributes | string;
  label: string | UILanguageTranslation;
  editInfo?: string;
  isRequired: boolean;
  isEditable: boolean;
  pattern?: string;
  type: RegistrationAttributeTypes;
  value: unknown;
  options?: {
    value: string;
    label?: string;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class RegistrationAttributeService {
  private readonly locale = inject(LOCALE_ID);
  private readonly queryClient = inject(QueryClient);

  private readonly authService = inject(AuthService);
  private readonly programApiService = inject(ProgramApiService);
  private readonly registrationApiService = inject(RegistrationApiService);
  private readonly translatableStringService = inject(
    TranslatableStringService,
  );
  private readonly getRegistrationPreferredLanguageNameService = inject(
    GetRegistrationPreferredLanguageNameService,
  );

  private hasPermissionsRequiredToEditAttribute({
    attributeName,
    programId,
  }: {
    attributeName: string;
    programId: number | string;
  }) {
    let requiredPermission = PermissionEnum.RegistrationPersonalUPDATE;

    if (isGenericAttribute(attributeName)) {
      if (
        FinancialAttributes.includes(attributeName as keyof RegistrationEntity)
      ) {
        requiredPermission =
          PermissionEnum.RegistrationAttributeFinancialUPDATE;
      } else if (
        attributeName ===
        GenericRegistrationAttributes.programFspConfigurationName
      ) {
        requiredPermission = PermissionEnum.RegistrationFspConfigUPDATE;
      }
    }

    return this.authService.hasPermission({
      programId,
      requiredPermission,
    });
  }

  private isEditableAttribute({
    attributeName,
    program,
  }: {
    attributeName: string;
    program: Program;
  }) {
    const nonEditableAttributes = ['inclusionScore', 'paymentCountRemaining'];

    if (program.paymentAmountMultiplierFormula) {
      nonEditableAttributes.push('paymentAmountMultiplier');
    }

    return (
      !nonEditableAttributes.includes(attributeName) &&
      this.hasPermissionsRequiredToEditAttribute({
        attributeName,
        programId: program.id,
      })
    );
  }

  private getGenericAttributeOptions(
    attributeName: GenericRegistrationAttributes,
    program: Program,
  ): { value: string; label?: string }[] | undefined {
    switch (attributeName) {
      case GenericRegistrationAttributes.preferredLanguage: {
        const preferredLanguages = program.languages.map((language) => ({
          value: language,
          label:
            this.getRegistrationPreferredLanguageNameService.getRegistrationPreferredLanguageName(
              language,
            ),
        }));
        return preferredLanguages.sort((a, b) =>
          a.label.localeCompare(b.label, this.locale),
        );
      }
      case GenericRegistrationAttributes.programFspConfigurationName:
        return program.programFspConfigurations.map((fspConfig) => ({
          value: fspConfig.name,
          label: this.translatableStringService.translate(fspConfig.label),
        }));
      default:
        return undefined;
    }
  }

  private getGenericAttributes(
    program: Program,
    registration?: Registration,
  ): NormalizedRegistrationAttribute[] {
    const genericAttributeNames: GenericRegistrationAttributes[] = [
      GenericRegistrationAttributes.phoneNumber,
      GenericRegistrationAttributes.programFspConfigurationName,
      GenericRegistrationAttributes.paymentAmountMultiplier,
      GenericRegistrationAttributes.preferredLanguage,
    ];

    if (program.enableScope) {
      genericAttributeNames.push(GenericRegistrationAttributes.scope);
    }

    if (program.enableMaxPayments) {
      genericAttributeNames.push(
        GenericRegistrationAttributes.maxPayments,
        GenericRegistrationAttributes.paymentCountRemaining,
      );
    }

    if (programHasInclusionScore(program)) {
      genericAttributeNames.push(GenericRegistrationAttributes.inclusionScore);
    }

    return genericAttributeNames.map((attributeName) => {
      const type = getGenericAttributeType(attributeName);
      const options = this.getGenericAttributeOptions(attributeName, program);
      const value: unknown = registration?.[attributeName];

      return {
        name: attributeName,
        label: ATTRIBUTE_LABELS[attributeName],
        editInfo: ATTRIBUTE_EDIT_INFO[attributeName],
        options,
        value,
        type,
        isEditable: this.isEditableAttribute({
          attributeName,
          program,
        }),
        isRequired:
          attributeName === GenericRegistrationAttributes.phoneNumber &&
          !program.allowEmptyPhoneNumber,
      };
    });
  }

  private async getProgramSpecificAttributes(
    program: Program,
    registration?: Registration,
  ): Promise<NormalizedRegistrationAttribute[]> {
    const programAttributes = await this.queryClient.fetchQuery(
      this.programApiService.getProgramAttributes({
        programId: signal(program.id),
        includeProgramRegistrationAttributes: true,
        includeTemplateDefaultAttributes: false,
      })(),
    );

    return programAttributes.map((attribute) => {
      const { isRequired, name, label, pattern, type } = attribute;
      const options = program.programRegistrationAttributes
        .find((a) => a.name === name)
        ?.options?.map((option) => ({
          value: option.option,
          label: this.translatableStringService.translate(option.label),
        }));
      const value: unknown = registration?.[name];

      return {
        isRequired: isRequired ?? false,
        name,
        label,
        pattern,
        options,
        value,
        type,
        isEditable: this.isEditableAttribute({
          attributeName: attribute.name,
          program,
        }),
      };
    });
  }

  getRegistrationAttributes(
    context: Signal<{
      programId: Signal<number | string>;
      registrationId?: Signal<string>;
    }>,
  ) {
    return () => {
      const { programId, registrationId } = context();

      return queryOptions<NormalizedRegistrationAttribute[]>({
        queryKey: [
          'registrationAttributes',
          programId(),
          registrationId && registrationId(),
          $localize,
          RegistrationAttributeTypes.text,
        ],
        queryFn: async () => {
          const program = await this.queryClient.fetchQuery(
            this.programApiService.getProgram(programId)(),
          );

          let registration: Registration | undefined;

          if (registrationId) {
            registration = await this.queryClient.fetchQuery(
              this.registrationApiService.getRegistrationById(
                programId,
                registrationId,
              )(),
            );
          }

          const genericAttributes = this.getGenericAttributes(
            program,
            registration,
          );
          const programSpecificAttributes =
            await this.getProgramSpecificAttributes(program, registration);

          const allNameFields = program.fullnameNamingConvention
            ? this.translatableStringService.commaSeparatedList(
                program.fullnameNamingConvention.map((namingConvention) =>
                  this.localizeAttribute({
                    attributes: programSpecificAttributes,
                    attributeName: namingConvention,
                  }),
                ),
                'long',
              )
            : '';

          return [
            {
              name: 'name',
              label: $localize`:@@registration-full-name:Name`,
              editInfo: $localize`:@@registration-full-name-edit-info:This field is dynamically generated based on the other name fields available below: ${allNameFields}:allNameFields:`,
              value: registration?.name,
              type: RegistrationAttributeTypes.text,
              isEditable: false,
              isRequired: false,
            },
            ...genericAttributes,
            ...programSpecificAttributes.filter(
              (attribute) =>
                // we show this in the generic attributes already
                attribute.name !== 'phoneNumber',
            ),
          ];
        },
      });
    };
  }

  localizeAttribute({
    attributes = [],
    attributeName,
    attributeOptionValue,
  }: {
    attributes?: NormalizedRegistrationAttribute[];
    attributeName?: GenericRegistrationAttributes | string;
    attributeOptionValue?: string;
  }): string {
    if (!attributeName) {
      return '';
    }

    const attribute = attributes.find((a) => a.name === attributeName);

    if (attributeOptionValue === undefined) {
      return (
        this.translatableStringService.translate(attribute?.label) ??
        attributeName
      );
    }

    return (
      this.translatableStringService.translate(
        attribute?.options?.find((o) => o.value === attributeOptionValue)
          ?.label,
      ) ?? attributeOptionValue
    );
  }

  private personalInformationAttributeToFormControl({
    attribute,
  }: {
    attribute: NormalizedRegistrationAttribute;
  }) {
    const isRequired = attribute.isRequired;

    return new FormControl(
      {
        value: attribute.value ?? null,
        disabled: !attribute.isEditable,
      },
      {
        validators: [
          // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
          ...(isRequired ? [Validators.required] : []),
          ...(attribute.pattern ? [Validators.pattern(attribute.pattern)] : []),
        ],
        nonNullable: isRequired,
      },
    );
  }

  attributesToFormGroup({
    attributes,
  }: {
    attributes: NormalizedRegistrationAttribute[];
  }) {
    return new FormGroup(
      attributes.reduce(
        (acc, attribute) => ({
          ...acc,
          [attribute.name]: this.personalInformationAttributeToFormControl({
            attribute,
          }),
        }),
        {},
      ),
    );
  }

  attributesToFormFormFieldErrors({
    attributes,
  }: {
    attributes: NormalizedRegistrationAttribute[];
  }) {
    return attributes.reduce(
      (acc, attribute) => ({
        ...acc,
        [attribute.name]: (control: AbstractControl) => {
          if (!control.invalid) {
            return undefined;
          }
          if (attribute.pattern) {
            return $localize`Value does not match the required pattern: ${attribute.pattern}`;
          }
          return $localize`:@@generic-required-field:This field is required.`;
        },
      }),
      {},
    );
  }
}

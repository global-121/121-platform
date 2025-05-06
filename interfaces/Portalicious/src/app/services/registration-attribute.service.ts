import { inject, Injectable, Signal, signal } from '@angular/core';
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

import {
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { FinancialAttributes } from '@121-service/src/user/enum/registration-financial-attributes.const';

import { ProjectApiService } from '~/domains/project/project.api.service';
import { projectHasInclusionScore } from '~/domains/project/project.helper';
import { Project } from '~/domains/project/project.model';
import {
  ATTRIBUTE_EDIT_INFO,
  ATTRIBUTE_LABELS,
  isGenericAttribute,
} from '~/domains/project/project-attribute.helpers';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { LANGUAGE_ENUM_LABEL } from '~/domains/registration/registration.helper';
import { Registration } from '~/domains/registration/registration.model';
import { AuthService } from '~/services/auth.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

const nonEditableAttributes = [
  'inclusionScore',
  'name',
  'paymentCountRemaining',
];

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
    case GenericRegistrationAttributes.programFinancialServiceProviderConfigurationName:
      return RegistrationAttributeTypes.dropdown;
    case GenericRegistrationAttributes.programFinancialServiceProviderConfigurationLabel:
    case GenericRegistrationAttributes.referenceId:
    case GenericRegistrationAttributes.phoneNumber:
    case GenericRegistrationAttributes.scope:
    case GenericRegistrationAttributes.status:
    case GenericRegistrationAttributes.registrationProgramId:
      return RegistrationAttributeTypes.text;
    case GenericRegistrationAttributes.created:
    case GenericRegistrationAttributes.registrationCreatedDate:
      return RegistrationAttributeTypes.date;
  }
};

export interface NormalizedRegistrationAttribute {
  name: GenericRegistrationAttributes | string;
  label: LocalizedString | string;
  editInfo?: string;
  isRequired?: boolean;
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
  private readonly queryClient = inject(QueryClient);

  private readonly authService = inject(AuthService);
  private readonly projectApiService = inject(ProjectApiService);
  private readonly registrationApiService = inject(RegistrationApiService);
  private readonly translatableStringService = inject(
    TranslatableStringService,
  );

  private hasPermissionsRequiredToEditAttribute({
    attribute,
    projectId,
  }: {
    attribute: NormalizedRegistrationAttribute;
    projectId: string;
  }) {
    const attributeName = attribute.name;

    let requiredPermission = PermissionEnum.RegistrationPersonalUPDATE;

    if (isGenericAttribute(attributeName)) {
      if (
        FinancialAttributes.includes(attributeName as keyof RegistrationEntity)
      ) {
        requiredPermission =
          PermissionEnum.RegistrationAttributeFinancialUPDATE;
      } else if (
        attributeName ===
        GenericRegistrationAttributes.programFinancialServiceProviderConfigurationName
      ) {
        requiredPermission = PermissionEnum.RegistrationFspConfigUPDATE;
      }
    }

    return this.authService.hasPermission({
      projectId,
      requiredPermission,
    });
  }

  private getGenericAttributeOptions(
    attributeName: GenericRegistrationAttributes,
    project: Project,
  ): { value: string; label?: string }[] | undefined {
    switch (attributeName) {
      case GenericRegistrationAttributes.preferredLanguage:
        return project.languages.map((language) => ({
          value: language,
          label: LANGUAGE_ENUM_LABEL[language],
        }));
      case GenericRegistrationAttributes.programFinancialServiceProviderConfigurationName:
        return project.programFinancialServiceProviderConfigurations.map(
          (fspConfig) => ({
            value: fspConfig.name,
            label: this.translatableStringService.translate(fspConfig.label),
          }),
        );
      default:
        return undefined;
    }
  }

  private getGenericAttributes(
    project: Project,
    registration?: Registration,
  ): NormalizedRegistrationAttribute[] {
    const genericAttributeNames: GenericRegistrationAttributes[] = [
      GenericRegistrationAttributes.phoneNumber,
      GenericRegistrationAttributes.programFinancialServiceProviderConfigurationName,
      GenericRegistrationAttributes.paymentAmountMultiplier,
      GenericRegistrationAttributes.preferredLanguage,
    ];

    if (project.enableScope) {
      genericAttributeNames.push(GenericRegistrationAttributes.scope);
    }

    if (project.enableMaxPayments) {
      genericAttributeNames.push(
        GenericRegistrationAttributes.maxPayments,
        GenericRegistrationAttributes.paymentCountRemaining,
      );
    }

    if (projectHasInclusionScore(project)) {
      genericAttributeNames.push(GenericRegistrationAttributes.inclusionScore);
    }

    return genericAttributeNames.map((attributeName) => {
      const type = getGenericAttributeType(attributeName);
      const options = this.getGenericAttributeOptions(attributeName, project);
      const value: unknown = registration?.[attributeName];

      return {
        name: attributeName,
        label: ATTRIBUTE_LABELS[attributeName],
        editInfo: ATTRIBUTE_EDIT_INFO[attributeName],
        options,
        value,
        type,
      };
    });
  }

  private async getProjectSpecificAttributes(
    project: Project,
    registration?: Registration,
  ): Promise<NormalizedRegistrationAttribute[]> {
    const projectAttributes = await this.queryClient.fetchQuery(
      this.projectApiService.getProjectAttributes({
        projectId: signal(project.id),
        includeProgramRegistrationAttributes: true,
        includeTemplateDefaultAttributes: false,
      })(),
    );

    return projectAttributes.map((attribute) => {
      const { isRequired, name, translatedLabel, pattern, type } = attribute;
      const options = project.programRegistrationAttributes
        .find((a) => a.name === name)
        ?.options?.map((option) => ({
          value: option.option,
          label: this.translatableStringService.translate(option.label),
        }));
      const value: unknown = registration?.[name];

      return {
        isRequired,
        name,
        label: translatedLabel,
        pattern,
        options,
        value,
        type,
      };
    });
  }

  getRegistrationAttributes(
    context: Signal<{
      projectId: Signal<number | string>;
      registrationId?: Signal<string>;
    }>,
  ) {
    return () => {
      const { projectId, registrationId } = context();

      return queryOptions({
        queryKey: [
          'registrationAttributes',
          projectId(),
          registrationId && registrationId(),
          $localize,
          RegistrationAttributeTypes.text,
        ],
        queryFn: async () => {
          const project = await this.queryClient.fetchQuery(
            this.projectApiService.getProject(projectId)(),
          );

          let registration: Registration | undefined;

          if (registrationId) {
            registration = await this.queryClient.fetchQuery(
              this.registrationApiService.getRegistrationById(
                projectId,
                registrationId,
              )(),
            );
          }

          const genericAttributes = this.getGenericAttributes(
            project,
            registration,
          );
          const projectSpecificAttributes =
            await this.getProjectSpecificAttributes(project, registration);

          return [
            {
              name: 'name',
              label: $localize`:@@registration-full-name:Name`,
              editInfo:
                $localize`:@@registration-full-name-edit-info:This field is dynamically generated based on the other name fields available below: ` +
                (project.fullnameNamingConvention
                  ? this.translatableStringService.commaSeparatedList(
                      project.fullnameNamingConvention.map((namingConvention) =>
                        this.localizeAttribute({
                          attributes: projectSpecificAttributes,
                          attributeName: namingConvention,
                        }),
                      ),
                      'long',
                    )
                  : ''),
              value: registration?.name,
              type: RegistrationAttributeTypes.text,
            },
            ...genericAttributes,
            ...projectSpecificAttributes.filter(
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
    projectId,
  }: {
    attribute: NormalizedRegistrationAttribute;
    projectId: string;
  }) {
    const isRequired = attribute.isRequired;

    const hasRequiredPermissions = this.hasPermissionsRequiredToEditAttribute({
      attribute,
      projectId,
    });

    return new FormControl(
      {
        value: attribute.value ?? null,
        disabled:
          nonEditableAttributes.includes(attribute.name) ||
          !hasRequiredPermissions,
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
    projectId,
  }: {
    attributes: NormalizedRegistrationAttribute[];
    projectId: string;
  }) {
    return new FormGroup(
      attributes.reduce(
        (acc, attribute) => ({
          ...acc,
          [attribute.name]: this.personalInformationAttributeToFormControl({
            attribute,
            projectId,
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

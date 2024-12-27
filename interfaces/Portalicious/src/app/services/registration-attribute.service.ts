import { inject, Injectable, Signal, signal } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import {
  injectQueryClient,
  queryOptions,
} from '@tanstack/angular-query-experimental';

import {
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { ProjectApiService } from '~/domains/project/project.api.service';
import { projectHasInclusionScore } from '~/domains/project/project.helper';
import { Project } from '~/domains/project/project.model';
import {
  ATTRIBUTE_LABELS,
  getGenericAttributeOptions,
  getGenericAttributeType,
  isGenericAttribute,
} from '~/domains/project/project-attribute.helpers';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { Registration } from '~/domains/registration/registration.model';
import { AuthService } from '~/services/auth.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

export interface NormalizedRegistrationAttribute {
  isRequired?: boolean;
  name: GenericRegistrationAttributes | string;
  label: LocalizedString | string;
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
  private readonly queryClient = injectQueryClient();

  private readonly authService = inject(AuthService);
  private readonly projectApiService = inject(ProjectApiService);
  private readonly registrationApiService = inject(RegistrationApiService);
  private readonly translatableStringService = inject(
    TranslatableStringService,
  );

  static nonEditableAttributes = ['inclusionScore', 'name'];
  static attributeSpecificEditPermissions: Partial<
    Record<GenericRegistrationAttributes, PermissionEnum[]>
  > = {
    [GenericRegistrationAttributes.paymentAmountMultiplier]: [
      PermissionEnum.RegistrationAttributeFinancialUPDATE,
    ],
    [GenericRegistrationAttributes.maxPayments]: [
      PermissionEnum.RegistrationAttributeFinancialUPDATE,
    ],
    [GenericRegistrationAttributes.programFinancialServiceProviderConfigurationName]:
      [PermissionEnum.RegistrationFspConfigUPDATE],
    [GenericRegistrationAttributes.scope]: [],
  };

  private hasPermissionsRequiredToEditAttribute({
    attribute,
    projectId,
  }: {
    attribute: NormalizedRegistrationAttribute;
    projectId: string;
  }) {
    // default permissions needed to edit an attribute
    let requiredPermissions = [PermissionEnum.RegistrationPersonalUPDATE];

    const attributeName = attribute.name;

    if (
      isGenericAttribute(attributeName) &&
      RegistrationAttributeService.attributeSpecificEditPermissions[
        attributeName
      ]
    ) {
      requiredPermissions =
        RegistrationAttributeService.attributeSpecificEditPermissions[
          attributeName
        ];
    }

    return this.authService.hasAllPermissions({
      projectId,
      requiredPermissions,
    });
  }

  personalInformationAttributeToFormControl({
    attribute,
    projectId,
  }: {
    attribute: NormalizedRegistrationAttribute;
    projectId: string;
  }) {
    const isRequired =
      attribute.isRequired ??
      attribute.type === RegistrationAttributeTypes.numeric;

    const hasRequiredPermissions = this.hasPermissionsRequiredToEditAttribute({
      attribute,
      projectId,
    });

    return new FormControl<typeof attribute.value>(
      {
        value: attribute.value,
        disabled:
          RegistrationAttributeService.nonEditableAttributes.includes(
            attribute.name,
          ) || !hasRequiredPermissions,
      },
      {
        validators: [
          // eslint-disable-next-line @typescript-eslint/unbound-method
          ...(isRequired ? [Validators.required] : []),
          ...(attribute.pattern ? [Validators.pattern(attribute.pattern)] : []),
        ],
        nonNullable: isRequired,
      },
    );
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
      const options = getGenericAttributeOptions(attributeName, project);

      return {
        name: attributeName,
        label: ATTRIBUTE_LABELS[attributeName],
        options: options?.map((option) => ({
          value: option.value,
          label: this.translatableStringService.translate(option.label),
        })),
        value: registration?.[attributeName],
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

    return projectAttributes.map(
      ({ isRequired, name, label, pattern, type }) => {
        const options = project.programRegistrationAttributes
          .find((a) => a.name === name)
          ?.options?.map((option) => ({
            value: option.option,
            label: this.translatableStringService.translate(option.label),
          }));

        return {
          isRequired,
          name,
          label,
          pattern,
          options,
          value: registration?.[name],
          type,
        };
      },
    );
  }

  getRegistrationAttributes(
    context: Signal<{
      projectId: Signal<number | string>;
      registrationId?: Signal<string>;
    }>,
  ) {
    return () =>
      queryOptions({
        queryKey: [
          'registrationAttributes',
          context,
          $localize,
          RegistrationAttributeTypes.text,
        ],
        queryFn: async () => {
          const { projectId, registrationId } = context();

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
            // XXX: name is not editable, so should we instead just bring all of the attributes in the naming convention to the top?
            {
              name: 'name',
              label: $localize`:@@registration-full-name:Name`,
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
}

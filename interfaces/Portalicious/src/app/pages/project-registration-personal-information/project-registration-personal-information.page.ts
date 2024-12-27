import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import {
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { RegistrationPageLayoutComponent } from '~/components/registration-page-layout/registration-page-layout.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { projectHasInclusionScore } from '~/domains/project/project.helper';
import {
  ATTRIBUTE_LABELS,
  getGenericAttributeType,
  getValueForGenericAttribute,
  personalInformationAttributeToDataListItem,
} from '~/domains/project/project-attribute.helpers';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';

export interface PersonalInformationAttribute {
  name: string;
  label: LocalizedString | string;
  value: unknown;
  type: RegistrationAttributeTypes;
}

@Component({
  selector: 'app-project-registration-personal-information',
  standalone: true,
  imports: [DataListComponent, RegistrationPageLayoutComponent],
  templateUrl: './project-registration-personal-information.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationPersonalInformationPageComponent {
  // this is injected by the router
  readonly projectId = input.required<string>();
  readonly registrationId = input.required<string>();

  readonly registrationApiService = inject(RegistrationApiService);
  readonly projectApiService = inject(ProjectApiService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  projectAttributes = injectQuery(
    this.projectApiService.getProjectAttributes({
      projectId: this.projectId,
      includeProgramRegistrationAttributes: true,
      includeTemplateDefaultAttributes: false,
    }),
  );
  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );

  attributeList = computed<PersonalInformationAttribute[]>(() => {
    const genericAttributes =
      this.genericAttributeNamesForPersonalInformation();

    const projectSpecificAttributes = (
      this.projectAttributes.data() ?? []
    ).filter(
      (attribute) =>
        // both of these are handled elsewhere we don't want to duplicate them here
        attribute.name !== 'fullName' && attribute.name !== 'phoneNumber',
    );

    return [
      {
        name: 'name',
        label: $localize`:@@registration-full-name:Name`,
        value: this.registration.data()?.name,
        type: RegistrationAttributeTypes.text,
      },
      ...genericAttributes.map((attributeName) => {
        const value = getValueForGenericAttribute(
          this.registration.data()?.[attributeName],
          attributeName,
        );
        const type = getGenericAttributeType(attributeName);

        return {
          name: attributeName,
          label: ATTRIBUTE_LABELS[attributeName],
          value,
          type,
        };
      }),
      ...projectSpecificAttributes.map(({ name, label, type }) => {
        return {
          name,
          label,
          value: this.registration.data()?.[name],
          type,
        };
      }),
    ];
  });

  dataList = computed<DataListItem[]>(() =>
    this.attributeList().map((attribute) => ({
      ...personalInformationAttributeToDataListItem(attribute),
      loading: this.registration.isPending(),
    })),
  );

  private genericAttributeNamesForPersonalInformation = computed<
    GenericRegistrationAttributes[]
  >(() => {
    const genericAttributeNames: GenericRegistrationAttributes[] = [
      GenericRegistrationAttributes.phoneNumber,
      GenericRegistrationAttributes.programFinancialServiceProviderConfigurationLabel,
      GenericRegistrationAttributes.paymentAmountMultiplier,
      GenericRegistrationAttributes.preferredLanguage,
    ];
    if (this.project.data()?.enableMaxPayments) {
      genericAttributeNames.concat([
        GenericRegistrationAttributes.maxPayments,
        GenericRegistrationAttributes.paymentCountRemaining,
      ]);
    }
    if (projectHasInclusionScore(this.project.data())) {
      genericAttributeNames.push(GenericRegistrationAttributes.inclusionScore);
    }
    return genericAttributeNames;
  });
}

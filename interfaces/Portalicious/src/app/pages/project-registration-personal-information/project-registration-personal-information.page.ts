import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TabMenuModule } from 'primeng/tabmenu';

import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { RegistrationPageLayoutComponent } from '~/components/registration-page-layout/registration-page-layout.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { projectHasInclusionScore } from '~/domains/project/project.helper';
import {
  getGenericAttributeDataListItem,
  getValueForGenericAttribute,
  projectAttributeToDataListItem,
} from '~/domains/project/project-attribute.helpers';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';

@Component({
  selector: 'app-project-registration-personal-information',
  standalone: true,
  imports: [
    CardModule,
    TabMenuModule,
    CommonModule,
    FormsModule,
    SelectButtonModule,
    InputTextModule,
    DataListComponent,
    RegistrationPageLayoutComponent,
  ],
  templateUrl: './project-registration-personal-information.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationPersonalInformationPageComponent {
  readonly registrationApiService = inject(RegistrationApiService);
  readonly projectApiService = inject(ProjectApiService);

  projectId = input.required<number>();
  registrationId = input.required<number>();

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

  project = injectQuery(this.projectApiService.getProject(this.projectId));

  attributeList = computed<DataListItem[]>(() => {
    const list: DataListItem[] = [];
    if (!this.projectAttributes.isSuccess() || !this.registration.isSuccess()) {
      return list;
    }

    const genericAttributeNames =
      this.genericAttributeNamesForPersonalInformation();
    for (const attributeName of genericAttributeNames) {
      const value = getValueForGenericAttribute(
        this.registration.data()[attributeName],
        attributeName,
      );
      const genericAttributeListItem = getGenericAttributeDataListItem(
        attributeName,
        value,
      );
      list.push(genericAttributeListItem);
    }
    for (const attribute of this.projectAttributes.data()) {
      const value = this.registration.data()[attribute.name] as unknown;
      const dataListItem = projectAttributeToDataListItem(attribute, value);
      if (dataListItem) {
        list.push(dataListItem);
      }
    }
    return list;
  });

  private genericAttributeNamesForPersonalInformation = computed<
    GenericRegistrationAttributes[]
  >(() => {
    const genericAttributeNames: GenericRegistrationAttributes[] = [
      GenericRegistrationAttributes.preferredLanguage,
      GenericRegistrationAttributes.programFinancialServiceProviderConfigurationLabel,
      GenericRegistrationAttributes.paymentAmountMultiplier,
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

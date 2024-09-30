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

import { QuestionType } from '@121-service/src/registration/enum/custom-data-attributes';

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FormDefaultComponent } from '~/components/form/form-default.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { financialServiceProviderApiService } from '~/domains/financial-service-provider/financial-service-provider.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { attributeToDataListItem } from '~/domains/project/project.helper';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';

@Component({
  selector: 'app-project-registration-personal-information',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CardModule,
    TabMenuModule,
    CommonModule,
    FormsModule,
    SelectButtonModule,
    InputTextModule,
    FormDefaultComponent,
    FormFieldWrapperComponent,
    DataListComponent,
  ],
  templateUrl: './project-registration-personal-information.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationPersonalInformationPageComponent {
  readonly registrationApiService = inject(RegistrationApiService);
  readonly projectApiService = inject(ProjectApiService);
  readonly fspApiService = inject(financialServiceProviderApiService);

  projectId = input.required<number>();
  registrationId = input.required<number>();

  projectAttributes = injectQuery(
    this.projectApiService.getProjectAttributes({
      projectId: this.projectId,
      includeCustomAttributes: true,
      includeFspQuestions: true,
      includeProgramQuestions: true,
      includeTemplateDefaultAttributes: true,
    }),
  );

  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );

  selectedFspQuestionList = injectQuery(() => ({
    ...this.fspApiService.getFinancialServiceProviderQuestions(
      this.registration.data()?.financialServiceProvider,
    )(),
    enabled:
      this.registration.isSuccess() && this.projectAttributes.isSuccess(),
  }));

  attributeList = computed<DataListItem[]>(() => {
    const list: DataListItem[] = [];
    if (!this.projectAttributes.isSuccess() || !this.registration.isSuccess()) {
      return list;
    }

    for (const attribute of this.projectAttributes.data()) {
      if (
        attribute.questionType === QuestionType.fspQuestion &&
        !this.selectedFspQuestionList.data()?.includes(attribute.name)
      ) {
        continue;
      }

      const value = this.registration.data()[attribute.name] as unknown;
      const dataListItem = attributeToDataListItem(attribute, value);
      if (dataListItem) {
        list.push(dataListItem);
      }
    }

    return list;
  });
}

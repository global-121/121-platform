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

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FormDefaultComponent } from '~/components/form/form-default.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { ATTRIBUTE_LABELS } from '~/domains/project/project.helper';
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

  dataList = computed<DataListItem[]>(() => {
    const list: DataListItem[] = [];
    if (!this.projectAttributes.isSuccess() || !this.registration.isSuccess()) {
      return list;
    }

    for (const attribute of this.projectAttributes.data()) {
      list.push({
        label:
          attribute.label ?? ATTRIBUTE_LABELS[attribute.name] ?? attribute.name,
        value: this.registration.data()[attribute.name],
      });
    }

    return list;
  });
}

import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';

import { ProjectApiService } from '~/domains/project/project.api.service';

@Component({
  selector: 'app-registration-questions-table',
  imports: [TableModule, TabsModule, NgTemplateOutlet],
  templateUrl: './registration-questions-table.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationQuestionsTableComponent {
  readonly projectId = input.required<string>();

  projectApiService = inject(ProjectApiService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  projectAttributes = injectQuery(
    this.projectApiService.getProjectAttributes({
      projectId: this.projectId,
      includeProgramRegistrationAttributes: true,
    }),
  );
}

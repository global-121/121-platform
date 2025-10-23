import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardModule } from 'primeng/card';

import { PageLayoutProjectSettingsComponent } from '~/components/page-layout-project-settings/page-layout-project-settings.component';
import { DeduplicationAttributesTableComponent } from '~/pages/project-settings-registration-data/components/deduplication-attributes-table/deduplication-attributes-table.component';
import { RegistrationQuestionsTableComponent } from '~/pages/project-settings-registration-data/components/registration-questions-table/registration-questions-table.component';

@Component({
  selector: 'app-project-settings-registration-data',
  imports: [
    CardModule,
    RegistrationQuestionsTableComponent,
    DeduplicationAttributesTableComponent,
    PageLayoutProjectSettingsComponent,
  ],
  templateUrl: './project-settings-registration-data.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsRegistrationDataPageComponent {
  readonly projectId = input.required<string>();
}

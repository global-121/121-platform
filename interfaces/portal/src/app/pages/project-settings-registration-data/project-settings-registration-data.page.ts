import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';

import { PageLayoutProjectSettingsComponent } from '~/components/page-layout-project-settings/page-layout-project-settings.component';
import { KoboApiService } from '~/domains/kobo/kobo.api.service';
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

  koboApiService = inject(KoboApiService);

  koboIntegration = injectQuery(() => ({
    ...this.koboApiService.getKoboIntegration(this.projectId)(),
    // Without this attribute, any open popups will be closed when the user switches tabs
    retry: false,
    // Without this attribute, any open popups will be closed when the user switches tabs
    refetchOnWindowFocus: false,
  }));
}

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { ProjectSettingsPageLayoutComponent } from '~/components/project-settings-page-layout/project-settings-page-layout.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { KoboApiService } from '~/domains/kobo/kobo.api.service';
import { DeduplicationAttributesTableComponent } from '~/pages/project-settings-registration-data/components/deduplication-attributes-table/deduplication-attributes-table.component';
import { ImportExcelTableButtonComponent } from '~/pages/project-settings-registration-data/components/import-excel-table-button/import-excel-table-button.component';
import { IntegrateKoboButtonComponent } from '~/pages/project-settings-registration-data/components/integrate-kobo-button/integrate-kobo-button.component';
import { RegistrationQuestionsTableComponent } from '~/pages/project-settings-registration-data/components/registration-questions-table/registration-questions-table.component';

@Component({
  selector: 'app-project-settings-registration-data',
  imports: [
    ProjectSettingsPageLayoutComponent,
    CardModule,
    IntegrateKoboButtonComponent,
    ImportExcelTableButtonComponent,
    SkeletonInlineComponent,
    CardWithLinkComponent,
    RegistrationQuestionsTableComponent,
    DeduplicationAttributesTableComponent,
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
    retry: false,
  }));
}

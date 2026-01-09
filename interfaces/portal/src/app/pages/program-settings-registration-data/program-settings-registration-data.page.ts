import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { KoboApiService } from '~/domains/kobo/kobo.api.service';
import { IntegrateKoboButtonComponent } from '~/pages/program-settings-registration-data/components/integrate-kobo-button/integrate-kobo-button.component';

@Component({
  selector: 'app-program-settings-registration-data',
  imports: [
    CardModule,
    PageLayoutProgramSettingsComponent,
    SkeletonInlineComponent,
    CardWithLinkComponent,
    IntegrateKoboButtonComponent,
  ],
  templateUrl: './program-settings-registration-data.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsRegistrationDataPageComponent {
  readonly programId = input.required<string>();

  koboApiService = inject(KoboApiService);

  koboIntegration = injectQuery(() => ({
    ...this.koboApiService.getKoboIntegration(this.programId)(),
    retry: false, // Without this, any open popups will be closed when the user switches tabs
    refetchOnWindowFocus: false, // Without this, any open popups will be closed when the user switches tabs
  }));
}

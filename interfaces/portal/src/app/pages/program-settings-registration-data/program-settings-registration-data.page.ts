import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';

import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { isKoboIntegrated } from '~/domains/kobo/kobo.helpers';
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { KoboIntegrationCardComponent } from '~/pages/program-settings-registration-data/components/kobo-integration-card/kobo-integration-card.component';
import { RegistrationQuestionsCardComponent } from '~/pages/program-settings-registration-data/components/registration-questions-card/registration-questions-card.component';

@Component({
  selector: 'app-program-settings-registration-data',
  imports: [
    CardModule,
    PageLayoutProgramSettingsComponent,
    KoboIntegrationCardComponent,
    RegistrationQuestionsCardComponent,
  ],
  templateUrl: './program-settings-registration-data.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsRegistrationDataPageComponent {
  readonly programId = input.required<string>();

  private readonly koboApiService = inject(KoboApiService);

  readonly koboIntegration = injectQuery(() => ({
    ...this.koboApiService.getKoboIntegration(this.programId)(),
    enabled: !!this.programId(),
  }));

  readonly isKoboIntegrated = computed<boolean>(() =>
    isKoboIntegrated(this.koboIntegration),
  );
}

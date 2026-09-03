import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';

import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { isActivityInfoIntegrated } from '~/domains/activityinfo/activityinfo.helpers';
import { ActivityInfoApiService } from '~/domains/activityinfo/activityinfo-api.service';
import { isKoboIntegrated } from '~/domains/kobo/kobo.helpers';
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { ActivityInfoIntegrationCardComponent } from '~/pages/program-settings-registration-data/components/activityinfo-integration-card/activityinfo-integration-card.component';
import { DeduplicationCardComponent } from '~/pages/program-settings-registration-data/components/deduplication-card/deduplication-card.component';
import { KoboIntegrationCardComponent } from '~/pages/program-settings-registration-data/components/kobo-integration-card/kobo-integration-card.component';
import { RegistrationQuestionsCardComponent } from '~/pages/program-settings-registration-data/components/registration-questions-card/registration-questions-card.component';
import { RequiredAttributesComponent } from '~/pages/program-settings-registration-data/components/required-attributes/required-attributes.component';

@Component({
  selector: 'app-program-settings-registration-data',
  imports: [
    CardModule,
    PageLayoutProgramSettingsComponent,
    KoboIntegrationCardComponent,
    ActivityInfoIntegrationCardComponent,
    RequiredAttributesComponent,
    ManualLinkComponent,
    RegistrationQuestionsCardComponent,
    DeduplicationCardComponent,
  ],
  templateUrl: './program-settings-registration-data.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsRegistrationDataPageComponent {
  readonly programId = input.required<string>();

  private readonly koboApiService = inject(KoboApiService);
  private readonly activityInfoApiService = inject(ActivityInfoApiService);

  readonly koboIntegration = injectQuery(() => ({
    ...this.koboApiService.getKoboIntegration(this.programId)(),
    enabled: !!this.programId(),
  }));

  readonly activityInfoIntegration = injectQuery(() => ({
    ...this.activityInfoApiService.getActivityInfoIntegration(this.programId)(),
    enabled: !!this.programId(),
  }));

  readonly isKoboIntegrated = computed<boolean>(() =>
    isKoboIntegrated(this.koboIntegration),
  );

  readonly isActivityInfoIntegrated = computed<boolean>(() =>
    isActivityInfoIntegrated(this.activityInfoIntegration),
  );

  readonly isAnyRegistrationToolIntegrated = computed<boolean>(
    () => this.isKoboIntegrated() || this.isActivityInfoIntegrated(),
  );

  readonly isRegistrationToolIntegrationPending = computed<boolean>(
    () =>
      this.koboIntegration.isPending() ||
      this.activityInfoIntegration.isPending(),
  );
}

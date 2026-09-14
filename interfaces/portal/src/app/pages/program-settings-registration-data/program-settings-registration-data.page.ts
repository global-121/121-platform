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
import {
  NotificationBannerComponent,
  NotificationBannerContent,
} from '~/components/notification-banner/notification-banner.component';
import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { isKoboIntegrated } from '~/domains/kobo/kobo.helpers';
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { DeduplicationCardComponent } from '~/pages/program-settings-registration-data/components/deduplication-card/deduplication-card.component';
import { KoboIntegrationCardComponent } from '~/pages/program-settings-registration-data/components/kobo-integration-card/kobo-integration-card.component';
import { RegistrationQuestionsCardComponent } from '~/pages/program-settings-registration-data/components/registration-questions-card/registration-questions-card.component';
import { RequiredAttributesComponent } from '~/pages/program-settings-registration-data/components/required-attributes/required-attributes.component';
import { ColorVariant } from '~/utils/color-variant.enum';

@Component({
  selector: 'app-program-settings-registration-data',
  imports: [
    CardModule,
    PageLayoutProgramSettingsComponent,
    KoboIntegrationCardComponent,
    RequiredAttributesComponent,
    ManualLinkComponent,
    RegistrationQuestionsCardComponent,
    DeduplicationCardComponent,
    NotificationBannerComponent,
  ],
  templateUrl: './program-settings-registration-data.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsRegistrationDataPageComponent {
  readonly programId = input.required<string>();
  readonly ColorVariant = ColorVariant;

  private readonly koboApiService = inject(KoboApiService);
  private readonly fspConfigurationApiService = inject(
    FspConfigurationApiService,
  );

  readonly koboIntegration = injectQuery(() => ({
    ...this.koboApiService.getKoboIntegration(this.programId)(),
    enabled: !!this.programId(),
  }));

  readonly fspConfigurations = injectQuery(() => ({
    ...this.fspConfigurationApiService.getFspConfigurations(this.programId)(),
  }));

  readonly noFspConfigurationsBannerContent: NotificationBannerContent = {
    title: $localize`Pending FSP selection`,
    description: $localize`Add FSP(s) to your program to see all required data columns.`,
    icon: 'warning',
  };

  // Computed properties

  readonly fspConfigurationCount = computed<number>(() => {
    if (this.fspConfigurations.isPending()) {
      return 0;
    }
    return this.fspConfigurations.data()?.length ?? 0;
  });

  readonly isKoboIntegrated = computed<boolean>(() =>
    isKoboIntegrated(this.koboIntegration),
  );
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';

import {
  NotificationBannerComponent,
  NotificationBannerIcon,
} from '~/components/notification-banner/notification-banner.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { FspConfigurationCardComponent } from '~/pages/program-settings-fsps/components/fsp-configuration-card/fsp-configuration-card.component';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-fsp-configuration-list',
  imports: [
    CardModule,
    ButtonModule,
    SkeletonInlineComponent,
    FspConfigurationCardComponent,
    NotificationBannerComponent,
  ],
  templateUrl: './fsp-configuration-list.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FspConfigurationListComponent {
  readonly authService = inject(AuthService);
  readonly programId = input.required<string>();
  readonly forceShowNewFspList = model.required<boolean>();
  readonly addFspConfiguration = output<Fsps>();
  readonly reconfigureFspConfiguration = output<FspConfiguration>();

  readonly fspConfigurationApiService = inject(FspConfigurationApiService);

  fspConfigurations = injectQuery(
    this.fspConfigurationApiService.getFspConfigurations(this.programId),
  );

  readonly integrationRequiredBannerContent = {
    title: $localize`Integration required`,
    description: $localize`Integrate your FSPs before paying your registrations.`,
    icon: 'alert' as NotificationBannerIcon,
  };

  readonly notAllFspsIntegrated = computed(
    () =>
      this.fspConfigurations
        .data()
        ?.some(
          (fspConfiguration) =>
            fspConfiguration.state ===
            FspConfigurationStates.configurationPending,
        ) ?? false,
  );
}

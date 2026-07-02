import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  output,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

import {
  NotificationBannerComponent,
  NotificationBannerIcon,
} from '~/components/notification-banner/notification-banner.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { injectFspConfigurations } from '~/domains/fsp-configuration/fsp-configuration.helper';
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

  readonly fspConfigurationsData = injectFspConfigurations({
    programId: this.programId,
  });

  readonly fspConfigurations = this.fspConfigurationsData.fspConfigurations;
  readonly notAllFspsIntegrated =
    this.fspConfigurationsData.notAllFspsIntegrated;

  readonly integrationRequiredBannerContent = {
    title: $localize`Integration required`,
    description: $localize`Integrate your FSPs before paying your registrations.`,
    icon: 'alert' as NotificationBannerIcon,
  };
}

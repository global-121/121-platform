import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';

import { injectQuery } from 'node_modules/@tanstack/angular-query-experimental/inject-query';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { FSP_IMAGE_URLS } from '~/domains/fsp-configuration/fsp-configuration.helper';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { FspConfigurationCardComponent } from '~/pages/project-settings-fsps/components/fsp-configuration-card/fsp-configuration-card.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-fsp-configuration-list',
  imports: [
    CardModule,
    ButtonModule,
    SkeletonInlineComponent,
    FspConfigurationCardComponent,
    CardWithLinkComponent,
    TranslatableStringPipe,
  ],
  templateUrl: './fsp-configuration-list.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FspConfigurationListComponent {
  readonly projectId = input.required<string>();
  readonly forceShowNewFspList = model.required<boolean>();
  readonly addFspConfiguration = output<Fsps>();
  readonly reconfigureFspConfiguration = output<FspConfiguration>();

  readonly fspConfigurationApiService = inject(FspConfigurationApiService);

  fspConfigurations = injectQuery(
    this.fspConfigurationApiService.getFspConfigurations(this.projectId),
  );

  FSP_IMAGE_URLS = FSP_IMAGE_URLS;

  readonly configurableFsps = computed(() =>
    Object.values(FSP_SETTINGS).filter(
      (fspSetting) =>
        // Can always add multiple Excel FSP configurations
        fspSetting.name === Fsps.excel ||
        (!this.hasFspConfiguration(fspSetting.name) &&
          fspSetting.name !== Fsps.deprecatedJumbo),
    ),
  );

  private hasFspConfiguration(fspName: Fsps) {
    return this.fspConfigurations
      .data()
      ?.some((fspConfiguration) => fspConfiguration.fspName === fspName);
  }
}

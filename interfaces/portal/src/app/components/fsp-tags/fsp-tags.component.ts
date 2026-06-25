import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';

import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-fsp-tags',
  imports: [TableModule, TagModule, TranslatableStringPipe],
  providers: [ToastService],
  templateUrl: './fsp-tags.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FspTagsComponent {
  readonly programId = input.required<number | string>();
  readonly fspConfigurationApiService = inject(FspConfigurationApiService);

  readonly fspConfigurations = injectQuery(
    this.fspConfigurationApiService.getFspConfigurations(this.programId),
  );

  readonly programFsps = computed(() => {
    const fspConfigs = this.fspConfigurations.data() ?? [];
    return fspConfigs.map((config) => FSP_SETTINGS[config.fspName]);
  });
}

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';

import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsp-management/fsp-settings.const';

import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { FspConfigurationFormDialogComponent } from '~/pages/program-settings-fsps/components/fsp-configuration-form-dialog/fsp-configuration-form-dialog.component';
import { FspConfigurationListComponent } from '~/pages/program-settings-fsps/components/fsp-configuration-list/fsp-configuration-list.component';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-program-settings-fsps',
  imports: [
    PageLayoutProgramSettingsComponent,
    FspConfigurationListComponent,
    FspConfigurationFormDialogComponent,
  ],
  templateUrl: './program-settings-fsps.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class ProgramSettingsFspsPageComponent {
  readonly programId = input.required<string>();

  readonly fspConfigurationApiService = inject(FspConfigurationApiService);
  readonly translatableStringService = inject(TranslatableStringService);
  readonly toastService = inject(ToastService);

  readonly forceShowNewFspList = model(false);

  readonly fspConfigurationFormDialog =
    viewChild.required<FspConfigurationFormDialogComponent>(
      'fspConfigurationFormDialog',
    );

  addFspConfiguration(fsp: Fsps) {
    this.fspConfigurationFormDialog().show({ fspSetting: FSP_SETTINGS[fsp] });
  }

  reconfigureFspConfiguration(configuration: FspConfiguration) {
    this.fspConfigurationFormDialog().show({
      fspSetting: FSP_SETTINGS[configuration.fspName],
      fspConfiguration: configuration,
    });
  }

  configurationCompleted(fspConfiguration: FspConfiguration) {
    const fspDisplayName = this.translatableStringService.translate(
      fspConfiguration.label,
    );

    this.toastService.showToast({
      detail: $localize`FSP "${fspDisplayName}" integrated successfully.`,
    });

    this.forceShowNewFspList.set(false);
  }
}

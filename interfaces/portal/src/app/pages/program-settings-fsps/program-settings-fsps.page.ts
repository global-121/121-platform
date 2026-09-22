import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { ExcelFspConfigurationDialogComponent } from '~/pages/program-settings-fsps/components/excel-fsp-dialog-content/excel-fsp-configuration-dialog.component';
import { FspConfigurationFormDialogComponent } from '~/pages/program-settings-fsps/components/fsp-configuration-form-dialog/fsp-configuration-form-dialog.component';
import { FspConfigurationListComponent } from '~/pages/program-settings-fsps/components/fsp-configuration-list/fsp-configuration-list.component';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-program-settings-fsps',
  imports: [
    PageLayoutProgramSettingsComponent,
    FspConfigurationListComponent,
    ExcelFspConfigurationDialogComponent,
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
  readonly excelFspConfigurationDialog =
    viewChild.required<ExcelFspConfigurationDialogComponent>(
      'excelFspConfigurationDialog',
    );

  async addFspConfiguration(fsp: Fsps): Promise<void> {
    if (fsp === Fsps.excel) {
      await this.excelFspConfigurationDialog().show({});
      return;
    }

    this.fspConfigurationFormDialog().show({
      fspSetting: FSP_SETTINGS[fsp],
    });
  }

  async reconfigureFspConfiguration(
    configuration: FspConfiguration,
  ): Promise<void> {
    if (configuration.fspName === Fsps.excel) {
      await this.excelFspConfigurationDialog().show({
        fspConfiguration: configuration,
      });
      return;
    }

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

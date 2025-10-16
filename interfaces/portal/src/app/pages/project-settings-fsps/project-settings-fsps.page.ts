import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';

import { PageLayoutProjectSettingsComponent } from '~/components/page-layout-project-settings/page-layout-project-settings.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { FspConfigurationFormDialogComponent } from '~/pages/project-settings-fsps/components/fsp-configuration-form-dialog/fsp-configuration-form-dialog.component';
import { FspConfigurationListComponent } from '~/pages/project-settings-fsps/components/fsp-configuration-list/fsp-configuration-list.component';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-settings-fsps',
  imports: [
    PageLayoutProjectSettingsComponent,
    FspConfigurationListComponent,
    FspConfigurationFormDialogComponent,
  ],
  templateUrl: './project-settings-fsps.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class ProjectSettingsFspsPageComponent {
  readonly projectId = input.required<string>();

  readonly fspConfigurationApiService = inject(FspConfigurationApiService);
  readonly projectApiService = inject(ProjectApiService);
  readonly toastService = inject(ToastService);

  readonly forceShowNewFspList = model(false);

  readonly fspConfigurationFormDialog =
    viewChild.required<FspConfigurationFormDialogComponent>(
      'fspConfigurationFormDialog',
    );

  configurationCompleted() {
    this.toastService.showToast({
      detail: $localize`FSP integrated successfully.`,
    });

    void this.fspConfigurationApiService.invalidateCache(this.projectId);
    void this.projectApiService.invalidateCache(this.projectId);

    this.forceShowNewFspList.set(false);
  }

  showFspConfigurationDialog(opts: {
    fsp: Fsps;
    fspConfiguration?: FspConfiguration;
  }) {
    this.fspConfigurationFormDialog().show(opts);
  }
}

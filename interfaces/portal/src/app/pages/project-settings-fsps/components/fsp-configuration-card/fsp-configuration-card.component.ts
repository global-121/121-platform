import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';

import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { EllipsisMenuComponent } from '~/components/ellipsis-menu/ellipsis-menu.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { FSP_IMAGE_URLS } from '~/domains/fsp-configuration/fsp-configuration.helper';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { FspConfigurationService } from '~/services/fsp-configuration.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-fsp-configuration-card',
  imports: [
    CardModule,
    TranslatableStringPipe,
    ButtonModule,
    FormDialogComponent,
    TableModule,
    CardWithLinkComponent,
    EllipsisMenuComponent,
  ],
  templateUrl: './fsp-configuration-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class FspConfigurationCardComponent {
  readonly projectId = input.required<string>();
  readonly configuration = input.required<FspConfiguration>();
  readonly reconfigureFsp = output<FspConfiguration>();

  fspConfigurationService = inject(FspConfigurationService);
  fspConfigurationApiService = inject(FspConfigurationApiService);
  projectApiService = inject(ProjectApiService);
  toastService = inject(ToastService);

  projectAttributes = injectQuery(
    this.projectApiService.getProjectAttributes({
      projectId: this.projectId,
      includeProgramRegistrationAttributes: true,
    }),
  );

  readonly deleteConfirmationDialog = viewChild.required<FormDialogComponent>(
    'deleteConfigurationDialog',
  );

  readonly deleteConfigurationDialogHeader = computed(
    () => $localize`Remove` + ' ' + this.configuration().name,
  );

  readonly fspSetting = computed(
    () => FSP_SETTINGS[this.configuration().fspName],
  );

  readonly fspImage = computed(
    () => FSP_IMAGE_URLS[this.configuration().fspName],
  );

  readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: 'Reconfigure',
      icon: 'pi pi-pencil',
      command: () => {
        this.reconfigureFsp.emit(this.configuration());
      },
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => {
        this.deleteConfirmationDialog().show();
      },
    },
  ]);

  readonly requiredAttributes = computed(() => {
    const requiredFspAttributes =
      this.fspConfigurationService.getRequiredFspAttributes({
        fspSetting: this.fspSetting(),
        existingFspConfiguration: this.configuration(),
      });

    return requiredFspAttributes.map((propertyName) =>
      this.projectAttributes.data()?.find((attr) => attr.name === propertyName),
    );
  });

  deleteConfigurationMutation = injectMutation(() => ({
    mutationFn: () =>
      this.fspConfigurationApiService.deleteFspConfiguration({
        projectId: this.projectId,
        configurationName: this.configuration().name,
      }),
    onSuccess: () => {
      void this.projectApiService.invalidateCache(this.projectId);
      void this.fspConfigurationApiService.invalidateCache(this.projectId);

      this.toastService.showToast({
        detail: `FSP deleted.`,
      });
    },
  }));

  copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
    this.toastService.showToast({
      detail: $localize`"${text}" copied to clipboard`,
    });
  }
}

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
import { TableModule } from 'primeng/table';

import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { EllipsisMenuComponent } from '~/components/ellipsis-menu/ellipsis-menu.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { FSP_IMAGE_URLS } from '~/domains/fsp-configuration/fsp-configuration.helper';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { FspConfigurationService } from '~/services/fsp-configuration.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-fsp-configuration-card',
  imports: [
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
  readonly programId = input.required<string>();
  readonly configuration = input.required<FspConfiguration>();
  readonly reconfigureFsp = output<FspConfiguration>();

  fspConfigurationService = inject(FspConfigurationService);
  fspConfigurationApiService = inject(FspConfigurationApiService);
  programApiService = inject(ProgramApiService);
  translatableStringService = inject(TranslatableStringService);
  toastService = inject(ToastService);

  programAttributes = injectQuery(
    this.programApiService.getProgramAttributes({
      programId: this.programId,
      includeProgramRegistrationAttributes: true,
    }),
  );

  readonly deleteConfirmationDialog = viewChild.required<FormDialogComponent>(
    'deleteConfigurationDialog',
  );

  readonly fspConfigurationLabel = computed(
    () =>
      this.translatableStringService.translate(this.configuration().label) ??
      '',
  );

  readonly deleteConfigurationDialogHeader = computed(
    () => $localize`Remove` + ` "${this.fspConfigurationLabel()}"`,
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

  readonly requiredRegistrationAttributes = computed(() => {
    const requiredFspAttributes =
      this.fspConfigurationService.getRequiredFspAttributes({
        fspSetting: this.fspSetting(),
        existingFspConfiguration: this.configuration(),
      });

    return requiredFspAttributes.map((propertyName) =>
      this.programAttributes.data()?.find((attr) => attr.name === propertyName),
    );
  });

  deleteConfigurationMutation = injectMutation(() => ({
    mutationFn: () =>
      this.fspConfigurationApiService.deleteFspConfiguration({
        programId: this.programId,
        configurationName: this.configuration().name,
      }),
    onSuccess: () => {
      void this.programApiService.invalidateCache(this.programId);
      void this.fspConfigurationApiService.invalidateCache(this.programId);

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

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
import { MenuModule } from 'primeng/menu';
import { TableModule } from 'primeng/table';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { getFspSettingByName } from '~/domains/fsp/fsp.helper';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-fsp-configuration-card',
  imports: [
    CardModule,
    TranslatableStringPipe,
    ButtonModule,
    MenuModule,
    FormDialogComponent,
    TableModule,
    ColoredChipComponent,
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

  readonly deleteConfigurationDialogTitle = computed(
    () => $localize`Remove` + ' ' + this.configuration().name,
  );

  deleteConfigurationMutation = injectMutation(() => ({
    mutationFn: () =>
      this.fspConfigurationApiService.deleteFspConfiguration(
        this.projectId,
        this.configuration().name,
      ),
    onSuccess: () => {
      void this.projectApiService.invalidateCache(this.projectId);
      void this.fspConfigurationApiService.invalidateCache(this.projectId);

      this.toastService.showToast({
        detail: `FSP deleted.`,
      });
    },
  }));

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

  readonly fspSetting = computed(() =>
    getFspSettingByName(this.configuration().fspName),
  );

  readonly requiredDataColumns = computed(
    () =>
      this.fspSetting()
        ?.attributes.filter((property) => property.isRequired)
        .map((property) =>
          this.projectAttributes
            .data()
            ?.find((attr) => attr.name === property.name.toString()),
        ) ?? [],
  );

  copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
    this.toastService.showToast({
      detail: $localize`"${text}" copied to clipboard`,
    });
  }
}

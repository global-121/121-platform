import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MenuModule } from 'primeng/menu';
import { TableModule } from 'primeng/table';

import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { getFinancialServiceProviderSettingByName } from '~/domains/financial-service-provider/financial-service-provider.helper';
import { FinancialServiceProviderConfigurationApiService } from '~/domains/financial-service-provider-configuration/financial-service-provider-configuration.api.service';
import { FinancialServiceProviderConfiguration } from '~/domains/financial-service-provider-configuration/financial-service-provider-configuration.model';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-financial-service-provider-configuration',
  imports: [
    CardModule,
    TranslatableStringPipe,
    ButtonModule,
    MenuModule,
    ConfirmationDialogComponent,
    TableModule,
  ],
  templateUrl: './financial-service-provider-configuration.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class FinancialServiceProviderConfigurationComponent {
  readonly projectId = input.required<string>();
  readonly configuration =
    input.required<FinancialServiceProviderConfiguration>();

  financialServiceProviderConfigurationApiService = inject(
    FinancialServiceProviderConfigurationApiService,
  );
  projectApiService = inject(ProjectApiService);
  toastService = inject(ToastService);

  readonly deleteConfirmationDialog =
    viewChild.required<ConfirmationDialogComponent>(
      'deleteConfigurationDialog',
    );

  readonly deleteConfigurationDialogTitle = computed(
    () => $localize`Remove` + ' ' + this.configuration().name,
  );

  deleteConfigurationMutation = injectMutation(() => ({
    mutationFn: () =>
      this.financialServiceProviderConfigurationApiService.deleteFinancialServiceProviderConfiguration(
        this.projectId,
        this.configuration().name,
      ),
    onSuccess: () => {
      void this.projectApiService.invalidateCache(this.projectId);
      void this.financialServiceProviderConfigurationApiService.invalidateCache(
        this.projectId,
      );

      this.toastService.showToast({
        detail: `FSP deleted.`,
      });
    },
  }));

  readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => {
        this.toastService.showToast({
          severity: 'info',
          summary: 'Edit',
          detail: `One day you will be able to edit ${this.configuration().name}`,
        });
      },
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => {
        this.deleteConfirmationDialog().askForConfirmation();
      },
    },
  ]);

  readonly fspSetting = computed(() =>
    getFinancialServiceProviderSettingByName(
      this.configuration().financialServiceProviderName,
    ),
  );

  readonly requiredDataColumns = computed(
    () =>
      this.fspSetting()?.attributes.filter((property) => property.isRequired) ??
      [],
  );
}

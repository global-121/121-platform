import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { ExternalLinkComponent } from '~/components/external-link/external-link.component';
import {
  buildKoboFormUrl,
  isKoboIntegrated,
} from '~/domains/kobo/kobo.helpers';
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { KoboConfigurationDialogComponent } from '~/pages/program-settings-registration-data/components/kobo-configuration-dialog/kobo-configuration-dialog.component';
import { KoboImportExistingRegistrationsDialogComponent } from '~/pages/program-settings-registration-data/components/kobo-import-existing-registrations-dialog/kobo-import-existing-registration-dialog.component';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-kobo-integration-card',
  imports: [
    CardWithLinkComponent,
    DatePipe,
    KoboConfigurationDialogComponent,
    KoboImportExistingRegistrationsDialogComponent,
    ExternalLinkComponent,
  ],
  templateUrl: './kobo-integration-card.component.html',
  styles: ``,
  providers: [ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboIntegrationCardComponent {
  readonly programId = input.required<number | string>();

  private readonly koboApiService = inject(KoboApiService);
  private readonly toastService = inject(ToastService);

  readonly koboConfigurationDialog =
    viewChild.required<KoboConfigurationDialogComponent>(
      'koboConfigurationDialog',
    );
  readonly koboImportExistingDialog =
    viewChild.required<KoboImportExistingRegistrationsDialogComponent>(
      'koboImportExistingDialog',
    );

  readonly koboIntegration = injectQuery(() => ({
    ...this.koboApiService.getKoboIntegration(this.programId)(),
    enabled: !!this.programId(),
  }));

  readonly isKoboIntegrated = computed<boolean>(() =>
    isKoboIntegrated(this.koboIntegration),
  );

  readonly titleColoredChipLabel = computed(() =>
    this.isKoboIntegrated() ? $localize`Linked` : undefined,
  );

  readonly externalFormUrl = computed<null | string>(() => {
    const koboIntegrationData = this.koboIntegration.data();
    if (!koboIntegrationData) {
      return null;
    }

    return buildKoboFormUrl({
      serverUrl: koboIntegrationData.url,
      assetUid: koboIntegrationData.assetUid,
    });
  });

  readonly refreshKoboFormMutation = injectMutation(() => ({
    mutationFn: () => this.koboApiService.refreshKoboForm(this.programId),
    onSuccess: (result) => {
      if (result.updated) {
        this.toastService.showToast({
          detail: $localize`Integration updated successfully.`,
        });
        return;
      }
      this.toastService.showToast({
        severity: 'info',
        summary: $localize`:@@generic-info:Info`,
        detail: $localize`Integration is already up to date.`,
      });
    },
    onError: () => {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Integration update unsuccessful. Please try again.`,
      });
    },
  }));

  readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`Reconfigure`,
      command: () => {
        this.koboConfigurationDialog().show();
      },
    },
    {
      label: $localize`Refresh link`,
      command: () => {
        this.refreshKoboFormMutation.mutate();
      },
    },
    {
      label: $localize`Import existing reg.`,
      command: () => {
        this.koboImportExistingDialog().show();
      },
    },
  ]);
}

import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { EllipsisMenuComponent } from '~/components/ellipsis-menu/ellipsis-menu.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { isKoboIntegrated } from '~/domains/kobo/kobo.helpers';
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

const KOBO_URL_FORMS_PREFIX = 'forms';

@Component({
  selector: 'app-integrate-kobo-button',
  imports: [
    FormDialogComponent,
    FormFieldWrapperComponent,
    InputTextModule,
    ReactiveFormsModule,
    CardWithLinkComponent,
    ManualLinkComponent,
    EllipsisMenuComponent,
    DatePipe,
  ],
  providers: [ToastService],
  templateUrl: './integrate-kobo-button.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntegrateKoboButtonComponent {
  readonly programId = input.required<number | string>();

  readonly koboApiService = inject(KoboApiService);
  readonly toastService = inject(ToastService);

  readonly koboFormName = model<null | string>();

  readonly koboConfigurationDialog = viewChild.required<FormDialogComponent>(
    'koboConfigurationDialog',
  );
  readonly linkKoboDialog =
    viewChild.required<FormDialogComponent>('linkKoboDialog');

  readonly koboConfigurationFormGroup = new FormGroup({
    fullKoboFormUrl: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        Validators.required,
        Validators.minLength(25),
      ],
    }),
    serverUrl: new FormControl<string>('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    assetId: new FormControl<string>('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    token: new FormControl<string>('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
  });

  koboConfigurationFormFieldErrors = generateFieldErrors(
    this.koboConfigurationFormGroup,
    {
      fullKoboFormUrl: (control) =>
        control.valid
          ? undefined
          : $localize`We couldn't process this URL. Please verify in KoboToolbox.`,
    },
  );

  readonly koboConfigurationMutation = injectMutation(() => ({
    mutationFn: () => {
      const formRawValue = this.koboConfigurationFormGroup.getRawValue();

      return this.koboApiService.createKoboIntegration({
        programId: this.programId,
        integration: {
          url: formRawValue.serverUrl,
          assetUid: formRawValue.assetId,
          token: formRawValue.token,
        },
        dryRun: true,
      });
    },
    onSuccess: (koboFormResponse) => {
      this.koboFormName.set(koboFormResponse.name);
      this.koboConfigurationDialog().hide({
        resetMutation: false, // Retain form values for the `linkKoboMutation`
        resetFormGroup: false, // Retain form values for the `linkKoboMutation`
      });
      this.linkKoboDialog().show();
    },
  }));

  readonly linkKoboMutation = injectMutation(() => ({
    mutationFn: () => {
      const formRawValue = this.koboConfigurationFormGroup.getRawValue();

      return this.koboApiService.createKoboIntegration({
        programId: this.programId,
        integration: {
          url: formRawValue.serverUrl,
          assetUid: formRawValue.assetId,
          token: formRawValue.token,
        },
        dryRun: false,
      });
    },
    onSuccess: () => {
      this.koboConfigurationMutation.reset();
      this.koboConfigurationFormGroup.reset();
      this.linkKoboDialog().hide();

      this.toastService.showToast({
        detail: $localize`Kobo form successfully integrated.`,
      });
    },
    onError: () => {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Error while integrating Kobo form`,
      });
    },
  }));

  readonly importExistingSubmissionsMutation = injectMutation(() => ({
    mutationFn: () => {
      return this.koboApiService.importExistingKoboSubmissions({
        programId: this.programId,
      });
    },
    onMutate: () => {
      this.toastService.showToast({
        severity: 'info',
        detail: $localize`Importing existing registrations from Kobo...`,
      });
    },
    onSuccess: (result) => {
      this.toastService.showToast({
        detail: $localize`Successfully imported ${result.aggregateImportResult.countImported} registration(s) from Kobo.`,
      });
    },
    onError: () => {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Failed to import existing registrations from Kobo.`,
      });
    },
  }));

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

  readonly cardSubtitle = computed(() =>
    this.isKoboIntegrated() ? '' : $localize`Click to integrate`,
  );

  readonly externalFormUrl = computed<null | string>(() => {
    if (!this.isKoboIntegrated()) {
      return null;
    }
    const koboIntegrationData = this.koboIntegration.data();
    if (!koboIntegrationData) {
      return null;
    }
    // See: https://support.kobotoolbox.org/api.html#retrieving-your-project-asset-uid
    return `${koboIntegrationData.url}/#/${KOBO_URL_FORMS_PREFIX}/${koboIntegrationData.assetUid}/summary`;
  });

  readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`Reconfigure`,
      icon: 'pi pi-pencil',
      command: () => {
        this.koboConfigurationDialog().show();
      },
    },
    {
      label: $localize`Import existing registrations`,
      icon: 'pi pi-download',
      command: () => {
        this.importExistingSubmissionsMutation.mutate(undefined);
      },
    },
  ]);

  extractServerAndAssetIdFromUrl = (
    rawUrl: string,
  ): { serverUrl?: string; assetId?: string } => {
    let urlObj: URL;
    try {
      urlObj = new URL(rawUrl);
    } catch {
      return {};
    }

    // NOTE: We're NOT using only `urlObj.origin` as the Kobo server may require a path-segment. (i.e our Mock-Service!)
    const serverUrl = urlObj.origin + urlObj.pathname;

    // Extract the asset UID from the URL hash; In the format: "https://example.net/#/forms/[project asset UID]/summary"
    // See: https://support.kobotoolbox.org/api.html#retrieving-your-project-asset-uid
    const hashParts = urlObj.hash.split('/');
    const partFormPrefix = hashParts[1] ?? '';
    const partFormAssetId = hashParts[2] ?? '';

    const assetId = decodeURIComponent(partFormAssetId).trim();

    if (partFormPrefix === KOBO_URL_FORMS_PREFIX && assetId) {
      return { serverUrl, assetId };
    }

    return {};
  };

  onFormUrlUpdate = ($event: Event) => {
    const input = $event.target as HTMLInputElement;
    const rawUrl = input.value.trim();

    const { serverUrl, assetId } = this.extractServerAndAssetIdFromUrl(rawUrl);

    const isValidUrl = !!serverUrl && !!assetId;

    if (isValidUrl) {
      this.koboConfigurationFormGroup.get('serverUrl')?.setValue(serverUrl);
      this.koboConfigurationFormGroup.get('assetId')?.setValue(assetId);
      this.koboConfigurationFormGroup.get('fullKoboFormUrl')?.setErrors(null);
    } else {
      this.koboConfigurationFormGroup.get('serverUrl')?.reset();
      this.koboConfigurationFormGroup.get('assetId')?.reset();
      this.koboConfigurationFormGroup
        .get('fullKoboFormUrl')
        ?.setErrors({ invalid: true });
    }
  };
}

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
import { PasswordModule } from 'primeng/password';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { EllipsisMenuComponent } from '~/components/ellipsis-menu/ellipsis-menu.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

type KoboConfigurationFormGroup =
  (typeof IntegrateKoboButtonComponent)['prototype']['koboConfigurationFormGroup'];

@Component({
  selector: 'app-integrate-kobo-button',
  imports: [
    FormDialogComponent,
    FormFieldWrapperComponent,
    InputTextModule,
    PasswordModule,
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
    // dryRun: new FormControl<boolean>(true, { nonNullable: true }),
    url: new FormControl<string>('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    assetUid: new FormControl<string>('', {
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
  );

  readonly koboConfigurationMutation = injectMutation(() => ({
    mutationFn: ({
      url,
      assetUid,
      token,
    }: ReturnType<KoboConfigurationFormGroup['getRawValue']>) =>
      this.koboApiService.createKoboIntegration({
        programId: this.programId,
        integration: {
          url,
          assetUid,
          token,
        },
        dryRun: true,
      }),
    onSuccess: (koboFormResponse) => {
      this.koboFormName.set(koboFormResponse.name);
      this.koboConfigurationDialog().hide({
        resetMutation: false,
        resetFormGroup: false,
      });
      this.linkKoboDialog().show();
    },
  }));

  readonly linkKoboMutation = injectMutation(() => ({
    mutationFn: () =>
      this.koboApiService.createKoboIntegration({
        programId: this.programId,
        integration: {
          ...this.koboConfigurationFormGroup.getRawValue(),
        },
        dryRun: false,
      }),
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

  koboIntegration = injectQuery(() => ({
    ...this.koboApiService.getKoboIntegration(this.programId)(),
    enabled: !!this.programId(),
  }));

  readonly isKoboIntegrated = computed<boolean>(() => {
    if (!this.koboIntegration.isSuccess()) {
      return false;
    }
    const data = this.koboIntegration.data();
    return data.versionId ? true : false;
  });

  readonly titleColoredChipLabel = computed(() =>
    this.isKoboIntegrated() ? $localize`Linked` : undefined,
  );

  readonly cardSubtitle = computed(() =>
    this.isKoboIntegrated() ? '' : $localize`Click to integrate`,
  );

  readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`Reconfigure`,
      icon: 'pi pi-pencil',
      command: () => {
        this.koboConfigurationDialog().show();
      },
    },
  ]);
}

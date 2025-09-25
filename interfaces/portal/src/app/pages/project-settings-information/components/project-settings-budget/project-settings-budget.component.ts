import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
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
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type ProjectSettingsBudgetFormGroup =
  (typeof ProjectSettingsBudgetComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-project-settings-budget',
  imports: [
    CardEditableComponent,
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    InputTextModule,
    DataListComponent,
    SelectModule,
  ],
  templateUrl: './project-settings-budget.component.html',
  providers: [ToastService],
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsBudgetComponent {
  readonly projectId = input.required<string>();

  readonly isEditing = signal(false);

  authService = inject(AuthService);
  projectApiService = inject(ProjectApiService);
  toastService = inject(ToastService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));

  readonly canEdit = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.ProgramUPDATE,
    }),
  );

  readonly currencies = Object.values(CurrencyCode)
    .map((code) => ({
      label: code,
      value: code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  formGroup = new FormGroup({
    budget: new FormControl<number | undefined>(undefined, {
      nonNullable: true,
      validators: [Validators.min(0)],
    }),
    currency: new FormControl<CurrencyCode | undefined>(undefined, {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    distributionFrequency: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: [],
    }),
    distributionDuration: new FormControl<number | undefined>(undefined, {
      nonNullable: true,
      validators: [Validators.min(0)],
    }),
    fixedTransferValue: new FormControl(0, {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.min(0)],
    }),
  });

  formFieldErrors = generateFieldErrors<ProjectSettingsBudgetFormGroup>(
    this.formGroup,
    {
      budget: (control) => {
        if (control.errors?.min) {
          return $localize`This needs to be at least 0.`;
        }
        return;
      },
      currency: genericFieldIsRequiredValidationMessage,
      distributionFrequency: genericFieldIsRequiredValidationMessage,
      distributionDuration: (control) => {
        if (control.errors?.min) {
          return $localize`This needs to be at least 0.`;
        }
        return;
      },
      fixedTransferValue: (control) => {
        if (control.errors?.min) {
          return $localize`This needs to be at least 0.`;
        }
        return genericFieldIsRequiredValidationMessage(control);
      },
    },
  );

  updateFormGroup = effect(() => {
    if (!this.project.isSuccess()) {
      return;
    }

    this.formGroup.setValue({
      budget: this.project.data().budget,
      currency: this.project.data().currency,
      distributionFrequency:
        this.project.data().distributionFrequency ?? undefined,
      distributionDuration: this.project.data().distributionDuration,
      fixedTransferValue: this.project.data().fixedTransferValue ?? 0,
    });
  });

  updateProjectMutation = injectMutation(() => ({
    mutationFn: async ({
      budget,
      currency,
      distributionFrequency,
      distributionDuration,
      fixedTransferValue,
    }: ReturnType<ProjectSettingsBudgetFormGroup['getRawValue']>) =>
      this.projectApiService.updateProject({
        projectId: this.projectId,
        projectPatch: {
          budget,
          currency,
          distributionFrequency,
          distributionDuration,
          fixedTransferValue,
        },
      }),
    onSuccess: async () => {
      this.toastService.showToast({
        detail: $localize`Budget details saved successfully.`,
      });

      await this.projectApiService.invalidateCache();
    },
  }));

  readonly tooltipCurrency = $localize`Should be an ISO 4217 currency code (full list available on Wikipedia).`;
  readonly tooltipDistributionDuration = $localize`The number of times each registration will receive transfers in the project as a default.`;

  readonly dataListData = computed(() => {
    const projectData = this.project.data();

    const listData: DataListItem[] = [
      {
        label: $localize`Funds available`,
        value: projectData?.budget,
        type: 'number',
      },
      {
        label: '*' + $localize`Currency`,
        value: projectData?.currency,
        tooltip: this.tooltipCurrency,
        type: 'text',
      },
      {
        label: $localize`Payment frequency`,
        value: projectData?.distributionFrequency,
        type: 'text',
        fullWidth: true,
      },
      {
        label: $localize`Default transfers per registration`,
        value: projectData?.distributionDuration,
        type: 'number',
        fullWidth: true,
        tooltip: this.tooltipDistributionDuration,
      },
      {
        label: '*' + $localize`Fixed transfer value`,
        value: projectData?.fixedTransferValue,
        type: 'number',
        fullWidth: true,
      },
    ];

    return [...listData].map((item) => ({
      ...item,
      loading: this.project.isPending(),
    }));
  });
}

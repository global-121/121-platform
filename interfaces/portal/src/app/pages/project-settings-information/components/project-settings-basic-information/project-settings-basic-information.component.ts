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
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type ProjectSettingsBasicInformationFormGroup =
  (typeof ProjectSettingsBasicInformationComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-project-settings-basic-information',
  imports: [
    CardEditableComponent,
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    DataListComponent,
    DatePickerModule,
    ToggleSwitchModule,
    InfoTooltipComponent,
  ],
  templateUrl: './project-settings-basic-information.component.html',
  providers: [ToastService],
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsBasicInformationComponent {
  readonly projectId = input.required<string>();

  readonly isEditing = signal(false);

  projectApiService = inject(ProjectApiService);
  toastService = inject(ToastService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));

  formGroup = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
    startDate: new FormControl<Date | undefined>(undefined, {
      nonNullable: true,
    }),
    endDate: new FormControl<Date | undefined>(undefined, {
      nonNullable: true,
    }),
    location: new FormControl('', {
      nonNullable: true,
    }),
    targetNrRegistrations: new FormControl<number | undefined>(undefined, {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    validation: new FormControl(false, { nonNullable: true }),
    enableScope: new FormControl(false, { nonNullable: true }),
  });

  formFieldErrors =
    generateFieldErrors<ProjectSettingsBasicInformationFormGroup>(
      this.formGroup,
      {
        name: genericFieldIsRequiredValidationMessage,
        description: genericFieldIsRequiredValidationMessage,
        startDate: genericFieldIsRequiredValidationMessage,
        endDate: genericFieldIsRequiredValidationMessage,
        location: genericFieldIsRequiredValidationMessage,
        targetNrRegistrations: genericFieldIsRequiredValidationMessage,
        validation: genericFieldIsRequiredValidationMessage,
        enableScope: genericFieldIsRequiredValidationMessage,
      },
    );

  updateFormGroup = effect(() => {
    if (!this.project.isSuccess()) {
      return;
    }

    const { startDate, endDate } = this.project.data();

    this.formGroup.setValue({
      name: this.project.data().titlePortal?.en ?? '',
      description: this.project.data().description?.en ?? '',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      location: this.project.data().location ?? '',
      targetNrRegistrations: this.project.data().targetNrRegistrations,
      validation: this.project.data().validation,
      enableScope: this.project.data().enableScope,
    });
  });

  updateProjectMutation = injectMutation(() => ({
    mutationFn: async ({
      name,
      description,
      startDate,
      endDate,
      location,
      targetNrRegistrations,
      validation,
      enableScope,
    }: ReturnType<ProjectSettingsBasicInformationFormGroup['getRawValue']>) =>
      this.projectApiService.updateProject({
        projectId: this.projectId,
        projectPatch: {
          titlePortal: {
            en: name,
          },
          description: {
            en: description,
          },
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          location,
          targetNrRegistrations,
          validation,
          enableScope,
        },
      }),
    onSuccess: async () => {
      this.toastService.showToast({
        detail: $localize`Basic information details saved successfully.`,
      });

      await this.projectApiService.invalidateCache();
    },
  }));

  readonly tooltipTargetRegistrations = $localize`The amount of people/ households your project wishes to reach.`;
  readonly tooltipVerificationProcess = $localize`Turning on the verification option enables an additional registration status: "verified".`;
  readonly tooltipEnableScope = $localize`Scope allows you to control which team members have access to specific registrations, based on the scope they are assigned to in the project team's page.

To use this feature, make sure scope is defined in your integrated Kobo form or Excel table.`;

  readonly projectBasicInformationData = computed(() => {
    const projectData = this.project.data();

    const listData: DataListItem[] = [
      {
        label: '*' + $localize`Project name`,
        value: projectData?.titlePortal?.en ?? '',
        fullWidth: true,
      },
      {
        label: $localize`Project description`,
        value: projectData?.description?.en ?? '',
        fullWidth: true,
      },
      // XXX: share with Tal that we split this into 2 fields
      {
        label: $localize`Start date`,
        value: projectData?.startDate,
        type: 'date',
      },
      {
        label: $localize`End date`,
        value: projectData?.endDate,
        type: 'date',
      },
      {
        label: $localize`Location`,
        value: projectData?.location,
        fullWidth: true,
      },
      {
        label: '*' + $localize`Target registrations`,
        value: projectData?.targetNrRegistrations,
        fullWidth: true,
        type: 'number',
        tooltip: this.tooltipTargetRegistrations,
      },
      {
        // XXX: is this called differently elsewhere?
        label: $localize`Verification process`,
        value: projectData?.validation ?? false,
        fullWidth: true,
        type: 'boolean',
        tooltip: this.tooltipVerificationProcess,
      },
      {
        label: $localize`Enable scope`,
        value: projectData?.enableScope ?? false,
        fullWidth: true,
        type: 'boolean',
        tooltip: this.tooltipEnableScope,
      },
    ];

    return [...listData].map((item) => ({
      ...item,
      loading: this.project.isPending(),
    }));
  });
}

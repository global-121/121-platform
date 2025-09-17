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
import { TextareaModule } from 'primeng/textarea';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
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
  });

  formFieldErrors =
    generateFieldErrors<ProjectSettingsBasicInformationFormGroup>(
      this.formGroup,
      {
        name: genericFieldIsRequiredValidationMessage,
        description: genericFieldIsRequiredValidationMessage,
      },
    );

  updateFormGroup = effect(() => {
    if (!this.project.isSuccess()) {
      return;
    }

    this.formGroup.setValue({
      name: this.project.data().titlePortal?.en ?? '',
      description: this.project.data().description?.en ?? '',
    });
  });

  updateProjectMutation = injectMutation(() => ({
    mutationFn: async ({
      name,
      description,
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
        },
      }),
    onSuccess: async () => {
      this.toastService.showToast({
        detail: $localize`Basic information details saved successfully.`,
      });

      await this.projectApiService.invalidateCache();
    },
  }));

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
        label: $localize`Project start date`,
        value: projectData?.startDate,
        type: 'date',
      },
      {
        label: $localize`Project end date`,
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
        tooltip: $localize`The amount of people/ households your project wishes to reach.`,
      },
      {
        // XXX: is this called differently elsewhere?
        label: $localize`Verification process`,
        value: projectData?.validation ?? false,
        fullWidth: true,
        type: 'boolean',
        tooltip: $localize`Turning on the verification option enables an additional registration status: "verified".`,
      },
      {
        label: $localize`Enable scope`,
        value: projectData?.enableScope ?? false,
        fullWidth: true,
        type: 'boolean',
        tooltip: $localize`Scope allows you to control which team members have access to specific registrations, based on the scope they are assigned to in the project team's page.

To use this feature, make sure scope is defined in your integrated Kobo form or Excel table.`,
      },
    ];

    return [...listData].map((item) => ({
      ...item,
      loading: this.project.isPending(),
    }));
  });
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import {
  ProjectBudgetFormGroup,
  ProjectFormBudgetComponent,
} from '~/components/project-form-budget/project-form-budget.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { PROJECT_FORM_TOOLTIPS } from '~/domains/project/project.helper';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-settings-budget',
  imports: [
    CardEditableComponent,
    DataListComponent,
    ProjectFormBudgetComponent,
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

  readonly projectFormBudget =
    viewChild<ProjectFormBudgetComponent>('projectFormBudget');
  readonly formGroup = computed(() => this.projectFormBudget()?.formGroup);

  updateProjectMutation = injectMutation(() => ({
    mutationFn: async ({
      budget,
      currency,
      distributionFrequency,
      distributionDuration,
      fixedTransferValue,
    }: ReturnType<ProjectBudgetFormGroup['getRawValue']>) =>
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
        tooltip: PROJECT_FORM_TOOLTIPS.currency,
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
        tooltip: PROJECT_FORM_TOOLTIPS.distributionDuration,
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

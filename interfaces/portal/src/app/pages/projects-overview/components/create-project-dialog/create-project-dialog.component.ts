import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';

import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

import { AppRoutes } from '~/app.routes';
import { FullscreenStepperDialogComponent } from '~/components/fullscreen-stepper-dialog/fullscreen-stepper-dialog.component';
import {
  ProjectBudgetFormGroup,
  ProjectFormBudgetComponent,
} from '~/components/project-form-budget/project-form-budget.component';
import {
  ProjectFormInformationComponent,
  ProjectInformationFormGroup,
} from '~/components/project-form-information/project-form-information.component';
import {
  ProjectFormNameComponent,
  ProjectNameFormGroup,
} from '~/components/project-form-name/project-form-name.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-create-project-dialog',
  imports: [
    FullscreenStepperDialogComponent,
    CardModule,
    NgOptimizedImage,
    ProjectFormNameComponent,
    ProjectFormInformationComponent,
    ProjectFormBudgetComponent,
  ],
  providers: [ToastService],
  templateUrl: './create-project-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectDialogComponent {
  readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly projectApiService = inject(ProjectApiService);
  readonly toastService = inject(ToastService);

  readonly createProjectDialog =
    viewChild.required<FullscreenStepperDialogComponent>('createProjectDialog');

  readonly formName = viewChild<ProjectFormNameComponent>('formName');
  readonly formInformation =
    viewChild<ProjectFormInformationComponent>('formInformation');
  readonly formBudget = viewChild<ProjectFormBudgetComponent>('formBudget');

  // 0 = dialog closed
  // 1 = step 1: name
  // 2 = step 2: information
  // 3 = step 3: budget
  readonly currentStep = signal<0 | 1 | 2 | 3>(0);

  readonly formGroup = computed(() => {
    const nameGroup = this.formName()?.formGroup;
    const informationGroup = this.formInformation()?.formGroup;
    const budgetGroup = this.formBudget()?.formGroup;

    if (!nameGroup || !informationGroup || !budgetGroup) {
      return undefined;
    }

    return new FormGroup({
      nameGroup,
      informationGroup,
      budgetGroup,
    });
  });

  readonly proceedLabel = computed(() =>
    this.currentStep() !== 3
      ? $localize`Continue`
      : $localize`:@@create-project:Create project`,
  );

  createProjectMutation = injectMutation(() => ({
    mutationFn: async ({
      nameGroup: { name, description },
      informationGroup: {
        startDate,
        endDate,
        enableScope,
        location,
        targetNrRegistrations,
        validation,
      },
      budgetGroup: {
        budget,
        currency,
        distributionDuration,
        fixedTransferValue,
      },
    }: ReturnType<
      FormGroup<{
        nameGroup: ProjectNameFormGroup;
        informationGroup: ProjectInformationFormGroup;
        budgetGroup: ProjectBudgetFormGroup;
      }>['getRawValue']
    >) =>
      this.projectApiService.createProject({
        titlePortal: {
          [LanguageEnum.en]: name,
        },
        description: {
          [LanguageEnum.en]: description,
        },
        budget,
        currency,
        distributionDuration,
        fixedTransferValue,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        enableScope,
        location,
        targetNrRegistrations,
        validation,
      }),
    onSuccess: async (result) => {
      await Promise.all([
        this.projectApiService.invalidateCache(),
        // The keys of the user permissions determine which projects a user can see
        this.authService.refreshUserPermissions(),
      ]);

      await this.router.navigate([
        '/',
        AppRoutes.project,
        result?.id,
        AppRoutes.projectSettings,
      ]);

      this.toastService.showToast({
        detail: $localize`Project successfully created.`,
      });
    },
    onError: (error) => {
      this.toastService.showToast({
        severity: 'error',
        detail: error.message,
      });
    },
  }));

  goBack() {
    const currentStep = this.currentStep();

    if (currentStep === 0) {
      return;
    }

    this.currentStep.set((currentStep - 1) as 0 | 1 | 2);
  }

  private getFormGroupIfStepIsValid(step: 1 | 2 | 3) {
    const formGroup = this.formGroup();
    if (!formGroup) {
      // Should never happen, but makes TS happy
      return;
    }

    let formGroupToValidate: FormGroup;

    switch (step) {
      case 1:
        formGroupToValidate = formGroup.controls.nameGroup;
        break;
      case 2:
        formGroupToValidate = formGroup.controls.informationGroup;
        break;
      case 3:
        formGroupToValidate = formGroup.controls.budgetGroup;
        break;
    }

    formGroupToValidate.markAllAsTouched();
    if (!formGroupToValidate.valid) {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Please correct the errors in the form.`,
      });
      return;
    }

    return formGroup;
  }

  goToNextStep() {
    const currentStep = this.currentStep();

    if (currentStep === 0) {
      // simply open the dialog
      this.currentStep.set(1);
      return;
    }

    const formGroup = this.getFormGroupIfStepIsValid(currentStep);
    if (!formGroup) {
      // means that the form is not valid, so do not proceed
      return;
    }

    if (currentStep === 3) {
      // we're on the last step, so submit
      this.createProjectMutation.mutate(formGroup.getRawValue());
      return;
    }

    this.currentStep.set((currentStep + 1) as 2 | 3);
  }

  show() {
    this.formGroup()?.reset();
    this.goToNextStep();
  }
}

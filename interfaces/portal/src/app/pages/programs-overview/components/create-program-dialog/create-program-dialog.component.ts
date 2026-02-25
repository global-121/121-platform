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

import { UILanguage } from '@121-platform/shared';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';

import { AppRoutes } from '~/app.routes';
import { FullscreenStepperDialogComponent } from '~/components/fullscreen-stepper-dialog/fullscreen-stepper-dialog.component';
import {
  ProgramBudgetFormGroup,
  ProgramFormBudgetComponent,
} from '~/components/program-form-budget/program-form-budget.component';
import {
  ProgramFormInformationComponent,
  ProgramInformationFormGroup,
} from '~/components/program-form-information/program-form-information.component';
import {
  ProgramFormNameComponent,
  ProgramNameFormGroup,
} from '~/components/program-form-name/program-form-name.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-create-program-dialog',
  imports: [
    FullscreenStepperDialogComponent,
    CardModule,
    NgOptimizedImage,
    ProgramFormNameComponent,
    ProgramFormInformationComponent,
    ProgramFormBudgetComponent,
  ],
  providers: [ToastService],
  templateUrl: './create-program-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProgramDialogComponent {
  readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly programApiService = inject(ProgramApiService);
  readonly toastService = inject(ToastService);

  readonly createProgramDialog =
    viewChild.required<FullscreenStepperDialogComponent>('createProgramDialog');

  readonly formName = viewChild<ProgramFormNameComponent>('formName');
  readonly formInformation =
    viewChild<ProgramFormInformationComponent>('formInformation');
  readonly formBudget = viewChild<ProgramFormBudgetComponent>('formBudget');

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
      : $localize`:@@create-program:Create program`,
  );

  createProgramMutation = injectMutation(() => ({
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
        nameGroup: ProgramNameFormGroup;
        informationGroup: ProgramInformationFormGroup;
        budgetGroup: ProgramBudgetFormGroup;
      }>['getRawValue']
    >) =>
      this.programApiService.createProgram({
        titlePortal: {
          [UILanguage.en]: name,
        },
        description: {
          [UILanguage.en]: description,
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
      // The keys of the user permissions determine which programs a user can see
      await this.authService.refreshUserPermissions();

      await this.router.navigate([
        '/',
        AppRoutes.program,
        result?.id,
        AppRoutes.programSettings,
      ]);

      this.toastService.showToast({
        detail: $localize`Program successfully created.`,
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
      this.createProgramMutation.mutate(formGroup.getRawValue());
      return;
    }

    this.currentStep.set((currentStep + 1) as 2 | 3);
  }

  show() {
    this.formGroup()?.reset();
    this.goToNextStep();
  }
}

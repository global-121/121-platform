import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';

import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FullscreenStepperDialogComponent } from '~/components/fullscreen-stepper-dialog/fullscreen-stepper-dialog.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { ProgramNavigationService } from '~/domains/program/program-navigation.service';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

@Component({
  selector: 'app-duplicate-program-dialog',
  imports: [
    FullscreenStepperDialogComponent,
    CardModule,
    NgOptimizedImage,
    ReactiveFormsModule,
    InputTextModule,
    FormFieldWrapperComponent,
    ManualLinkComponent,
  ],
  providers: [ToastService],
  templateUrl: './duplicate-program-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateProgramDialogComponent {
  readonly programApiService = inject(ProgramApiService);
  readonly programNavigationService = inject(ProgramNavigationService);
  readonly toastService = inject(ToastService);

  // 0 = dialog closed, 1 = program name step
  readonly currentStep = signal<0 | 1>(0);

  readonly copyFromProgramId = signal<number | undefined>(undefined);
  readonly sourceProgramName = signal('');

  readonly createProgramLabel = $localize`:@@create-program:Create program`;

  formGroup = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.maxLength(60)],
    }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup);

  duplicateProgramMutation = injectMutation(() => ({
    mutationFn: ({ name }: { name: string }) => {
      const copyFromProgramId = this.copyFromProgramId();
      if (copyFromProgramId === undefined) {
        throw new Error('No program selected to duplicate');
      }
      return this.programApiService.duplicateProgram({
        copyFromProgramId,
        titlePortal: { [UILanguage.en]: name },
      });
    },
    onSuccess: async (result) => {
      this.currentStep.set(0);

      await this.programNavigationService.navigateToNewProgram({
        programId: result?.id,
      });

      this.toastService.showToast({
        detail: $localize`Program successfully duplicated.`,
      });
    },
    onError: (error) => {
      this.toastService.showToast({
        severity: 'error',
        detail: error.message,
      });
    },
  }));

  show({ programId, programName }: { programId: number; programName: string }) {
    this.copyFromProgramId.set(programId);
    this.sourceProgramName.set(programName);
    this.formGroup.reset();
    this.currentStep.set(1);
  }

  proceed() {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Please correct the errors in the form.`,
      });
      return;
    }

    this.duplicateProgramMutation.mutate(this.formGroup.getRawValue());
  }
}

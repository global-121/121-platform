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
import { Router } from '@angular/router';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';

import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';

import { AppRoutes } from '~/app.routes';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FullscreenStepperDialogComponent } from '~/components/fullscreen-stepper-dialog/fullscreen-stepper-dialog.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { AuthService } from '~/services/auth.service';
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
  readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly programApiService = inject(ProgramApiService);
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
      // The keys of the user permissions determine which programs a user can see
      await this.authService.refreshUserPermissions();

      this.currentStep.set(0);

      await this.router.navigate([
        '/',
        AppRoutes.program,
        result?.id,
        AppRoutes.programSettings,
      ]);

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

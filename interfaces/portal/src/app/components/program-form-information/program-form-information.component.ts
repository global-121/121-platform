import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

// import { Router } from '@angular/router';.
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { PROGRAM_FORM_TOOLTIPS } from '~/domains/program/program.helper';
import { Program } from '~/domains/program/program.model';
import {
  TrackingAction,
  TrackingCategory,
  TrackingEvent,
} from '~/services/tracking.service';
import { generateFieldErrors } from '~/utils/form-validation';

export type ProgramInformationFormGroup =
  (typeof ProgramFormInformationComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-program-form-information',
  imports: [
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    InputTextModule,
    DatePickerModule,
    ToggleSwitchModule,
    InfoTooltipComponent,
  ],
  templateUrl: './program-form-information.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramFormInformationComponent {
  readonly program = input<Program>();
  // readonly router = inject(Router);
  readonly trackEvent = output<TrackingEvent>();

  formGroup = new FormGroup({
    startDate: new FormControl<Date | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
      },
    ),
    endDate: new FormControl<Date | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
      },
    ),
    location: new FormControl<string | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
      },
    ),
    targetNrRegistrations: new FormControl(0, {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.min(1)],
    }),
    validation: new FormControl(false, { nonNullable: true }),
    enableScope: new FormControl(false, { nonNullable: true }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup);

  updateFormGroup = effect(() => {
    const programData = this.program();

    if (!programData) {
      return;
    }

    const { startDate, endDate } = programData;

    this.formGroup.patchValue({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      location: programData.location,
      targetNrRegistrations: programData.targetNrRegistrations ?? 0,
      validation: programData.validation,
      enableScope: programData.enableScope,
    });
  });

  readonly PROGRAM_FORM_TOOLTIPS = PROGRAM_FORM_TOOLTIPS;

  readonly isCreateProgram = window.location.href.includes('create-program');

  trackUseValidationToggleEvent(event: { checked: boolean }): void {
    this.trackEvent.emit({
      category: this.isCreateProgram
        ? TrackingCategory.createNewProgram
        : TrackingCategory.programSettings,
      action: TrackingAction.toggleProgramValidation,
      name: event.checked ? 'enabled' : 'disabled',
    });
  }

  trackUseScopeToggleEvent(event: { checked: boolean }): void {
    this.trackEvent.emit({
      category: this.isCreateProgram
        ? TrackingCategory.createNewProgram
        : TrackingCategory.programSettings,
      action: TrackingAction.toggleProgramScope,
      name: event.checked ? 'enabled' : 'disabled',
    });
  }
}

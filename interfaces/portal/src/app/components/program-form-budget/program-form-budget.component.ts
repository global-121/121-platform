import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  LOCALE_ID,
  output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { get } from 'radashi';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FspMultiselectComponent } from '~/components/fsp-multiselect/fsp-multiselect.component';
import { PROGRAM_FORM_TOOLTIPS_CONFIG } from '~/domains/program/program.helper';
import { Program } from '~/domains/program/program.model';
import {
  TrackingAction,
  TrackingCategory,
} from '~/services/tracking/tracking.enums';
import { TrackingEvent } from '~/services/tracking/tracking-event.interface';
import { generateFieldErrors, trackFieldErrors } from '~/utils/form-validation';
import { Locale } from '~/utils/locale';

export type ProgramBudgetFormGroup =
  (typeof ProgramFormBudgetComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-program-form-budget',
  imports: [
    FspMultiselectComponent,
    FormFieldWrapperComponent,
    InputGroupModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    InputGroupAddonModule,
    InputNumberModule,
  ],
  templateUrl: './program-form-budget.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramFormBudgetComponent {
  protected readonly locale = inject<Locale>(LOCALE_ID);
  readonly program = input<Program>();
  readonly programId = input<string>();
  readonly trackEvent = output<TrackingEvent>();

  readonly currencies = Object.values(CurrencyCode)
    .map((code) => ({
      label: code,
      value: code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, this.locale));

  formGroup = new FormGroup({
    budget: new FormControl<number | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
        validators: [Validators.min(0)],
      },
    ),
    currency: new FormControl(CurrencyCode.EUR, {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    distributionDuration: new FormControl<number | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
        validators: [Validators.min(0)],
      },
    ),
    fixedTransferValue: new FormControl(0, {
      nonNullable: true,

      validators: [
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        Validators.required,
        Validators.min(0),
      ],
    }),
    fsps: new FormControl<Fsps[]>([], {
      nonNullable: true,
    }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup, {
    fixedTransferValue: (control) => {
      if (control.errors?.min) {
        const min = get(control.errors.min, 'min') ?? 0;
        return $localize`This field needs to be at least ${min}.`;
      }
      if (control.errors?.required) {
        return $localize`:@@generic-required-field:This field is required.`;
      }
      return undefined;
    },
  });

  updateFormGroup = effect(() => {
    const programData = this.program();

    if (!programData) {
      return;
    }

    this.formGroup.patchValue({
      budget: programData.budget,
      currency: programData.currency ?? CurrencyCode.EUR,
      distributionDuration: programData.distributionDuration,
      fixedTransferValue: programData.fixedTransferValue ?? 0,
    });

    if (!this.programId()) {
      this.formGroup.patchValue({
        fsps: programData.programFspConfigurations.length
          ? programData.programFspConfigurations.map(
              (fspConfig) => fspConfig.fspName,
            )
          : [],
      });
    }
  });
  readonly PROGRAM_FORM_TOOLTIPS_CONFIG = PROGRAM_FORM_TOOLTIPS_CONFIG;

  readonly isCreateProgram =
    typeof window !== 'undefined' &&
    window.location.href.includes('create-program');

  constructor() {
    trackFieldErrors({
      formGroup: this.formGroup,
      onFieldError: ({ field, error }) => {
        this.trackEvent.emit({
          category: this.isCreateProgram
            ? TrackingCategory.createNewProgram
            : TrackingCategory.programSettings,
          action: TrackingAction.formValidationError,
          name: `${field}: ${error}`,
        });
      },
    });
  }

  protected getCurrencySymbol({ code }: { code: CurrencyCode }): string {
    const currencyPart = new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'symbol',
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency');

    if (!currencyPart) {
      return code;
    }

    return currencyPart.value;
  }
}

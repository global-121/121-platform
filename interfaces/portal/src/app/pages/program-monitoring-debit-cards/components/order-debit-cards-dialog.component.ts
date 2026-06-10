import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { InputTextModule } from 'primeng/inputtext';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

@Component({
  selector: 'app-order-debit-cards-dialog',
  templateUrl: './order-debit-cards-dialog.component.html',
  styles: ``,
  imports: [
    FormDialogComponent,
    FormFieldWrapperComponent,
    InputTextModule,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
})
export class OrderDebitCardsDialogComponent {
  readonly programId = input.required<string>();
  readonly toastService = inject(ToastService);

  private programApiService = inject(ProgramApiService);

  readonly formDialog = viewChild.required<FormDialogComponent>(
    'orderDebitCardsDialog',
  );

  formGroup = new FormGroup({
    noOfCards: new FormControl<number>(
      {
        value: 0,
        disabled: false,
      },
      {
        nonNullable: true,
        validators: [
          // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
          Validators.required,
          Validators.min(1),
          Validators.max(700),
        ],
      },
    ),

    addressCity: new FormControl<string>(
      { value: '', disabled: false },
      {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
        nonNullable: true,
      },
    ),
    addressPostalCode: new FormControl<string>(
      { value: '', disabled: false },
      {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
        nonNullable: true,
      },
    ),

    addressStreet: new FormControl<string>(
      {
        value: '',
        disabled: false,
      },
      {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
        nonNullable: true,
      },
    ),
    addressHouseNumber: new FormControl<string>(
      {
        value: '',
        disabled: false,
      },
      {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
        nonNullable: true,
      },
    ),
    addressHouseNumberAddition: new FormControl<string | undefined>(
      {
        value: undefined,
        disabled: false,
      },
      {
        nonNullable: true,
      },
    ),
    addressee: new FormControl<string>(
      {
        value: '',
        disabled: false,
      },
      {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
        nonNullable: true,
      },
    ),
  });

  readonly formEvents = toSignal(this.formGroup.events);
  readonly formFieldErrors = generateFieldErrors(this.formGroup, {});

  readonly orderVisaCards = injectMutation(() => ({
    mutationFn: () => {
      const formValues = this.formGroup.getRawValue();
      return this.programApiService.orderVisaCards({
        programId: this.programId,
        visaCardOrder: {
          noOfCards: formValues.noOfCards,
          addressPostalCode: formValues.addressPostalCode,
          addressCity: formValues.addressCity,
          addressStreet: formValues.addressStreet,
          addressHouseNumber: formValues.addressHouseNumber,
          addressHouseNumberAddition: formValues.addressHouseNumberAddition,
          addressee: formValues.addressee,
        },
      });
    },
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Debit cards ordered successfully`,
      });
    },
  }));

  show() {
    this.formDialog().show({
      resetMutation: true,
    });
  }
}

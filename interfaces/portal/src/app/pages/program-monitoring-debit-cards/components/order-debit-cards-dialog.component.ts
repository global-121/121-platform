import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from 'node_modules/@tanstack/angular-query-experimental/inject-mutation';
import { InputTextModule } from 'primeng/inputtext';
import { map } from 'rxjs';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
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
  providers: [ToastService],
})
export class OrderDebitCardsDialogComponent {
  readonly formDialog = viewChild.required<FormDialogComponent>(
    'orderDebitCardsDialog',
  );

  formGroup = new FormGroup({
    cardAmountValue: new FormControl<number | undefined>(
      {
        value: 0,
        disabled: false,
      },
      {
        nonNullable: true,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required, Validators.min(1)],
      },
    ),
    postalCodeValue: new FormControl<string | undefined>(
      { value: undefined, disabled: false },
      {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
        nonNullable: true,
      },
    ),
    cityValue: new FormControl<string | undefined>(
      { value: undefined, disabled: false },
      {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
        nonNullable: true,
      },
    ),
    addressValue: new FormControl<string | undefined>(
      {
        value: undefined,
        disabled: false,
      },
      {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
        nonNullable: true,
      },
    ),
    addresseeValue: new FormControl<string | undefined>(
      {
        value: undefined,
        disabled: false,
      },
      {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
        nonNullable: true,
      },
    ),
  });

  readonly formStatus = toSignal(
    this.formGroup.statusChanges.pipe(
      map(() => ({
        invalid: this.formGroup.invalid,
        touched: this.formGroup.touched,
      })),
    ),
  );

  readonly formEvents = toSignal(this.formGroup.events);
  readonly formFieldErrors = generateFieldErrors(this.formGroup, {});

  readonly fakeMutation = injectMutation(() => ({
    mutationFn: ({
      cardAmountValue,
      postalCodeValue,
      addressValue,
      cityValue,
      addresseeValue,
    }: {
      cardAmountValue: number | undefined;
      postalCodeValue: string | undefined;
      addressValue: string | undefined;
      cityValue: string | undefined;
      addresseeValue: string | undefined;
    }) => {
      console.log(
        'doing stuff:',
        cityValue,
        postalCodeValue,
        addressValue,
        cardAmountValue,
        addresseeValue,
      );

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({});
        }, 1000);
      });
    },
    onSuccess: () => {
      console.log('debit cards ordered successfully!');
    },
  }));

  show() {
    this.formDialog().show({
      resetMutation: true,
    });
  }
}

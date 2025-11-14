import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { pick } from 'radashi';
import { Subscription } from 'rxjs';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { Registration } from '~/domains/registration/registration.model';
import { ComponentCanDeactivate } from '~/guards/pending-changes.guard';
import {
  NormalizedRegistrationAttribute,
  RegistrationAttributeService,
} from '~/services/registration-attribute.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

@Component({
  selector: 'app-edit-personal-information',
  imports: [
    ReactiveFormsModule,
    FormFieldWrapperComponent,
    DatePickerModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    FormDialogComponent,
    FormsModule,
  ],
  templateUrl: './edit-personal-information.component.html',
  styles: ``,
  providers: [ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPersonalInformationComponent
  implements OnInit, OnDestroy, ComponentCanDeactivate
{
  readonly rtlHelper = inject(RtlHelperService);
  readonly programId = input.required<string>();
  readonly registrationId = input.required<string>();
  readonly attributeList = input.required<NormalizedRegistrationAttribute[]>();
  readonly cancelEditing = output();
  readonly registrationUpdated = output<Registration>();

  readonly registrationApiService = inject(RegistrationApiService);
  readonly registrationAttributeService = inject(RegistrationAttributeService);
  readonly toastService = inject(ToastService);

  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.programId,
      this.registrationId,
    ),
  );

  readonly editPersonalInformationDialog =
    viewChild.required<FormDialogComponent>('editPersonalInformationDialog');
  readonly unsavedChangesDialog = viewChild.required<FormDialogComponent>(
    'unsavedChangesDialog',
  );

  formGroup!: FormGroup<
    Record<string, FormControl<boolean | number | string | undefined>>
  >;
  formGroupChangesSubscription: Subscription;
  readonly changedRegistrationData = signal<
    Record<string, boolean | number | string | undefined>
  >({});

  readonly formFieldErrors = computed(() =>
    generateFieldErrors(
      this.formGroup,
      this.registrationAttributeService.attributesToFormFormFieldErrors({
        attributes: this.attributeList(),
      }),
    ),
  );

  dialogFormGroup = new FormGroup({
    reason: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
  });

  dialogFormFieldErrors = generateFieldErrors(this.dialogFormGroup);

  readonly hasChanges = computed(
    () => Object.keys(this.changedRegistrationData()).length > 0,
  );

  patchRegistrationMutation = injectMutation(() => ({
    mutationFn: ({
      referenceId,
      patchedRegistration,
      reason,
    }: {
      referenceId: string;
      patchedRegistration: Record<
        string,
        boolean | null | number | string | undefined
      >;
      reason?: string;
    }) => {
      if (!reason) {
        throw new Error(
          $localize`:@@generic-required-field:This field is required.`,
        );
      }

      const data = {
        ...patchedRegistration,
      };

      for (const attributeName in data) {
        if (data[attributeName] === '') {
          data[attributeName] = null;
        }
      }

      return this.registrationApiService.patchRegistration({
        programId: this.programId,
        referenceId,
        data,
        reason,
      });
    },
    onSuccess: (patchedRegistration) => {
      this.toastService.showToast({
        detail: $localize`Personal information edited successfully.`,
      });
      this.registrationUpdated.emit(patchedRegistration);
    },
  }));

  ngOnInit() {
    this.formGroup = this.registrationAttributeService.attributesToFormGroup({
      attributes: this.attributeList(),
    });

    this.formGroupChangesSubscription = this.formGroup.valueChanges.subscribe(
      (updatedValue) => {
        this.changedRegistrationData.set(
          pick(
            updatedValue,
            (newValue, attributeName) =>
              // only include attributes that have changed
              newValue !==
              this.attributeList().find((a) => a.name === attributeName)?.value,
          ),
        );
      },
    );
  }

  ngOnDestroy() {
    this.formGroupChangesSubscription.unsubscribe();
  }

  onSubmit() {
    this.formGroup.markAllAsTouched();

    if (!this.formGroup.valid) {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Please correct the errors in the form.`,
      });
      return;
    }

    if (!this.hasChanges()) {
      this.toastService.showToast({
        severity: 'info',
        summary: $localize`Operation not possible.`,
        detail: $localize`No changes detected.`,
      });
      return;
    }

    this.editPersonalInformationDialog().show();
  }

  @HostListener('window:beforeunload', ['$event'])
  canDeactivate($event?: BeforeUnloadEvent) {
    if (this.hasChanges()) {
      $event?.preventDefault();
      return false;
    }
    return true;
  }
}

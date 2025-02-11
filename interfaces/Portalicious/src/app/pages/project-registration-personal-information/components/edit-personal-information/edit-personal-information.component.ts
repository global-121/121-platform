import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  input,
  model,
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

import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { ComponentCanDeactivate } from '~/guards/pending-changes.guard';
import {
  NormalizedRegistrationAttribute,
  RegistrationAttributeService,
} from '~/services/registration-attribute.service';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

type EditPersonalInformationFormGroup =
  (typeof EditPersonalInformationComponent)['prototype']['formGroup'];

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
    ConfirmationDialogComponent,
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
  readonly projectId = input.required<string>();
  readonly registrationId = input.required<string>();
  readonly attributeList = input.required<NormalizedRegistrationAttribute[]>();
  readonly cancelEditing = output();
  readonly registrationUpdated = output();

  readonly projectApiService = inject(ProjectApiService);
  readonly registrationApiService = inject(RegistrationApiService);
  readonly registrationAttributeService = inject(RegistrationAttributeService);
  readonly toastService = inject(ToastService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );

  readonly editPersonalInformationDialog =
    viewChild.required<ConfirmationDialogComponent>(
      'editPersonalInformationDialog',
    );
  readonly unsavedChangesDialog =
    viewChild.required<ConfirmationDialogComponent>('unsavedChangesDialog');

  formGroup!: FormGroup<
    Record<string, FormControl<boolean | number | string | undefined>>
  >;
  formGroupChangesSubscription: Subscription;
  readonly changedRegistrationData = signal<
    Record<string, boolean | number | string | undefined>
  >({});
  readonly updateReason = model<string>();

  readonly formFieldErrors = computed(() =>
    generateFieldErrors<EditPersonalInformationFormGroup>(
      this.formGroup,
      this.registrationAttributeService.attributesToFormFormFieldErrors({
        attributes: this.attributeList(),
      }),
    ),
  );
  updateDisabledFields = effect(() => {
    if (!this.project.isSuccess()) {
      return;
    }

    if (this.project.data().paymentAmountMultiplierFormula) {
      try {
        this.formGroup.controls.paymentAmountMultiplier.disable();
      } catch (e) {
        console.error(e);
      }
    }

    if (!this.project.data().allowEmptyPhoneNumber) {
      try {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        this.formGroup.controls.phoneNumber.addValidators(Validators.required);
      } catch (e) {
        console.error(e);
      }
    }
  });
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
        projectId: this.projectId,
        referenceId,
        data,
        reason,
      });
    },
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Personal information edited successfully.`,
      });
      void this.registrationApiService.invalidateCache(
        this.projectId,
        this.registrationId,
      );
      this.registrationUpdated.emit();
    },
  }));
  ngOnInit() {
    this.formGroup = this.registrationAttributeService.attributesToFormGroup({
      attributes: this.attributeList(),
      projectId: this.projectId(),
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
        detail: $localize`Please fill out all required fields.`,
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

    this.editPersonalInformationDialog().askForConfirmation();
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

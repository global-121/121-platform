import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  signal,
  ViewChild,
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
import { pickBy } from 'lodash';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';

import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import {
  NormalizedRegistrationAttribute,
  RegistrationAttributeService,
} from '~/services/registration-attribute.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-edit-personal-information',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormFieldWrapperComponent,
    CalendarModule,
    DropdownModule,
    InputTextModule,
    CheckboxModule,
    ConfirmationDialogComponent,
    FormsModule,
  ],
  templateUrl: './edit-personal-information.component.html',
  styles: ``,
  providers: [ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPersonalInformationComponent implements OnInit, OnDestroy {
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

  @ViewChild('editPersonalInformationDialog')
  editPersonalInformationDialog: ConfirmationDialogComponent;

  formGroup!: FormGroup<
    Record<string, FormControl<boolean | number | string | undefined>>
  >;
  formGroupChangesSubscription: Subscription;
  changedRegistrationData = signal<
    Record<string, boolean | number | string | undefined>
  >({});
  updateReason = model<string>();

  ngOnInit() {
    this.formGroup = new FormGroup(
      this.attributeList().reduce(
        (acc, attribute) => ({
          ...acc,
          [attribute.name]:
            this.registrationAttributeService.personalInformationAttributeToFormControl(
              {
                attribute,
                projectId: this.projectId(),
              },
            ),
        }),
        {},
      ),
    );

    this.formGroupChangesSubscription = this.formGroup.valueChanges.subscribe(
      (updatedValue) => {
        this.changedRegistrationData.set(
          pickBy(
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
        // eslint-disable-next-line @typescript-eslint/unbound-method
        this.formGroup.controls.phoneNumber.addValidators(Validators.required);
      } catch (e) {
        console.error(e);
      }
    }
  });

  patchRegistrationMutation = injectMutation(() => ({
    mutationFn: ({
      referenceId,
      data,
      reason,
    }: {
      referenceId: string;
      data: Record<string, boolean | number | string | undefined>;
      reason?: string;
    }) => {
      if (!reason) {
        throw new Error($localize`Reason is required`);
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

  onSubmit() {
    this.formGroup.markAllAsTouched();

    if (!this.formGroup.valid) {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Please fill out all required fields.`,
      });
      return;
    }

    if (Object.keys(this.changedRegistrationData()).length === 0) {
      this.toastService.showToast({
        severity: 'info',
        detail: $localize`No changes detected.`,
      });
      return;
    }

    this.editPersonalInformationDialog.askForConfirmation();
  }
}

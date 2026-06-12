import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  input,
  LOCALE_ID,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';

import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { ComponentCanDeactivate } from '~/guards/pending-changes.guard';
import { NoEligibleApproversMessageComponent } from '~/pages/program-settings-payment-approval/components/no-eligible-approvers-message/no-eligible-approvers-message.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import { Dto } from '~/utils/dto-type';

type ApprovalStepFormGroup = FormGroup<{
  userIds: FormControl<number[]>;
  thresholdAmount: FormControl<null | number>;
}>;

@Component({
  selector: 'app-program-settings-payment-approval',
  imports: [
    PageLayoutProgramSettingsComponent,
    ManualLinkComponent,
    CardEditableComponent,
    FormFieldWrapperComponent,
    TableModule,
    InfoTooltipComponent,
    ButtonModule,
    MultiSelectModule,
    InputNumberModule,
    ReactiveFormsModule,
    NoEligibleApproversMessageComponent,
  ],
  providers: [CurrencyPipe, ToastService],
  templateUrl: './program-settings-payment-approval.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsPaymentApprovalPageComponent implements ComponentCanDeactivate {
  readonly isEditing = signal(false);
  readonly programId = input.required<string>();
  private readonly hasInitializedEditForm = signal(false);
  readonly showAdditionalSteps = signal(false);
  private readonly authService = inject(AuthService);
  private readonly currencyPipe = inject(CurrencyPipe);
  private readonly programApiService = inject(ProgramApiService);
  private readonly toastService = inject(ToastService);
  private readonly localeId = inject(LOCALE_ID);

  readonly formGroup = new FormGroup({
    firstStepUserIds: new FormControl<number[]>([], {
      nonNullable: true,
      validators: [
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        Validators.required,
        Validators.minLength(1),
      ],
    }),
    additionalSteps: new FormArray<ApprovalStepFormGroup>([], {
      validators: [this.uniqueThresholdAmountValidator.bind(this)],
    }),
  });

  readonly formValue = toSignal(this.formGroup.valueChanges, {
    initialValue: this.formGroup.getRawValue(),
  });

  readonly currencyCode = computed(() => this.program.data()?.currency);

  readonly inputLocale = computed(() => this.localeId || 'en-US');

  program = injectQuery(this.programApiService.getProgram(this.programId));

  readonly canManageApprovalThresholds = computed(() =>
    this.authService.hasPermission({
      programId: this.programId(),
      requiredPermission: PermissionEnum.ProgramApprovalThresholdsUPDATE,
    }),
  );

  readonly approvalThresholds = injectQuery(
    this.programApiService.getApprovalThresholds({ programId: this.programId }),
  );

  readonly programUsers = injectQuery(
    this.programApiService.getProgramUsers(this.programId),
  );

  saveApprovalThresholdsMutation = injectMutation(() => ({
    mutationFn: ({
      thresholds,
    }: {
      thresholds: Dto<CreateProgramApprovalThresholdDto>[];
    }) =>
      this.programApiService.createOrReplaceApprovalThresholds({
        programId: this.programId,
        thresholds,
      }),
    onSuccess: () => {
      void this.approvalThresholds.refetch();
      void this.programUsers.refetch();
      this.toastService.showToast({
        detail: $localize`Payment approval saved successfully.`,
      });
    },
    onError: (error: Error) => {
      this.toastService.showToast({
        severity: 'error',
        detail: error.message,
      });
      // Reset mutation state so the inline error block in card-editable does not render.
      this.saveApprovalThresholdsMutation.reset();
    },
  }));

  readonly mutationData = computed(() => {
    this.formValue();

    return {
      thresholds: this.buildThresholdPayload(),
    };
  });

  readonly availableApproverOptions = computed(() => {
    const users = this.programUsers.data() ?? [];
    const currentUserUsername = this.authService.user?.username;

    return users
      .filter((user) => user.isEligiblePaymentApprover)
      .filter((user) => user.username !== currentUserUsername)
      .filter(
        (user): user is { username: string } & typeof user =>
          typeof user.username === 'string' && user.username.length > 0,
      )
      .map((user) => ({
        label: user.username,
        value: user.id,
      }));
  });

  readonly tableRows = computed(() => {
    const thresholds = this.approvalThresholds.data();

    if (!thresholds) return [];

    // We rely on the sorting the backend does.
    return thresholds.map((threshold, index) => {
      const usernames = threshold.approvers
        .map((approver) => approver.username)
        .filter(
          (username): username is string =>
            typeof username === 'string' && username.length > 0,
        );

      return {
        step: index + 1,
        users: usernames.join(', ') || '-',
        thresholdAmount: this.currencyPipe.transform(
          threshold.thresholdAmount,
          this.currencyCode(),
          'symbol-narrow',
          '1.0-0',
        ),
      };
    });
  });

  constructor() {
    effect(() => {
      const isEditing = this.isEditing();
      const thresholds = this.approvalThresholds.data();
      const programUsers = this.programUsers.data();

      if (!isEditing) {
        this.hasInitializedEditForm.set(false);
        this.showAdditionalSteps.set(false);
        return;
      }

      // Wait until both thresholds and program users are loaded,
      // so users excluded by eligibility rules are removed on edit open.
      if (!thresholds || !programUsers || this.hasInitializedEditForm()) {
        return;
      }

      this.initializeFormFromThresholds(thresholds);
      this.hasInitializedEditForm.set(true);
    });
  }

  availableApproversForFirstStep(): {
    label: string;
    value: number;
  }[] {
    const currentStepSelectedIds = new Set(
      this.formGroup.controls.firstStepUserIds.value,
    );
    const selectedInAdditionalSteps =
      this.getSelectedApproverIdsInAdditionalSteps();

    return this.availableApproverOptions().filter(
      (option) =>
        currentStepSelectedIds.has(option.value) ||
        !selectedInAdditionalSteps.has(option.value),
    );
  }

  get additionalSteps(): FormArray<ApprovalStepFormGroup> {
    return this.formGroup.controls.additionalSteps;
  }

  addApprovalStep(): void {
    if (!this.showAdditionalSteps()) {
      this.showAdditionalSteps.set(true);
    }

    this.additionalSteps.push(this.createAdditionalStepGroup());
  }

  removeApprovalStep(index: number): void {
    this.additionalSteps.removeAt(index);

    if (this.additionalSteps.length === 0) {
      this.showAdditionalSteps.set(false);
    }

    this.pruneInvalidSelectionsForAdditionalSteps();
    this.additionalSteps.markAsDirty();
    this.additionalSteps.markAsTouched();
  }

  onApproverSelectionChanged(): void {
    this.pruneInvalidSelectionsForAdditionalSteps();
  }

  availableApproversForAdditionalStep(stepIndex: number): {
    label: string;
    value: number;
  }[] {
    const currentStepSelectedValues =
      stepIndex < this.additionalSteps.length
        ? this.additionalSteps.at(stepIndex).controls.userIds.value
        : [];

    const currentStepSelectedIds = new Set(currentStepSelectedValues);
    const selectedInFirstStep = new Set(
      this.formGroup.controls.firstStepUserIds.value,
    );
    const selectedInOtherAdditionalSteps =
      this.getSelectedApproverIdsInAdditionalSteps({
        excludeStepIndex: stepIndex,
      });

    return this.availableApproverOptions().filter(
      (option) =>
        currentStepSelectedIds.has(option.value) ||
        (!selectedInFirstStep.has(option.value) &&
          !selectedInOtherAdditionalSteps.has(option.value)),
    );
  }

  isFirstStepInvalid(): boolean {
    const control = this.formGroup.controls.firstStepUserIds;
    return control.invalid && control.touched;
  }

  isAdditionalStepUsersInvalid(stepIndex: number): boolean {
    const control = this.additionalSteps.at(stepIndex).controls.userIds;
    return control.invalid && control.touched;
  }

  isAdditionalStepThresholdInvalid(stepIndex: number): boolean {
    const control = this.additionalSteps.at(stepIndex).controls.thresholdAmount;
    return control.invalid && control.touched;
  }

  isDuplicateThresholdAmount(stepIndex: number): boolean {
    const control = this.additionalSteps.at(stepIndex).controls.thresholdAmount;
    const value = control.value;

    if (value === null) {
      return false;
    }

    const occurrences = this.additionalSteps.controls.filter(
      (step) => step.controls.thresholdAmount.value === value,
    ).length;

    return occurrences > 1;
  }

  @HostListener('window:beforeunload', ['$event'])
  canDeactivate($event?: BeforeUnloadEvent): boolean {
    const hasUnsavedChanges = this.isEditing() && this.formGroup.dirty;

    if (!hasUnsavedChanges) {
      return true;
    }

    $event?.preventDefault();
    return false;
  }

  private createAdditionalStepGroup({
    userIds = [],
    thresholdAmount = null,
  }: {
    userIds?: number[];
    thresholdAmount?: null | number;
  } = {}): ApprovalStepFormGroup {
    return new FormGroup({
      userIds: new FormControl(userIds, {
        nonNullable: true,
        validators: [
          // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
          Validators.required,
          Validators.minLength(1),
        ],
      }),
      thresholdAmount: new FormControl(thresholdAmount, {
        validators: [
          // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
          Validators.required,
          this.positiveNumberValidator.bind(this),
        ],
      }),
    });
  }

  private initializeFormFromThresholds(
    thresholds: GetProgramApprovalThresholdResponseDto[],
  ): void {
    const zeroThreshold = thresholds.find(
      (threshold) => threshold.thresholdAmount === 0,
    );

    this.formGroup.controls.firstStepUserIds.setValue(
      zeroThreshold
        ? this.getValidApproverUserIds(zeroThreshold.approvers)
        : [],
    );
    this.formGroup.controls.firstStepUserIds.markAsPristine();
    this.formGroup.controls.firstStepUserIds.markAsUntouched();

    this.additionalSteps.clear();

    const additionalThresholds = thresholds.filter(
      (threshold) => threshold.thresholdAmount > 0,
    );

    additionalThresholds.sort(
      (firstThreshold, secondThreshold) =>
        firstThreshold.thresholdAmount - secondThreshold.thresholdAmount,
    );

    for (const threshold of additionalThresholds) {
      this.additionalSteps.push(
        this.createAdditionalStepGroup({
          userIds: this.getValidApproverUserIds(threshold.approvers),
          thresholdAmount: threshold.thresholdAmount,
        }),
      );
    }

    this.showAdditionalSteps.set(additionalThresholds.length > 0);

    this.formGroup.markAsPristine();
    this.formGroup.markAsUntouched();
  }

  private buildThresholdPayload(): Dto<CreateProgramApprovalThresholdDto>[] {
    const firstStepUserIds = this.formGroup.controls.firstStepUserIds.value;

    const additionalSteps = this.additionalSteps.controls
      .map((step) => ({
        thresholdAmount: step.controls.thresholdAmount.value,
        userIds: step.controls.userIds.value,
      }))
      .filter(
        (step): step is { thresholdAmount: number; userIds: number[] } =>
          step.thresholdAmount !== null,
      )
      .sort((a, b) => a.thresholdAmount - b.thresholdAmount)
      .map((step) => ({
        thresholdAmount: step.thresholdAmount,
        userIds: step.userIds,
      }));

    return [
      {
        thresholdAmount: 0,
        userIds: firstStepUserIds,
      },
      ...additionalSteps,
    ];
  }

  private getSelectedApproverIdsInAdditionalSteps({
    excludeStepIndex,
  }: {
    excludeStepIndex?: number;
  } = {}): Set<number> {
    const selected = new Set<number>();

    for (const [index, step] of this.additionalSteps.controls.entries()) {
      if (excludeStepIndex !== undefined && index === excludeStepIndex) {
        continue;
      }

      for (const userId of step.controls.userIds.value) {
        selected.add(userId);
      }
    }

    return selected;
  }

  private pruneInvalidSelectionsForAdditionalSteps(): void {
    const selected = new Set<number>(
      this.formGroup.controls.firstStepUserIds.value,
    );

    for (const step of this.additionalSteps.controls) {
      const currentUserIds = step.controls.userIds.value;
      const filteredUserIds = currentUserIds.filter(
        (userId) => !selected.has(userId),
      );

      if (filteredUserIds.length !== currentUserIds.length) {
        step.controls.userIds.setValue(filteredUserIds);
        step.controls.userIds.markAsDirty();
      }

      for (const userId of filteredUserIds) {
        selected.add(userId);
      }
    }
  }

  private getValidApproverUserIds(
    approvers: GetProgramApprovalThresholdResponseDto['approvers'],
  ): number[] {
    const currentUserUsername = this.authService.user?.username;
    const eligibleApproverIds = new Set(
      (this.programUsers.data() ?? [])
        .filter((user) => user.isEligiblePaymentApprover)
        .filter((user) => user.username !== currentUserUsername)
        .map((user) => user.id)
        .filter((userId): userId is number => typeof userId === 'number'),
    );

    return approvers
      .map((approver) => approver.userId)
      .filter(
        (userId): userId is number =>
          typeof userId === 'number' && eligibleApproverIds.has(userId),
      );
  }

  private positiveNumberValidator(
    control: AbstractControl<null | number>,
  ): null | ValidationErrors {
    const value = control.value;

    if (value === null) {
      return null;
    }

    if (value <= 0) {
      return { mustBeLargerThanZero: true };
    }

    return null;
  }

  private uniqueThresholdAmountValidator(
    control: AbstractControl,
  ): null | ValidationErrors {
    if (!(control instanceof FormArray)) {
      return null;
    }

    const stepControls = control.controls as ApprovalStepFormGroup[];

    const amounts = stepControls
      .map((stepControl) => stepControl.controls.thresholdAmount.value)
      .filter((value): value is number => value !== null);

    const uniqueAmounts = new Set(amounts);

    if (amounts.length !== uniqueAmounts.size) {
      return { duplicateThresholdAmount: true };
    }

    return null;
  }
}

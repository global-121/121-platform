import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { ApprovalThresholdApiService } from '~/domains/approval-threshold/approval-threshold.api.service';
import { ApprovalThreshold } from '~/domains/approval-threshold/approval-threshold.model';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { ProgramUser } from '~/domains/program/program.model';
import {
  ThresholdRow,
  validateApprovalThresholds,
} from '~/pages/program-settings-approvers/approval-threshold-form.helper';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-program-settings-approvers',
  imports: [
    PageLayoutProgramSettingsComponent,
    ButtonModule,
    CardModule,
    FormErrorComponent,
    FormFieldWrapperComponent,
    FormsModule,
    InputTextModule,
    MultiSelectModule,
  ],
  templateUrl: './program-settings-approvers.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class ProgramSettingsApproversPageComponent {
  readonly programId = input.required<string>();

  private readonly approvalThresholdApiService = inject(
    ApprovalThresholdApiService,
  );
  private readonly programApiService = inject(ProgramApiService);
  private readonly toastService = inject(ToastService);
  readonly rtlHelper = inject(RtlHelperService);

  readonly isEditing = signal(false);
  readonly showValidationErrors = signal(false);

  readonly draftThresholds = signal<ThresholdRow[]>([]);

  approvalThresholds = injectQuery(
    this.approvalThresholdApiService.getApprovalThresholds(this.programId),
  );

  programUsers = injectQuery(
    this.programApiService.getProgramUsers(this.programId),
  );

  readonly usersWithoutScope = computed(() =>
    (this.programUsers.data() ?? []).filter((u) => !u.scope),
  );

  readonly validationResult = computed(() => {
    if (!this.showValidationErrors()) {
      return null;
    }
    return validateApprovalThresholds(this.draftThresholds());
  });

  saveThresholdsMutation = injectMutation(() => ({
    mutationFn: () =>
      this.approvalThresholdApiService.updateApprovalThresholds({
        programId: this.programId,
        thresholds: this.draftThresholds().map((t) => ({
          thresholdAmount: t.thresholdAmount ?? 0,
          userIds: t.userIds,
        })),
      }),
    onSuccess: () => {
      this.isEditing.set(false);
      this.showValidationErrors.set(false);
      this.toastService.showToast({
        detail: $localize`Approvers saved`,
      });
    },
    onError: () => {
      this.toastService.showGenericError();
    },
  }));

  constructor() {
    effect(() => {
      const thresholds = this.approvalThresholds.data();
      if (thresholds) {
        this.draftThresholds.set(this.mapThresholdsToDraft(thresholds));
      }
    });
  }

  startEditing() {
    this.showValidationErrors.set(false);
    this.isEditing.set(true);
  }

  cancelEditing() {
    this.draftThresholds.set(
      this.mapThresholdsToDraft(this.approvalThresholds.data() ?? []),
    );
    this.showValidationErrors.set(false);
    this.isEditing.set(false);
  }

  onSave() {
    this.showValidationErrors.set(true);

    const errors = validateApprovalThresholds(this.draftThresholds());
    if (errors) {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Please correct the errors in the form.`,
      });
      return;
    }

    this.saveThresholdsMutation.mutate(undefined);
  }

  addThreshold() {
    this.draftThresholds.update((thresholds) => [
      ...thresholds,
      { thresholdAmount: null, userIds: [] },
    ]);
  }

  removeThreshold(index: number) {
    this.draftThresholds.update((thresholds) =>
      thresholds.filter((_, i) => i !== index),
    );
  }

  updateThresholdAmount(index: number, value: string) {
    const trimmed = value.trim();
    const parsed =
      trimmed === '' || isNaN(Number(trimmed)) ? null : Number(trimmed);
    this.draftThresholds.update((thresholds) =>
      thresholds.map((t, i) =>
        i === index ? { ...t, thresholdAmount: parsed } : t,
      ),
    );
  }

  sortThresholdsByAmount() {
    this.draftThresholds.update((thresholds) =>
      [...thresholds].sort((a, b) => {
        const aAmount = a.thresholdAmount ?? Infinity;
        const bAmount = b.thresholdAmount ?? Infinity;
        return aAmount - bAmount;
      }),
    );
  }

  updateThresholdUserIds(index: number, userIds: number[]) {
    this.draftThresholds.update((thresholds) =>
      thresholds.map((t, i) => (i === index ? { ...t, userIds } : t)),
    );
  }

  getAvailableUsersForThreshold(index: number): ProgramUser[] {
    const usersWithoutScope = this.usersWithoutScope();
    const selectedInOtherThresholds = new Set(
      this.draftThresholds()
        .filter((_, i) => i !== index)
        .flatMap((t) => t.userIds),
    );
    return usersWithoutScope.filter(
      (u) => !selectedInOtherThresholds.has(u.id),
    );
  }

  private mapThresholdsToDraft(
    thresholds: ApprovalThreshold[] | undefined,
  ): ThresholdRow[] {
    return (thresholds ?? []).map((t) => ({
      thresholdAmount: t.thresholdAmount,
      userIds: t.approvers
        .map((a) => a.userId)
        .filter((id): id is number => id !== undefined),
    }));
  }
}

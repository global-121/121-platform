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
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { SkeletonModule } from 'primeng/skeleton';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { ApprovalThresholdApiService } from '~/domains/approval-threshold/approval-threshold.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

interface ThresholdFormItem {
  thresholdAmount: number;
  userIds: number[];
}

@Component({
  selector: 'app-program-settings-approvers',
  imports: [
    ButtonModule,
    CardEditableComponent,
    FormFieldWrapperComponent,
    FormsModule,
    InputNumberModule,
    MultiSelectModule,
    PageLayoutProgramSettingsComponent,
    SkeletonModule,
  ],
  providers: [ToastService],
  templateUrl: './program-settings-approvers.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsApproversPageComponent {
  readonly programId = input.required<string>();

  private readonly approvalThresholdApiService = inject(
    ApprovalThresholdApiService,
  );
  private readonly programApiService = inject(ProgramApiService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly isEditing = signal(false);

  readonly canEdit = computed(() => this.authService.isOrganizationAdmin);

  readonly approvalThresholds = injectQuery(
    this.approvalThresholdApiService.getApprovalThresholds(this.programId),
  );

  readonly programUsers = injectQuery(
    this.programApiService.getProgramUsers(this.programId),
  );

  readonly availableApprovers = computed(() =>
    (this.programUsers.data() ?? [])
      .filter((u) => !u.scope)
      .map((u) => ({ id: u.id, username: u.username })),
  );

  readonly formThresholds = signal<ThresholdFormItem[]>([]);

  readonly thresholdApproverOptions = computed(() => {
    const thresholds = this.formThresholds();
    const allApprovers = this.availableApprovers();

    return thresholds.map((_threshold, index) => {
      const usedElsewhere = new Set(
        thresholds.flatMap((t, i) => (i === index ? [] : t.userIds)),
      );
      return allApprovers.filter((u) => !usedElsewhere.has(u.id));
    });
  });

  readonly saveThresholdsMutation = injectMutation(() => ({
    mutationFn: (thresholds: ThresholdFormItem[]) =>
      this.approvalThresholdApiService.createOrReplaceApprovalThresholds(
        this.programId,
        thresholds,
      ),
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Approvers saved successfully.`,
      });
    },
  }));

  constructor() {
    effect(() => {
      const thresholds = this.approvalThresholds.data();

      // Don't reset the form while the user is editing
      if (this.isEditing()) {
        return;
      }

      if (thresholds !== undefined) {
        this.formThresholds.set(
          thresholds.length > 0
            ? thresholds.map((t) => ({
                thresholdAmount: t.thresholdAmount,
                userIds: t.approvers
                  .map((a) => a.userId)
                  .filter((id): id is number => id !== undefined),
              }))
            : [{ thresholdAmount: 0, userIds: [] }],
        );
      }
    });
  }

  thresholdAmountLabel(amount: number): string {
    return amount === 0
      ? $localize`All payments`
      : $localize`Payments ≥ ${amount}`;
  }

  formatApproverNames(approvers: { username: null | string }[]): string {
    return approvers
      .map((a) => a.username)
      .filter((name): name is string => name !== null)
      .join(', ');
  }

  updateThresholdAmount(index: number, amount: number) {
    this.formThresholds.update((thresholds) =>
      thresholds.map((t, i) =>
        i === index ? { ...t, thresholdAmount: amount } : t,
      ),
    );
  }

  updateThresholdUserIds(index: number, userIds: number[]) {
    this.formThresholds.update((thresholds) =>
      thresholds.map((t, i) => (i === index ? { ...t, userIds } : t)),
    );
  }

  addThreshold() {
    this.formThresholds.update((thresholds) => [
      ...thresholds,
      { thresholdAmount: 0, userIds: [] },
    ]);
  }

  removeThreshold(index: number) {
    this.formThresholds.update((thresholds) =>
      thresholds.filter((_, i) => i !== index),
    );
  }
}

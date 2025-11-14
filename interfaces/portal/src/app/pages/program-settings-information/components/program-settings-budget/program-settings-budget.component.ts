import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import {
  ProgramBudgetFormGroup,
  ProgramFormBudgetComponent,
} from '~/components/program-form-budget/program-form-budget.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { PROGRAM_FORM_TOOLTIPS } from '~/domains/program/program.helper';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-program-settings-budget',
  imports: [
    CardEditableComponent,
    DataListComponent,
    ProgramFormBudgetComponent,
  ],
  templateUrl: './program-settings-budget.component.html',
  providers: [ToastService],
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsBudgetComponent {
  readonly programId = input.required<string>();

  readonly isEditing = signal(false);

  authService = inject(AuthService);
  programApiService = inject(ProgramApiService);
  toastService = inject(ToastService);

  program = injectQuery(this.programApiService.getProgram(this.programId));

  readonly canEdit = computed(() =>
    this.authService.hasPermission({
      programId: this.programId(),
      requiredPermission: PermissionEnum.ProgramUPDATE,
    }),
  );

  readonly programFormBudget =
    viewChild<ProgramFormBudgetComponent>('programFormBudget');
  readonly formGroup = computed(() => this.programFormBudget()?.formGroup);

  updateProgramMutation = injectMutation(() => ({
    mutationFn: async ({
      budget,
      currency,
      distributionDuration,
      fixedTransferValue,
    }: ReturnType<ProgramBudgetFormGroup['getRawValue']>) =>
      this.programApiService.updateProgram({
        programId: this.programId,
        programPatch: {
          budget,
          currency,
          distributionDuration,
          fixedTransferValue,
        },
      }),
    onSuccess: async () => {
      this.toastService.showToast({
        detail: $localize`Budget details saved successfully.`,
      });

      await this.programApiService.invalidateCache();
    },
  }));

  readonly dataListData = computed(() => {
    const programData = this.program.data();

    const listData: DataListItem[] = [
      {
        label: $localize`Funds available`,
        value: programData?.budget,
        type: 'number',
      },
      {
        label: '*' + $localize`Currency`,
        value: programData?.currency,
        tooltip: PROGRAM_FORM_TOOLTIPS.currency,
        type: 'text',
      },
      {
        label: $localize`Default transactions per registration`,
        value: programData?.distributionDuration,
        type: 'number',
        fullWidth: true,
        tooltip: PROGRAM_FORM_TOOLTIPS.distributionDuration,
      },
      {
        label: '*' + $localize`Fixed transfer value`,
        value: programData?.fixedTransferValue,
        type: 'number',
        fullWidth: true,
      },
    ];

    return [...listData].map((item) => ({
      ...item,
      loading: this.program.isPending(),
    }));
  });
}

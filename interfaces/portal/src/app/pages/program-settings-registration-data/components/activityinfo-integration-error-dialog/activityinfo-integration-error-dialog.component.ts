import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';

import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';

import { ActivityInfoValidationErrorType } from '@121-service/src/activityinfo/enum/activityinfo-validation-error-type';
import { ActivityInfoValidationError } from '@121-service/src/activityinfo/interfaces/activityinfo-validation-error.interface';

import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';

enum ActivityInfoErrorDisplayType {
  formSetting = 'formSetting',
  missingField = 'missingField',
  table = 'table',
}

const activityInfoErrorDisplayTypeMap: Record<
  ActivityInfoValidationErrorType,
  ActivityInfoErrorDisplayType
> = {
  [ActivityInfoValidationErrorType.missingField]:
    ActivityInfoErrorDisplayType.missingField,
  [ActivityInfoValidationErrorType.unsupportedLanguage]:
    ActivityInfoErrorDisplayType.formSetting,
  [ActivityInfoValidationErrorType.typeMismatch]:
    ActivityInfoErrorDisplayType.table,
  [ActivityInfoValidationErrorType.invalidChoice]:
    ActivityInfoErrorDisplayType.table,
  [ActivityInfoValidationErrorType.forbiddenAttribute]:
    ActivityInfoErrorDisplayType.table,
  [ActivityInfoValidationErrorType.missingFieldCode]:
    ActivityInfoErrorDisplayType.table,
  [ActivityInfoValidationErrorType.subFormFound]:
    ActivityInfoErrorDisplayType.table,
  [ActivityInfoValidationErrorType.singleSelectNoChoices]:
    ActivityInfoErrorDisplayType.table,
  [ActivityInfoValidationErrorType.missingFullnameAttributes]:
    ActivityInfoErrorDisplayType.table,
};

@Component({
  selector: 'app-activityinfo-integration-error-dialog',
  imports: [Dialog, Button, InfoTooltipComponent, Tag, TableModule],
  templateUrl: './activityinfo-integration-error-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityInfoIntegrationErrorDialogComponent {
  readonly errors = input<ActivityInfoValidationError[]>([]);
  readonly dialogVisible = model(false);
  readonly tryAgain = output();

  readonly isActivityInfoIntegrated = input<boolean>();

  readonly modalText = computed(() => ({
    title: this.isActivityInfoIntegrated()
      ? $localize`ActivityInfo form refresh errors`
      : $localize`ActivityInfo form integration errors`,
    message: this.isActivityInfoIntegrated()
      ? $localize`There are issues in your ActivityInfo form that are blocking the refresh. Fix the errors below in ActivityInfo, then try again.`
      : $localize`There are issues in your ActivityInfo form that are blocking the integration. Fix the errors below in ActivityInfo, then try again.`,
  }));

  readonly errorTable = computed(() =>
    this.errors().filter(
      (error) =>
        activityInfoErrorDisplayTypeMap[error.type] ===
        ActivityInfoErrorDisplayType.table,
    ),
  );

  readonly formSettingErrors = computed(() =>
    this.errors().filter(
      (error) =>
        activityInfoErrorDisplayTypeMap[error.type] ===
        ActivityInfoErrorDisplayType.formSetting,
    ),
  );

  readonly missingFieldErrors = computed(() => {
    const fields = this.errors()
      .filter(
        (error) =>
          activityInfoErrorDisplayTypeMap[error.type] ===
          ActivityInfoErrorDisplayType.missingField,
      )
      .map((error: ActivityInfoValidationError) => error.attributeName);

    return [...new Set(fields)];
  });

  show() {
    this.dialogVisible.set(true);
  }

  hide() {
    this.dialogVisible.set(false);
  }

  handleTryAgainClick() {
    this.dialogVisible.set(false);
    this.tryAgain.emit();
  }
}

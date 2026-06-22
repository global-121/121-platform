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

import { KoboValidationErrorType } from '@121-service/src/kobo/enum/kobo-validation-error-type';
import { KoboValidationError } from '@121-service/src/kobo/interfaces/kobo-validation-error.interface';

import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';

enum KoboErrorDisplayType {
  formSetting = 'formSetting',
  missingField = 'missingField',
  table = 'table',
}

const koboErrorDisplayTypeMap: Record<
  KoboValidationErrorType,
  KoboErrorDisplayType
> = {
  [KoboValidationErrorType.missingField]: KoboErrorDisplayType.missingField,
  [KoboValidationErrorType.missingEnglishLanguage]:
    KoboErrorDisplayType.formSetting,
  [KoboValidationErrorType.invalidLanguageCode]:
    KoboErrorDisplayType.formSetting,
  [KoboValidationErrorType.typeMismatch]: KoboErrorDisplayType.table,
  [KoboValidationErrorType.invalidChoice]: KoboErrorDisplayType.table,
  [KoboValidationErrorType.formConfiguration]: KoboErrorDisplayType.table,
  [KoboValidationErrorType.forbiddenAttribute]: KoboErrorDisplayType.table,
  [KoboValidationErrorType.matrixTypeFound]: KoboErrorDisplayType.table,
  [KoboValidationErrorType.selectOneNoChoices]: KoboErrorDisplayType.table,
  [KoboValidationErrorType.missingFullnameAttributes]:
    KoboErrorDisplayType.table,
};

@Component({
  selector: 'app-kobo-error-dialog',
  imports: [Dialog, Button, InfoTooltipComponent, Tag, TableModule],
  templateUrl: './kobo-error-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboErrorDialogComponent {
  readonly errors = input<KoboValidationError[]>([]);
  readonly dialogVisible = model(false);
  readonly tryAgain = output();

  readonly isKoboIntegrated = input<boolean>();

  readonly modalText = computed(() => ({
    title: this.isKoboIntegrated()
      ? $localize`Kobo form refresh errors`
      : $localize`Kobo form integration errors`,
    message: this.isKoboIntegrated()
      ? $localize`There are issues in your Kobo form that are blocking the refresh. Fix the errors below in Kobo, then save, redeploy, and try again.`
      : $localize`There are issues in your Kobo form that are blocking the integration. Fix the errors below in Kobo, then save, redeploy, and try again.`,
  }));

  readonly errorTable = computed(() => {
    return this.errors().filter(
      (error) =>
        koboErrorDisplayTypeMap[error.type] === KoboErrorDisplayType.table,
    );
  });

  readonly formSettingErrors = computed(() =>
    this.errors().filter(
      (error) =>
        koboErrorDisplayTypeMap[error.type] ===
        KoboErrorDisplayType.formSetting,
    ),
  );

  readonly missingFieldErrors = computed(() => {
    const fields = this.errors()
      .filter(
        (error) =>
          koboErrorDisplayTypeMap[error.type] ===
          KoboErrorDisplayType.missingField,
      )
      .map((error: KoboValidationError) => error.attributeName);
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

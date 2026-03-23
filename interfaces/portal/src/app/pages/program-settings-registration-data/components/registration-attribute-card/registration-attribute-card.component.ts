import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import {
  AbstractControl,
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
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';

import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { ProgramRegistrationAttribute } from '~/domains/program/program.model';
import { AuthService } from '~/services/auth.service';
import { GetRegistrationPreferredLanguageNameService } from '~/services/get-registration-preferrred-language-name.service';
import { ToastService } from '~/services/toast.service';

const requiredValidator = (control: AbstractControl): null | ValidationErrors =>
  Validators.required(control);

@Component({
  selector: 'app-registration-attribute-card',
  imports: [
    CardEditableComponent,
    DataListComponent,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
    InputTextModule,
    CheckboxModule,
  ],
  templateUrl: './registration-attribute-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class RegistrationAttributeCardComponent implements OnInit {
  readonly programId = input.required<string>();
  readonly attribute = input.required<ProgramRegistrationAttribute>();

  readonly authService = inject(AuthService);
  readonly programApiService = inject(ProgramApiService);
  readonly toastService = inject(ToastService);
  readonly languageNameService = inject(
    GetRegistrationPreferredLanguageNameService,
  );

  readonly isEditing = signal(false);

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );

  readonly canEdit = () =>
    this.authService.hasPermission({
      programId: this.programId(),
      requiredPermission: PermissionEnum.ProgramUPDATE,
    });

  formGroup!: FormGroup<{
    labels: FormGroup<Record<string, FormControl<string>>>;
    duplicateCheck: FormControl<boolean>;
  }>;

  readonly updateAttributeMutation = injectMutation(() => ({
    mutationFn: ({
      labels,
      duplicateCheck,
    }: {
      labels: Record<string, string>;
      duplicateCheck: boolean;
    }) => {
      const existingLabels = this.attribute().label as Record<string, string>;
      const updatedLabel = { ...existingLabels, ...labels };

      return this.programApiService.updateProgramRegistrationAttribute({
        programId: this.programId,
        attributeName: this.attribute().name,
        body: {
          label: updatedLabel,
          duplicateCheck,
        },
      });
    },
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Registration attribute saved successfully.`,
      });
    },
  }));

  readonly attributeDataList = (): DataListItem[] => {
    const attribute = this.attribute();
    const languages = (this.program.data()?.languages ??
      []) as RegistrationPreferredLanguage[];
    const existingLabels = attribute.label as Record<string, string>;

    const labelItems: DataListItem[] = languages.map((language) => ({
      label:
        this.languageNameService.getRegistrationPreferredLanguageName(
          language,
        ) + $localize` label`,
      value: existingLabels[language] ?? '',
    }));

    return [
      ...labelItems,
      {
        label: $localize`Use for de-duplication`,
        value: attribute.duplicateCheck ?? false,
        type: 'boolean',
      },
    ];
  };

  ngOnInit() {
    this.formGroup = this.buildFormGroup();
  }

  private buildFormGroup() {
    const attribute = this.attribute();
    const languages = (this.program.data()?.languages ??
      []) as RegistrationPreferredLanguage[];
    const existingLabels = attribute.label as Record<string, string>;

    const labelsControls: Record<string, FormControl<string>> = {};
    for (const language of languages) {
      labelsControls[language] = new FormControl<string>(
        existingLabels[language] ?? '',
        { nonNullable: true, validators: [requiredValidator] },
      );
    }

    return new FormGroup({
      labels: new FormGroup(labelsControls),
      duplicateCheck: new FormControl<boolean>(
        attribute.duplicateCheck ?? false,
        { nonNullable: true },
      ),
    });
  }

  getFormLanguages(): RegistrationPreferredLanguage[] {
    return (this.program.data()?.languages ??
      []) as RegistrationPreferredLanguage[];
  }

  getLanguageName(language: RegistrationPreferredLanguage): string {
    return this.languageNameService.getRegistrationPreferredLanguageName(
      language,
    );
  }

  getLabelControl(
    language: RegistrationPreferredLanguage,
  ): FormControl<string> {
    return this.formGroup.controls.labels.controls[language];
  }

  getMutationData() {
    const raw = this.formGroup.getRawValue();
    return {
      labels: raw.labels,
      duplicateCheck: raw.duplicateCheck,
    };
  }
}

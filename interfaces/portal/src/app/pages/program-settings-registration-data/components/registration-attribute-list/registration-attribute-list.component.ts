import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { AuthService } from '~/services/auth.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import {
  getLocaleLabel,
  getUILanguageFromLocale,
  Locale,
} from '~/utils/locale';

type AttributeLabelFormGroup = FormGroup<{
  label: FormControl<string>;
}>;

@Component({
  selector: 'app-registration-attribute-list',
  imports: [
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    ReactiveFormsModule,
    FormErrorComponent,
    SkeletonInlineComponent,
    TranslatableStringPipe,
  ],
  templateUrl: './registration-attribute-list.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class RegistrationAttributeListComponent {
  readonly programId = input.required<string>();

  private readonly locale = inject<Locale>(LOCALE_ID);
  readonly currentUILanguageName = getLocaleLabel(this.locale);
  private readonly currentUILanguage = getUILanguageFromLocale(this.locale);

  private readonly authService = inject(AuthService);
  private readonly programApiService = inject(ProgramApiService);
  private readonly translatableStringService = inject(
    TranslatableStringService,
  );
  readonly rtlHelper = inject(RtlHelperService);
  private readonly toastService = inject(ToastService);

  readonly isEditing = signal(false);

  readonly canEdit = computed(() =>
    this.authService.hasPermission({
      programId: this.programId(),
      requiredPermission: PermissionEnum.ProgramUPDATE,
    }),
  );

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );

  readonly registrationAttributes = computed(
    () => this.program.data()?.programRegistrationAttributes ?? [],
  );

  readonly formGroup = computed(() => {
    const attributes = this.registrationAttributes();
    const controls: Record<string, AttributeLabelFormGroup> = {};

    for (const attribute of attributes) {
      const currentLabel =
        this.translatableStringService.translate(
          attribute.label as Record<string, string>,
        ) ?? '';

      controls[attribute.name] = new FormGroup({
        label: new FormControl(currentLabel, {
          nonNullable: true,
          // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
          validators: [Validators.required],
        }),
      });
    }

    return new FormGroup(controls);
  });

  readonly saveLabelsMutation = injectMutation(() => ({
    mutationFn: async () => {
      const attributes = this.registrationAttributes();
      const formValues = this.formGroup().getRawValue();

      await Promise.all(
        attributes.map((attribute) => {
          const newLabel = formValues[attribute.name].label;
          const mergedLabel: Record<string, string> = {
            ...(attribute.label as Record<string, string>),
            [this.currentUILanguage]: newLabel,
          };

          return this.programApiService.updateProgramRegistrationAttribute({
            programId: this.programId,
            attributeName: attribute.name,
            label: mergedLabel,
          });
        }),
      );
    },
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Registration attribute labels saved successfully.`,
      });
      this.isEditing.set(false);
    },
  }));

  onFormSubmit() {
    const form = this.formGroup();
    form.markAllAsTouched();

    if (!form.valid) {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Please correct the errors in the form.`,
      });
      return;
    }

    this.saveLabelsMutation.mutate();
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { TextareaModule } from 'primeng/textarea';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { NotificationApiService } from '~/domains/notification/notification.api.service';
import { MessageTemplate } from '~/domains/notification/notification.model';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-message-template-card',
  imports: [
    CardEditableComponent,
    ReactiveFormsModule,
    TextareaModule,
    FormErrorComponent,
  ],
  templateUrl: './message-template-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class MessageTemplateCardComponent {
  readonly programId = input.required<string>();
  readonly templateType = input.required<string>();
  readonly templates = input.required<MessageTemplate[]>();
  readonly programLanguages = input.required<string[]>();

  readonly isEditing = signal(false);
  readonly notificationApiService = inject(NotificationApiService);
  readonly toastService = inject(ToastService);
  readonly translatableStringService = inject(TranslatableStringService);

  readonly cardTitle = computed(() => {
    const firstTemplate = this.templates().at(0);
    return (
      this.translatableStringService.translate(firstTemplate?.label) ??
      this.templateType()
    );
  });

  readonly templatesByLanguage = computed(() => {
    const languageMap = new Map<string, MessageTemplate | undefined>();
    for (const lang of this.programLanguages()) {
      languageMap.set(lang, undefined);
    }
    for (const template of this.templates()) {
      languageMap.set(template.language, template);
    }
    return languageMap;
  });

  readonly existingTemplates = computed(() =>
    [...this.templatesByLanguage()].filter(
      (entry): entry is [string, MessageTemplate] => !!entry[1],
    ),
  );

  readonly formGroup = computed(() => {
    const controls: Record<string, FormControl<string>> = {};
    for (const [lang, template] of this.existingTemplates()) {
      controls[lang] = new FormControl<string>(template.message ?? '', {
        nonNullable: true,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
      });
    }
    return new FormGroup(controls);
  });

  readonly missingLanguages = computed(() =>
    [...this.templatesByLanguage()]
      .filter(([, template]) => !template?.message)
      .map(([lang]) => lang),
  );

  readonly updateMutation = injectMutation(() => ({
    mutationFn: async (formValue: Record<string, string>) => {
      const updates: Promise<MessageTemplate>[] = [];
      for (const [lang, message] of Object.entries(formValue)) {
        const existingTemplate = this.templatesByLanguage().get(lang);
        if (existingTemplate && message !== existingTemplate.message) {
          updates.push(
            this.notificationApiService.updateMessageTemplate({
              programId: this.programId,
              type: this.templateType(),
              language: lang,
              body: { message },
            }),
          );
        }
      }
      await Promise.all(updates);
    },
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Message template saved successfully.`,
      });
    },
  }));

  getControlError(language: string): string | undefined {
    const control = this.formGroup().controls[language];
    if (!control.touched) {
      return undefined;
    }
    if (control.errors?.required) {
      return $localize`:@@generic-required-field:This field is required.`;
    }
    return undefined;
  }

  getEditPencilTitle(): string {
    return $localize`Edit message template "${this.cardTitle()}"`;
  }
}

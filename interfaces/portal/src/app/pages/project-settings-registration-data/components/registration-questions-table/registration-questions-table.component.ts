import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import { ProjectLanguageTabsComponent } from '~/components/project-language-tabs/project-language-tabs.component';
import { getTranslatableFormGroup } from '~/components/project-language-tabs/project-language-tabs.helper';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { LANGUAGE_ENUM_LABEL } from '~/domains/registration/registration.helper';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-registration-questions-table',
  imports: [
    TableModule,
    ReactiveFormsModule,
    InputTextModule,
    CardEditableComponent,
    ProjectLanguageTabsComponent,
  ],
  templateUrl: './registration-questions-table.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class RegistrationQuestionsTableComponent {
  readonly projectId = input.required<string>();

  readonly projectApiService = inject(ProjectApiService);
  readonly toastService = inject(ToastService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  projectAttributes = injectQuery(
    this.projectApiService.getProjectAttributes({
      projectId: this.projectId,
      includeProgramRegistrationAttributes: true,
    }),
  );

  LANGUAGE_ENUM_LABEL = LANGUAGE_ENUM_LABEL;

  formGroup = new FormGroup<
    Record<
      string,
      FormGroup<Partial<Record<LanguageEnum, FormControl<string>>>>
    >
  >({});

  readonly isEditing = model(false);
  readonly currentLanguage = model<LanguageEnum>(LanguageEnum.en);

  defineFormGroup = effect(() => {
    if (!this.project.isSuccess() || !this.projectAttributes.isSuccess()) {
      return;
    }

    const project = this.project.data();
    const projectAttributes = this.projectAttributes.data();

    this.formGroup = new FormGroup(
      Object.fromEntries(
        projectAttributes.map((attribute) => [
          attribute.name,
          getTranslatableFormGroup({
            project,
            getInitialValue: (language) => attribute.label?.[language] ?? '',
          }),
        ]),
      ),
    );
  });

  updateAttributesMutation = injectMutation(() => ({
    mutationFn: (formData: ReturnType<typeof this.formGroup.getRawValue>) =>
      // XXX: should be a single API call
      Promise.all(
        Object.entries(formData).map(([attributeName, attributeFormData]) =>
          this.projectApiService.updateProjectRegistrationAttribute({
            projectId: this.projectId,
            programRegistrationAttributeName: attributeName,
            attribute: {
              label: attributeFormData,
            },
          }),
        ),
      ),
    onSuccess: () => {
      void this.projectApiService.invalidateCache(this.projectId);
      this.isEditing.set(false);
      this.toastService.showToast({
        detail: $localize`Update successful.`,
      });
    },
    onError: () => {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`An error occurred while updating the labels.`,
      });
    },
  }));

  readonly sortedAttributes = computed(() => {
    if (!this.projectAttributes.isSuccess()) {
      return [];
    }

    return this.projectAttributes
      .data()
      .sort((a, b) => a.name.localeCompare(b.name));
  });
}

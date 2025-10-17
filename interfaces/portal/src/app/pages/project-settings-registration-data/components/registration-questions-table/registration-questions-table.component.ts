import { NgTemplateOutlet } from '@angular/common';
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
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';

import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

import { ProjectApiService } from '~/domains/project/project.api.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-registration-questions-table',
  imports: [
    CardModule,
    TableModule,
    TabsModule,
    NgTemplateOutlet,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
  ],
  templateUrl: './registration-questions-table.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class RegistrationQuestionsTableComponent {
  readonly projectId = input.required<string>();

  readonly projectApiService = inject(ProjectApiService);
  readonly rtlHelper = inject(RtlHelperService);
  readonly toastService = inject(ToastService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  projectAttributes = injectQuery(
    this.projectApiService.getProjectAttributes({
      projectId: this.projectId,
      includeProgramRegistrationAttributes: true,
    }),
  );

  formGroup: FormGroup<
    Record<string, FormGroup<Record<LanguageEnum, FormControl<string>>>>
  >;

  readonly isEditing = model(false);

  defineFormGroup = effect(() => {
    if (!this.project.isSuccess() || !this.projectAttributes.isSuccess()) {
      return;
    }

    const projectAttributes = this.projectAttributes.data();
    const languages = this.project.data().languages;

    this.formGroup = new FormGroup(
      projectAttributes.reduce((acc, attribute) => {
        acc[attribute.name] = new FormGroup(
          languages.reduce(
            (attrAcc, language) => {
              attrAcc[language] = new FormControl(
                attribute.label?.[language] ?? '',
                {
                  nonNullable: true,
                },
              );
              return attrAcc;
            },
            {} as Record<LanguageEnum, FormControl<string>>,
          ),
        );
        return acc;
      }, {}),
    );
  });

  updateAttributesMutation = injectMutation(() => ({
    mutationFn: () =>
      // XXX: should be a single API call
      Promise.all(
        Object.entries(this.formGroup.getRawValue()).map(
          ([attributeName, attributeFormData]) =>
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

  saveAttributes() {
    this.updateAttributesMutation.mutate();
  }
}

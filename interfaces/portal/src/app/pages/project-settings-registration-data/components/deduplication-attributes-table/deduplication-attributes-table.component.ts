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
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';

import { ProjectApiService } from '~/domains/project/project.api.service';
import { Project } from '~/domains/project/project.model';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-deduplication-attributes-table',
  imports: [
    CardModule,
    TableModule,
    ReactiveFormsModule,
    ButtonModule,
    MultiSelectModule,
  ],
  templateUrl: './deduplication-attributes-table.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class DeduplicationAttributesTableComponent {
  readonly projectId = input.required<string>();

  readonly projectApiService = inject(ProjectApiService);
  readonly rtlHelper = inject(RtlHelperService);
  readonly toastService = inject(ToastService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));

  formGroup = new FormGroup({
    deduplicationAttributes: new FormControl<
      Project['programRegistrationAttributes']
    >([], { nonNullable: true }),
  });

  readonly isEditing = model(false);

  updateFormGroup = effect(() => {
    if (!this.project.isSuccess()) {
      return;
    }

    this.formGroup.setValue({
      deduplicationAttributes: this.duplicateCheckAttributes(),
    });
  });

  updateAttributesMutation = injectMutation(() => ({
    mutationFn: () => {
      const formData = this.formGroup.getRawValue();

      // XXX: should be a single API call
      return Promise.all(
        (this.project.data()?.programRegistrationAttributes ?? []).map(
          (attribute) =>
            this.projectApiService.updateProjectRegistrationAttribute({
              projectId: this.projectId,
              programRegistrationAttributeName: attribute.name,
              attribute: {
                duplicateCheck: formData.deduplicationAttributes.some(
                  (item) => item.name === attribute.name,
                ),
              },
            }),
        ),
      );
    },
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
        detail: $localize`An error occurred during the update.`,
      });
    },
  }));

  readonly duplicateCheckAttributes = computed(() =>
    (this.project.data()?.programRegistrationAttributes ?? []).filter(
      (attribute) => attribute.duplicateCheck,
    ),
  );
}

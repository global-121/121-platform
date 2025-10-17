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
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { Project } from '~/domains/project/project.model';
import { ToastService } from '~/services/toast.service';

type DeduplicationAttributesFormGroup =
  typeof DeduplicationAttributesTableComponent.prototype.formGroup;

@Component({
  selector: 'app-deduplication-attributes-table',
  imports: [
    TableModule,
    ReactiveFormsModule,
    MultiSelectModule,
    CardEditableComponent,
  ],
  templateUrl: './deduplication-attributes-table.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class DeduplicationAttributesTableComponent {
  readonly projectId = input.required<string>();

  readonly projectApiService = inject(ProjectApiService);
  readonly toastService = inject(ToastService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));

  formGroup = new FormGroup({
    deduplicationAttributes: new FormControl<
      Project['programRegistrationAttributes']
    >([], { nonNullable: true }),
  });

  readonly isEditing = model(false);

  readonly duplicateCheckAttributes = computed(() =>
    (this.project.data()?.programRegistrationAttributes ?? []).filter(
      (attribute) => attribute.duplicateCheck,
    ),
  );

  updateFormGroup = effect(() => {
    if (!this.project.isSuccess()) {
      return;
    }

    this.formGroup.setValue({
      deduplicationAttributes: this.duplicateCheckAttributes(),
    });
  });

  updateAttributesMutation = injectMutation(() => ({
    mutationFn: (
      formData: ReturnType<DeduplicationAttributesFormGroup['getRawValue']>,
    ) =>
      // XXX: should be a single API call
      Promise.all(
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
        detail: $localize`An error occurred during the update.`,
      });
    },
  }));
}

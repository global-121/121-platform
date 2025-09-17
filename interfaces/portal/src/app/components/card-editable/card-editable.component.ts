import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';

import { CreateMutationResult } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FocusTrapModule } from 'primeng/focustrap';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-card-editable',
  imports: [
    CardModule,
    ButtonModule,
    FormsModule,
    FormErrorComponent,
    FocusTrapModule,
  ],
  templateUrl: './card-editable.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEditableComponent<TMutationData = unknown> {
  readonly title = input.required<string>();
  readonly canEdit = input.required<boolean>();
  readonly isEditing = model.required<boolean>();

  // XXX: this should become required once the "project settings team" page
  // has a mutation to update the checklist on save
  readonly mutation =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- couldn't find a way to avoid any here
    input<CreateMutationResult<any, Error, TMutationData>>();
  readonly mutationData = input<TMutationData>();

  readonly formGroup = input<FormGroup>();

  readonly rtlHelper = inject(RtlHelperService);

  // XXX: this should become redundant once "mutation" is required
  readonly isSaveable = computed(() => !!this.mutation());

  onFormSubmit() {
    const formGroup = this.formGroup();

    if (formGroup) {
      formGroup.markAllAsTouched();

      if (!formGroup.valid) {
        return;
      }
    }

    const mutation = this.mutation();
    const mutationData = this.mutationData();

    if (!mutation || !mutationData) {
      return;
    }

    mutation.mutate(mutationData, {
      onSuccess: () => {
        this.isEditing.set(false);
      },
    });
  }
}

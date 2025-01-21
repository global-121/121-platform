import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

import { FormSidebarComponent } from '~/components/form/form-sidebar.component';
import { QueryTableColumn } from '~/components/query-table/query-table.component';

@Component({
  selector: 'app-query-table-column-management',
  imports: [
    ButtonModule,
    FormSidebarComponent,
    CheckboxModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './query-table-column-management.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryTableColumnManagementComponent<
  TData extends { id: PropertyKey },
> {
  columns = input.required<QueryTableColumn<TData>[]>();
  visibleColumns = model.required<QueryTableColumn<TData>[]>();
  selectedColumnsStateKey = input<string>();
  readonly resetColumnVisibility = output();

  formVisible = model<boolean>(false);

  formGroup = new FormGroup({
    selectedColumns: new FormControl<QueryTableColumn<TData>[]>([], {
      nonNullable: true,
    }),
  });

  showColumnManagement() {
    this.formGroup.patchValue({
      selectedColumns: this.visibleColumns(),
    });
    this.formVisible.set(true);
  }

  updateColumnVisibility = injectMutation(() => ({
    // We don't technically need a mutation here, but we're using one
    // so that we can easily reuse the form-sidebar component
    mutationFn: () =>
      Promise.resolve(this.formGroup.getRawValue().selectedColumns),
    onSuccess: (selectedColumns) => {
      const stateKey = this.selectedColumnsStateKey();
      if (stateKey) {
        localStorage.setItem(stateKey, JSON.stringify(selectedColumns));
      }
      this.visibleColumns.set(selectedColumns);
      this.formVisible.set(false);
    },
  }));
}

import {
  ChangeDetectionStrategy,
  Component,
  inject,
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
import { RtlHelperService } from '~/services/rtl-helper.service';
import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';

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
  readonly rtlHelper = inject(RtlHelperService);
  readonly trackingService = inject(TrackingService);

  readonly columns = input.required<QueryTableColumn<TData>[]>();
  readonly visibleColumns = model.required<QueryTableColumn<TData>[]>();
  readonly selectedColumnsStateKey = input<string>();
  readonly resetColumnVisibility = output();

  readonly formVisible = model<boolean>(false);

  formGroup = new FormGroup({
    selectedColumns: new FormControl<QueryTableColumn<TData>[]>([], {
      nonNullable: true,
    }),
  });

  updateColumnVisibility = injectMutation(() => ({
    // We don't technically need a mutation here, but we're using one
    // so that we can easily reuse the form-sidebar component
    mutationFn: () => {
      const { selectedColumns } = this.formGroup.getRawValue();

      if (selectedColumns.length === 0) {
        return Promise.reject(
          new Error($localize`At least one column must be selected`),
        );
      }

      const visibleFieldNames = this.getFieldNameList(this.visibleColumns());
      const selectedFieldNames = this.getFieldNameList(selectedColumns);

      this.trackingService.trackEvent({
        category: TrackingCategory.manageTableSettings,
        action: TrackingAction.clickProceedButton,
        name: `columns:${visibleFieldNames === selectedFieldNames ? 'keep' : 'update'} to:${selectedFieldNames}`,
        value: selectedColumns.length,
      });

      return Promise.resolve(selectedColumns);
    },
    onSuccess: (selectedColumns) => {
      const stateKey = this.selectedColumnsStateKey();

      if (stateKey) {
        localStorage.setItem(stateKey, JSON.stringify(selectedColumns));
      }

      this.visibleColumns.set(selectedColumns);
      this.formVisible.set(false);
    },
  }));

  private getFieldNameList(fields: QueryTableColumn<TData>[]): string {
    const fieldNames = Array.from(
      new Set(fields.map((col) => col.field)).values(),
    );
    return fieldNames.sort().join(',');
  }

  showColumnManagement() {
    this.formGroup.patchValue({
      selectedColumns: this.visibleColumns(),
    });
    this.formVisible.set(true);

    this.trackingService.trackEvent({
      category: TrackingCategory.manageTableSettings,
      action: TrackingAction.clickManageTableButton,
      name: `table:${this.selectedColumnsStateKey() ?? 'unknown'}`,
    });
  }

  revertToDefault() {
    this.resetColumnVisibility.emit();
    this.formVisible.set(false);

    this.trackingService.trackEvent({
      category: TrackingCategory.manageTableSettings,
      action: TrackingAction.clickRevertToDefaultButton,
      name: `table:${this.selectedColumnsStateKey() ?? 'unknown'}`,
    });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DrawerModule } from 'primeng/drawer';
import { FocusTrapModule } from 'primeng/focustrap';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
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
    CheckboxModule,
    ReactiveFormsModule,
    FormsModule,
    DrawerModule,
    FormErrorComponent,
    FocusTrapModule,
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
  readonly formError = signal<string | undefined>(undefined);

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
    this.formError.set(undefined);

    this.trackingService.trackEvent({
      category: TrackingCategory.manageTableSettings,
      action: TrackingAction.clickManageTableButton,
    });
  }

  revertToDefault() {
    this.resetColumnVisibility.emit();
    this.formVisible.set(false);

    this.trackingService.trackEvent({
      category: TrackingCategory.manageTableSettings,
      action: TrackingAction.clickRevertToDefaultButton,
    });
  }

  private getFieldNames(fields: QueryTableColumn<TData>[]): string[] {
    const fieldNames = Array.from(
      new Set(fields.map((col) => col.field)).values(),
    );
    return fieldNames;
  }

  onFormSubmit(): void {
    let { selectedColumns } = this.formGroup.getRawValue();
    if (selectedColumns.length === 0) {
      this.formError.set($localize`At least one column must be selected`);
      return;
    }

    const selectedFieldNames = this.getFieldNames(selectedColumns);

    // update `selectedColumns` so the columns always appear in the same order in the table
    selectedColumns = this.columns().filter((col) =>
      selectedFieldNames.includes(col.field),
    );

    const visibleFieldNamesString = this.getFieldNames(this.visibleColumns())
      .sort()
      .join(',');
    const selectedFieldNamesString = selectedFieldNames.sort().join(',');

    this.trackingService.trackEvent({
      category: TrackingCategory.manageTableSettings,
      action: TrackingAction.clickProceedButton,
      name: `columns:${
        visibleFieldNamesString === selectedFieldNamesString ? 'keep' : 'update'
      } to:${selectedFieldNamesString}`,
      value: selectedColumns.length,
    });

    this.formError.set(undefined);
    const stateKey = this.selectedColumnsStateKey();
    if (stateKey) {
      localStorage.setItem(stateKey, JSON.stringify(selectedColumns));
    }
    this.visibleColumns.set(selectedColumns);
    this.formVisible.set(false);
  }
}

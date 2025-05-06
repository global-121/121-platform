import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardWithButtonComponent } from '~/components/card-with-button/card-with-button.component';

@Component({
  selector: 'app-import-excel-table-button',
  imports: [CardWithButtonComponent],
  templateUrl: './import-excel-table-button.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportExcelTableButtonComponent {
  readonly projectId = input.required<string>();

  importExcelTable() {
    console.log('Import Excel Table');
  }
}

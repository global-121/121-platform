import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';

@Component({
  selector: 'app-import-excel-table-button',
  imports: [CardWithLinkComponent],
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

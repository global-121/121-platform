import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import {
  PROJECT_ATTACHMENT_FILE_TYPE_ICONS,
  PROJECT_ATTACHMENT_FILE_TYPE_LABELS,
} from '~/domains/project/project.helper';
import { ProjectAttachment } from '~/domains/project/project.model';

@Component({
  selector: 'app-table-cell-activity',
  imports: [],
  template: `
    <span class="inline-flex items-center">
      <span class="inline w-6 leading-[0]"><i [class]="icon()"></i> </span>
      <span>{{ label() }}</span>
    </span>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellFileTypeComponent
  implements TableCellComponent<ProjectAttachment>
{
  readonly value = input.required<ProjectAttachment>();
  readonly context = input<never>();

  readonly label = computed(
    () => PROJECT_ATTACHMENT_FILE_TYPE_LABELS[this.value().fileType],
  );

  readonly icon = computed(
    () => PROJECT_ATTACHMENT_FILE_TYPE_ICONS[this.value().fileType],
  );
}

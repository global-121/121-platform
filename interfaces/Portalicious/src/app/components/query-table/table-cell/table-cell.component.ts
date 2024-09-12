import { ChangeDetectionStrategy, Component, InputSignal } from '@angular/core';

/**
 * Base class for table cells.
 *
 * Do not use this component directly.
 */
@Component({
  selector: 'app-abstract-table-cell-do-not-use',
  standalone: true,
  imports: [],
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class TableCellComponent<TDataType> extends Component {
  value: InputSignal<TDataType>;
}

import { ChangeDetectionStrategy, Component, InputSignal } from '@angular/core';

/**
 * Base class for table cells.
 *
 * Do not use this component directly.
 */
@Component({
  selector: 'app-abstract-table-cell-do-not-use',
  imports: [],
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class TableCellComponent<
  TDataType,
  TContextType = undefined,
> extends Component {
  readonly value: InputSignal<TDataType>;
  readonly context: InputSignal<TContextType>;
}

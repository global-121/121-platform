import { Component, InputSignal } from '@angular/core';

export interface TableCellComponent<TDataType> extends Component {
  value: InputSignal<TDataType>;
}

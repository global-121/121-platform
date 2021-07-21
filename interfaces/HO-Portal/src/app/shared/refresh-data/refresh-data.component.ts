import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-refresh-data',
  templateUrl: './refresh-data.component.html',
  styleUrls: ['./refresh-data.component.scss'],
})
export class RefreshDataComponent {
  @Input()
  public lastUpdated: Date | string;

  @Output()
  public refresh = new EventEmitter<void>();

  constructor() {}

  public doRefresh() {
    this.refresh.emit();
  }
}

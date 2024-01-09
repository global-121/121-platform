import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-refresh-data',
  templateUrl: './refresh-data.component.html',
  styleUrls: ['./refresh-data.component.scss'],
})
export class RefreshDataComponent {
  @Input()
  public locale: string = environment.defaultLocale;

  @Input()
  public lastUpdated: Date | string;

  @Output()
  public refresh = new EventEmitter<void>();

  public DateFormat = DateFormat;

  constructor() {}

  public doRefresh() {
    this.refresh.emit();
  }
}

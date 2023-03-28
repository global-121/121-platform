import { Component, Input } from '@angular/core';

export class TableItem {
  label: string;
  value: string;
}

@Component({
  selector: 'app-registration-page-table',
  templateUrl: './registration-page-table.component.html',
  styleUrls: ['./registration-page-table.component.scss'],
})
export class RegistrationPageTableComponent {
  @Input()
  public itemList: TableItem[] = [];

  constructor() {}
}

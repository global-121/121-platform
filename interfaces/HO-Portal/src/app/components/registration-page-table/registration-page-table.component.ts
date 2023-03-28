import { Component, Input, OnInit } from '@angular/core';

export class TableItem {
  label: string;
  value: string;
}

@Component({
  selector: 'app-registration-page-table',
  templateUrl: './registration-page-table.component.html',
  styleUrls: ['./registration-page-table.component.scss'],
})
export class RegistrationPageTableComponent implements OnInit {
  @Input()
  public itemList: TableItem[] = [];

  constructor() {}

  ngOnInit(): void {}
}

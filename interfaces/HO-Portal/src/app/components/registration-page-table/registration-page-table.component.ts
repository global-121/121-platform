import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

export class TableItem {
  label: string;
  value: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule],
  selector: 'app-registration-page-table',
  templateUrl: './registration-page-table.component.html',
  styleUrls: ['./registration-page-table.component.scss'],
})
export class RegistrationPageTableComponent {
  @Input()
  public itemList: TableItem[] = [];

  constructor() {}
}

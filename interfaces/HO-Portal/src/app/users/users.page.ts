import { Component } from '@angular/core';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage {
  public segment = 'users';
  public arr = new Array(3);
  public filterInput = '';

  constructor() {}

  segmentChanged(ev: any) {
    this.segment = ev.detail.value;
  }

  onInput(ev): void {
    this.filterInput = ev || '';
  }
}

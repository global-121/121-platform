import { Component } from '@angular/core';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage {
  public segment: string = 'users';
  public arr = new Array(3);
  constructor() {}

  segmentChanged(ev: any) {
    this.segment = ev.detail.value;
  }
}

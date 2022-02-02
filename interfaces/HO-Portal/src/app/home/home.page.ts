import { Component } from '@angular/core';
import Permission from '../auth/permission.enum';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  public Permission = Permission;
}

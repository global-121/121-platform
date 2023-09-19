import { Component, ViewChild } from '@angular/core';
import { ProgramsListComponent } from '../programs-list/programs-list.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('list')
  public list: ProgramsListComponent;

  constructor() {}

  public ionViewWillEnter() {
    // When returning to the home page, refresh the Programs-list
    this.list.ngOnInit();
  }
}

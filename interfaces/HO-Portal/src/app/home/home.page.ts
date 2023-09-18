import { Component, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('list')
  public list: any;

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      // When returning to the home page, refresh the Programs-list
      if (event instanceof NavigationEnd && event.url === '/home') {
        this.list.ngOnInit();
      }
    });
  }
}

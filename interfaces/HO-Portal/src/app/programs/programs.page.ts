import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-programs',
  templateUrl: 'programs.page.html',
  styleUrls: ['programs.page.scss']
})
export class ProgramsPage implements OnInit {
  private selectedItem: any;
  public items: Array<{ title: string; }> = [];

  constructor() {
    for (let i = 1; i < 13; i++) {
      this.items.push({
        title: 'Program ' + i,
      });
    }
  }

  ngOnInit() {
  }
}

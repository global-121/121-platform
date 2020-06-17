import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input()
  public title: string;

  public programId: number;

  constructor(private route: ActivatedRoute) {
    this.programId = this.route.snapshot.params.id;
  }

  ngOnInit() {}
}

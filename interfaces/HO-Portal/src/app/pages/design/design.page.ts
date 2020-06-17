import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-design',
  templateUrl: './design.page.html',
  styleUrls: ['./design.page.scss'],
})
export class DesignPage implements OnInit {
  public programId = this.route.snapshot.params.id;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {}
}

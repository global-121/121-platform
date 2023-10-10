import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-team',
  templateUrl: './team.page.html',
  styleUrls: ['./team.page.scss'],
})
export class AidWorkersPage {
  public programId = this.route.snapshot.params.id;

  constructor(private route: ActivatedRoute) {}
}

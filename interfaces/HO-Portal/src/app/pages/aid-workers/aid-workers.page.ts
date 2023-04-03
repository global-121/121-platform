import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-aid-workers',
  templateUrl: './aid-workers.page.html',
  styleUrls: ['./aid-workers.page.scss'],
})
export class AidWorkersPage {
  public programId = this.route.snapshot.params.id;

  constructor(private route: ActivatedRoute) {}
}

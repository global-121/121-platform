import { Component, OnInit } from '@angular/core';
import { ProgramPhase } from 'src/app/models/program.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-review-inclusion',
  templateUrl: './review-inclusion.page.html',
  styleUrls: ['./review-inclusion.page.scss'],
})
export class ReviewInclusionPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public thisPhase = ProgramPhase.reviewInclusion;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {}
}

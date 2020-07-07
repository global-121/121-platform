import { Component, OnInit } from '@angular/core';
import { ProgramPhase } from 'src/app/models/program.model';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-review-inclusion',
  templateUrl: './review-inclusion.page.html',
  styleUrls: ['./review-inclusion.page.scss'],
})
export class ReviewInclusionPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public thisPhase = ProgramPhase.reviewInclusion;
  public isReady: boolean;

  public userRole = this.authService.getUserRole();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {}

  ngOnInit() {}

  public onReady(state: boolean) {
    this.isReady = state;
  }
}

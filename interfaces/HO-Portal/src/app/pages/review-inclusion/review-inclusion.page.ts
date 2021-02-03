import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ExportType } from 'src/app/models/export-type.model';
import { NotificationType } from 'src/app/models/notification-type.model';
import { ProgramPhase } from 'src/app/models/program.model';

@Component({
  selector: 'app-review-inclusion',
  templateUrl: './review-inclusion.page.html',
  styleUrls: ['./review-inclusion.page.scss'],
})
export class ReviewInclusionPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public thisPhase = ProgramPhase.reviewInclusion;
  public isReady: boolean;

  public userRoles = this.authService.getUserRoles();

  public enumExportType = ExportType;
  public enumNotificationType = NotificationType;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {}

  ngOnInit() {}

  public onReady(state: boolean) {
    this.isReady = state;
  }
}

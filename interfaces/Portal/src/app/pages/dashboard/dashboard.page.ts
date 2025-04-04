import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public program: Program;
  public canViewMetrics: boolean;

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    private authService: AuthService,
  ) {}

  async ngOnInit() {
    this.program = await this.programsService.getProgramById(this.programId);

    this.canViewMetrics = await this.authService.hasPermission(
      this.programId,
      Permission.ProgramMetricsREAD,
    );
  }
}

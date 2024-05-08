import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ProgramTabsNavigationComponent } from '../../program/program-tabs-navigation/program-tabs-navigation.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    RouterModule,
    ProgramTabsNavigationComponent,
  ],
  selector: 'app-program-navigation',
  templateUrl: './program-navigation.component.html',
  styleUrls: ['./program-navigation.component.scss'],
})
export class ProgramNavigationComponent implements OnInit {
  public programId: number;

  public canViewMetrics: boolean;
  public canReadAidWorkers: boolean;
  public dashboardIsEnabled: boolean;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
  ) {
    this.programId = this.route.snapshot.params.id;
  }

  public async ngOnInit() {
    this.canReadAidWorkers = await this.authService.hasPermission(
      this.programId,
      Permission.AidWorkerProgramREAD,
    );
    this.canViewMetrics = await this.authService.hasPermission(
      this.programId,
      Permission.ProgramMetricsREAD,
    );

    const program = await this.programsService.getProgramById(this.programId);
    this.dashboardIsEnabled = !!program?.monitoringDashboardUrl;
  }
}

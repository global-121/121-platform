import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AppRoutes } from 'src/app/app-routes.enum';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { ProgramTab } from 'src/app/models/program.model';
import { ProgramTabService, Tab } from 'src/app/services/program-phase.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, RouterModule],
  selector: 'app-program-tabs-navigation',
  templateUrl: './program-tabs-navigation.component.html',
  styleUrls: ['./program-tabs-navigation.component.scss'],
})
export class ProgramTabsNavigationComponent implements OnInit {
  @Input()
  public programId: number;

  public AppRoutes = AppRoutes;

  public dashboardIsEnabled: boolean;

  public programTabs: Tab[];

  constructor(
    private authService: AuthService,
    private programTabService: ProgramTabService,
    private programsService: ProgramsServiceApiService,
  ) {}

  public async ngOnInit() {
    const program = await this.programsService.getProgramById(this.programId);
    const programTabs: Tab[] = await this.programTabService.getProgramTabs();

    const canReadAidWorkers = await this.authService.hasPermission(
      this.programId,
      Permission.AidWorkerProgramREAD,
    );

    const dashboardIsEnabled = !!program?.monitoringDashboardUrl;
    const canViewMetrics = await this.authService.hasPermission(
      this.programId,
      Permission.ProgramMetricsREAD,
    );

    this.programTabs = programTabs
      .map((item: Tab) => {
        if (item.name === ProgramTab.team) {
          item.disabled = !canReadAidWorkers;
        }

        if (item.name === ProgramTab.monitoring) {
          if (!dashboardIsEnabled) {
            return null;
          }

          item.disabled = !canViewMetrics && dashboardIsEnabled;
        }

        return item;
      })
      .filter(Boolean);
  }
}

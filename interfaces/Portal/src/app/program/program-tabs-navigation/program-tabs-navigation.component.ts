import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { ProgramTab } from 'src/app/models/program.model';
import {
  Phase,
  ProgramTabService,
} from 'src/app/services/program-phase.service';
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

  public dashboardIsEnabled: boolean;

  public ProgramTabs: Phase[];

  constructor(
    private authService: AuthService,
    private ProgramTabService: ProgramTabService,
    private programsService: ProgramsServiceApiService,
  ) {}

  public async ngOnInit() {
    const program = await this.programsService.getProgramById(this.programId);
    const ProgramTabs: Phase[] = await this.ProgramTabService.getPhases();

    const canReadAidWorkers = await this.authService.hasPermission(
      this.programId,
      Permission.AidWorkerProgramREAD,
    );

    const dashboardIsEnabled = !!program?.monitoringDashboardUrl;
    const canViewMetrics = await this.authService.hasPermission(
      this.programId,
      Permission.ProgramMetricsREAD,
    );

    this.ProgramTabs = ProgramTabs.map((item: Phase) => {
      if (item.name === ProgramTab.team) {
        item.disabled = !canReadAidWorkers;
      }

      if (item.name === ProgramTab.monitoring) {
        item.disabled = !canViewMetrics && dashboardIsEnabled;
      }

      return item;
    });
  }
}

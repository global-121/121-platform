import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { MonitoringPageLayoutComponent } from '~/components/monitoring-page-layout/monitoring-page-layout.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { DashboardIframeComponent } from '~/pages/project-monitoring-powerbi/components/monitoring-iframe/monitoring-iframe.component';

@Component({
  selector: 'app-project-monitoring-powerbi',
  imports: [DashboardIframeComponent, MonitoringPageLayoutComponent],
  templateUrl: './project-monitoring-powerbi.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMonitoringPowerbiPageComponent {
  // this is injected by the router
  readonly projectId = input.required<string>();

  readonly projectApiService = inject(ProjectApiService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));
}

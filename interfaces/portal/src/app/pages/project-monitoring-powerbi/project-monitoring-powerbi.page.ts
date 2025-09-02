import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { DashboardIframeComponent } from '~/pages/project-monitoring-powerbi/components/monitoring-iframe/monitoring-iframe.component';

@Component({
  selector: 'app-project-monitoring-powerbi',
  imports: [DashboardIframeComponent, PageLayoutMonitoringComponent],
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

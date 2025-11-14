import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { DashboardIframeComponent } from '~/pages/program-monitoring-powerbi/components/monitoring-iframe/monitoring-iframe.component';

@Component({
  selector: 'app-program-monitoring-powerbi',
  imports: [DashboardIframeComponent, PageLayoutMonitoringComponent],
  templateUrl: './program-monitoring-powerbi.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramMonitoringPowerbiPageComponent {
  // this is injected by the router
  readonly programId = input.required<string>();

  readonly programApiService = inject(ProgramApiService);

  program = injectQuery(this.programApiService.getProgram(this.programId));
}

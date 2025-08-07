import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { MenuItem } from 'primeng/api';
import { TabsModule } from 'primeng/tabs';

import { AppRoutes } from '~/app.routes';
import { TabsMenuComponent } from '~/components/tabs-menu/tabs-menu.component';

@Component({
  selector: 'app-monitoring-menu',
  imports: [TabsModule, TabsMenuComponent],
  templateUrl: './monitoring-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringMenuComponent {
  readonly projectId = input.required<string>();

  readonly navMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@page-title-project-monitoring-powerbi:PowerBI`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectMonitoring}/${AppRoutes.projectMonitoringPowerBI}`,
      icon: 'pi pi-chart-line',
    },
  ]);
}

import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { HealthApiService } from '~/domains/health/health.api.service';

@Component({
  selector: 'app-health-widget',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './health-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthWidgetComponent {
  private healthApiService = inject(HealthApiService);

  versionInfo = injectQuery(this.healthApiService.getVersionInfo());
}

import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental';
import { ApiEndpoints, ApiService } from '~/services/api.service';

@Component({
  selector: 'app-health-widget',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './health-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthWidgetComponent {
  apiService = inject(ApiService);
  queryClient = injectQueryClient();

  versionInfo = injectQuery(() => ({
    queryKey: [ApiEndpoints.versionInfo],
    queryFn: () => this.apiService.getVersionInfo(),
  }));
}

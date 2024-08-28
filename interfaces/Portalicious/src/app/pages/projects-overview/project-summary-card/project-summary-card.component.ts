import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { AppRoutes } from '~/app.routes';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { ProjectMetricContainerComponent } from '~/pages/projects-overview/project-metric-container/project-metric-container.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { ApiService } from '~/services/api.service';

@Component({
  selector: 'app-project-summary-card',
  standalone: true,
  imports: [
    CardModule,
    SkeletonModule,
    TranslatableStringPipe,
    RouterLink,
    CommonModule,
    CurrencyPipe,
    ProjectMetricContainerComponent,
    SkeletonInlineComponent,
  ],
  templateUrl: './project-summary-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSummaryCardComponent {
  private apiService = inject(ApiService);

  public id = input.required<number>();

  public project = injectQuery(this.apiService.getProject(this.id));
  public metrics = injectQuery(() => ({
    ...this.apiService.getProjectSummaryMetrics(this.id)(),
    enabled: !!this.project.data()?.id,
  }));
  public payments = injectQuery(() => ({
    ...this.apiService.getProjectPayments(this.id)(),
    enabled: !!this.project.data()?.id,
  }));
  projectLink = (projectId: number) => ['/', AppRoutes.project, projectId];

  public getLastPayment = computed(() => {
    const data = this.payments.data();
    if (!data) {
      return;
    }
    return data.sort((a, b) => (a.payment < b.payment ? 1 : -1))[0];
  });
}

import { getRandomInt } from '@121-service/src/utils/getRandomValue.helper';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { AppRoutes } from '~/app.routes';
import { Payment } from '~/models/payment.model';
import { ProjectMetricContainerComponent } from '~/pages/projects-overview/project-metric-container/project-metric-container.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { ApiEndpoints, ApiService } from '~/services/api.service';

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
  ],
  templateUrl: './project-summary-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSummaryCardComponent {
  private apiService = inject(ApiService);

  public id = input.required<number>();

  public randomWidth = `${getRandomInt(42, 98).toString()}%`;

  public project = injectQuery(() => ({
    queryKey: [ApiEndpoints.projects, this.id()],
    queryFn: () => this.apiService.getProjectById(this.id()),
  }));

  public metrics = injectQuery(() => ({
    queryKey: [ApiEndpoints.projects, this.id(), ApiEndpoints.projectsMetrics],
    queryFn: () => this.apiService.getProjectSummaryMetrics(this.id()),
    enabled: !!this.project.data()?.id,
  }));

  public payments = injectQuery(() => ({
    queryKey: [ApiEndpoints.projects, this.id(), ApiEndpoints.payments],
    queryFn: () => this.apiService.getPayments(this.id()),
    enabled: !!this.project.data()?.id,
  }));
  projectLink = (projectId: number) => ['/', AppRoutes.project, projectId];
  public getLastPayment(paymentData: Payment[] | undefined) {
    if (!paymentData) {
      return;
    }
    return paymentData.sort((a, b) => (a.payment < b.payment ? 1 : -1))[0];
  }
}

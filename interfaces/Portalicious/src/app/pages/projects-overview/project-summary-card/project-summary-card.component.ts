import { getRandomInt } from '@121-service/src/utils/getRandomValue.helper';
import { CommonModule, CurrencyPipe, NgTemplateOutlet } from '@angular/common';
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
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { ApiEndpoints, ApiService } from '~/services/api.service';

@Component({
  selector: 'app-project-summary-card',
  standalone: true,
  imports: [
    CardModule,
    SkeletonModule,
    TranslatableStringPipe,
    NgTemplateOutlet,
    RouterLink,
    CommonModule,
    CurrencyPipe,
  ],
  templateUrl: './project-summary-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSummaryCardComponent {
  private apiService = inject(ApiService);

  public id = input.required<number>();
  public index = input<number>();

  public randomWidth = `${getRandomInt(42, 98).toString()}%`;

  public project = injectQuery(() => ({
    queryKey: [ApiEndpoints.programs, this.id()],
    queryFn: () => this.apiService.getProjectById(this.id()),
  }));

  public metrics = injectQuery(() => ({
    queryKey: [ApiEndpoints.programs, this.id(), ApiEndpoints.programsMetrics],
    queryFn: () => this.apiService.getProjectSummaryMetrics(this.id()),
  }));

  public labels = {
    targetedPeople: $localize`Targeted people`,
    includedPeople: $localize`Included people`,
    totalBudget: $localize`Budget`,
    spentMoney: $localize`Cash disbursed`,
  };

  projectLink = (programId: number) => ['/', AppRoutes.project, programId];
}

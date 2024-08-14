import { getRandomInt } from '@121-service/src/utils/getRandomValue.helper';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-project-metric-container',
  standalone: true,
  imports: [SkeletonModule],
  templateUrl: './project-metric-container.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMetricContainerComponent {
  public pending = input.required<boolean>();
  public value = input<null | number | string>();
  public label = input<string>();

  public randomWidth = () => `${getRandomInt(42, 98).toString()}%`;
}

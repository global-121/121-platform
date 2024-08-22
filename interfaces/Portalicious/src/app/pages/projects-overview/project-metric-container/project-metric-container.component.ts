import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';

@Component({
  selector: 'app-project-metric-container',
  standalone: true,
  imports: [SkeletonModule, SkeletonInlineComponent],
  templateUrl: './project-metric-container.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMetricContainerComponent {
  public pending = input.required<boolean>();
  public value = input<null | number | string>();
  public label = input<string>();
}

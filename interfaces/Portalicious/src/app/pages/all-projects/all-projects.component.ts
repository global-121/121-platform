import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HealthWidgetComponent } from '~/components/health-widget/health-widget.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-all-projects',
  standalone: true,
  imports: [PageLayoutComponent, HealthWidgetComponent, RouterLink],
  templateUrl: './all-projects.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllProjectsComponent {}

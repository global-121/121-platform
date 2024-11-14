import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-breadcrumbs-title',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './breadcrumbs-title.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsTitleComponent {
  parentLink = input<RouterLink['routerLink']>();
  parentTitle = input<string>();
  childTitle = input<string>();
}

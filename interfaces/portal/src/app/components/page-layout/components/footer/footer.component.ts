import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AppRoutes } from '~/app.routes';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  AppRoutes = AppRoutes;
  currentYear: number = new Date().getFullYear();
}

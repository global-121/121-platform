import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './users.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent {}

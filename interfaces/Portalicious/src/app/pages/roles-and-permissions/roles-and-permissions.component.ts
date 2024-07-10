import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-roles-and-permissions',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './roles-and-permissions.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesAndPermissionsComponent {}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-ellipsis-menu',
  imports: [ButtonModule, MenuModule],
  templateUrl: './ellipsis-menu.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EllipsisMenuComponent {
  readonly menuItems = input.required<MenuItem[]>();
}

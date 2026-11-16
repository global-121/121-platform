import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { MenuItem } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { MenuModule } from '@openng/optimus-ui/menu';

@Component({
  selector: 'app-ellipsis-menu',
  imports: [ButtonModule, MenuModule],
  templateUrl: './ellipsis-menu.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EllipsisMenuComponent {
  readonly menuItems = input.required<MenuItem[]>();
  readonly orientation = input<'horizontal' | 'vertical'>('vertical');
}

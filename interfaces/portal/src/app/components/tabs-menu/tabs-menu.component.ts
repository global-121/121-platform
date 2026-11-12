import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MenuItem } from '@openng/optimus-ui/api';
import { TabsModule } from '@openng/optimus-ui/tabs';

@Component({
  selector: 'app-tabs-menu',
  imports: [TabsModule, RouterLink, RouterLinkActive],
  templateUrl: './tabs-menu.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsMenuComponent {
  readonly menuItems = input.required<MenuItem[]>();
}

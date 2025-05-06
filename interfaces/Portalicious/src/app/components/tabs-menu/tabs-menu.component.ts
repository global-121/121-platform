import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-tabs-menu',
  imports: [TabsModule, RouterLink, RouterLinkActive, MenuModule],
  templateUrl: './tabs-menu.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsMenuComponent {
  readonly menuItems = input.required<MenuItem[]>();
  readonly menuOpen = model(false);
}

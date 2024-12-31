import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';

import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-button-menu',
  imports: [ButtonModule, MenuModule, NgClass],
  templateUrl: './button-menu.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonMenuComponent {
  label = input.required<string>();
  menuItems = input.required<MenuItem[]>();
  icon = input<string>();
  outlined = input<boolean>(false);
  plain = input<boolean>(false);
  text = input<boolean>(false);
  size = input<'large' | 'small'>();

  menuOpen = model(false);
}

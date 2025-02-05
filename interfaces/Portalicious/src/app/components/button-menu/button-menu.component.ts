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
  readonly label = input.required<string>();
  readonly menuItems = input.required<MenuItem[]>();
  readonly icon = input<string>();
  readonly outlined = input<boolean>(false);
  readonly plain = input<boolean>(false);
  readonly text = input<boolean>(false);
  readonly size = input<'large' | 'small'>();

  readonly menuOpen = model(false);
}

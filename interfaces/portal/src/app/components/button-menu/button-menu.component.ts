import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';

import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';

import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-button-menu',
  imports: [ButtonModule, MenuModule, NgClass],
  templateUrl: './button-menu.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonMenuComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly label = input.required<string>();
  readonly menuItems = input.required<MenuItem[]>();
  readonly icon = input<string>();
  readonly outlined = input<boolean>(false);
  readonly plain = input<boolean>(false);
  readonly text = input<boolean>(false);
  readonly size = input<'large' | 'small'>();

  readonly menuOpen = model(false);

  // Filter out items without command or visible children as these than look like a subheader without any action or children or routerlink
  readonly filteredMenuItems = computed(() =>
    this.menuItems()
      .filter(
        (item) =>
          // Filter out items that are explicitly marked as invisible
          item.visible !== false,
      )
      .filter((item) => {
        const hasCommand = !!item.command;

        const hasVisibleChildren =
          item.items?.some((child) => child.visible !== false) ?? false;

        const hasRouteLink = !!item.routerLink;

        return hasCommand || hasVisibleChildren || hasRouteLink;
      }),
  );
}

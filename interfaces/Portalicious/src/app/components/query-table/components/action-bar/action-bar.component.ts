import {
  ChangeDetectionStrategy,
  Component,
  inject,
  LOCALE_ID,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';

import { Locale } from '~/utils/locale';

@Component({
  selector: 'app-action-bar',
  standalone: true,
  imports: [ButtonModule, ButtonGroupModule],
  templateUrl: './action-bar.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionBarComponent {
  locale = inject<Locale>(LOCALE_ID);
}

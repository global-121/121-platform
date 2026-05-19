import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Url } from 'url';

@Component({
  selector: 'app-external-link',
  imports: [],
  templateUrl: './external-link.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalLinkComponent {
  readonly href = input.required<RouterLink['routerLink'] | Url>();
  readonly label = input.required<string>();
}

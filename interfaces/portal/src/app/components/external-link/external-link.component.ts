import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-external-link',
  imports: [],
  templateUrl: './external-link.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalLinkComponent {
  readonly href = input.required<string>();
  readonly label = input.required<string>();
}

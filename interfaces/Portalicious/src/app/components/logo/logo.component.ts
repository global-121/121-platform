import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [],
  templateUrl: './logo.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  programTitle = input<string>();
}

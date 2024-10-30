import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-change-status',
  standalone: true,
  imports: [],
  templateUrl: './change-status.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeStatusComponent {

}

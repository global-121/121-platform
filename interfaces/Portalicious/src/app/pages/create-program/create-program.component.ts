import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-create-program',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './create-program.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProgramComponent {}

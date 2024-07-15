import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './user-settings.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsComponent {}

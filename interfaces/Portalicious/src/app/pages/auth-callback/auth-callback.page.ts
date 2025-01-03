import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';

import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  imports: [PageLayoutComponent, ProgressSpinnerModule],
  templateUrl: './auth-callback.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallbackPageComponent implements OnInit {
  private authService = inject(AuthService);

  ngOnInit() {
    this.authService.handleAuthCallback();
  }
}

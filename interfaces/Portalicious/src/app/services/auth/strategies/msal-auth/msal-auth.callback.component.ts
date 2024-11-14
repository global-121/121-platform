import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';

import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subscription } from 'rxjs';

import { AppRoutes } from '~/app.routes';
import { AuthService } from '~/services/auth.service';
import { getReturnUrlFromLocalStorage } from '~/utils/local-storage';

@Component({
  selector: 'app-msal-auth.callback',
  standalone: true,
  imports: [ProgressSpinnerModule],
  templateUrl: './msal-auth.callback.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MsalAuthCallbackComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private msalService = inject(MsalService);
  private msalSubscription: Subscription | undefined;

  constructor() {
    this.msalSubscription = this.msalService
      .handleRedirectObservable()
      .subscribe((data: AuthenticationResult | null) => {
        if (!data) {
          return;
        }
        void this.authService
          .processAzureCallback()
          .then(async () => {
            const returnUrl = getReturnUrlFromLocalStorage();
            if (returnUrl) {
              await this.router.navigate([returnUrl]);
            } else {
              await this.router.navigate(['/', AppRoutes.users]);
            }
          })
          .catch(async () => {
            await this.router.navigate(['/', AppRoutes.login]);
          });
      });
  }

  ngOnDestroy(): void {
    if (this.msalSubscription) {
      this.msalSubscription.unsubscribe();
    }
  }
}

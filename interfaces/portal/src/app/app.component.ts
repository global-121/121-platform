import {
  ChangeDetectionStrategy,
  Component,
  inject,
  isDevMode,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import KonamiCode from 'konami-code-js';
import { MessageService } from 'primeng/api';
import { ToastModule, ToastPositionType } from 'primeng/toast';
import { Subscription } from 'rxjs';

import { AppRoutes } from '~/app.routes';
import { AuthService } from '~/services/auth.service';
import { LogService } from '~/services/log.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { environment } from '~environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  providers: [
    MessageService, // Needed by the ToastModule
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  readonly rtlHelper = inject(RtlHelperService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private authSubscriptions: Subscription[] = [];

  readonly toastKey = ToastService.TOAST_KEY;
  readonly toastPosition = ('top-' +
    this.rtlHelper.createPosition('end')()) as ToastPositionType;

  private readonly logService = inject(LogService);

  ngOnInit() {
    this.logService.setupApplicationInsights();

    this.authSubscriptions = this.authService.initializeSubscriptions();

    if (!environment.production || isDevMode()) {
      // Enable dev/debugging-styles
      document.documentElement.classList.add('dev');
    }

    new KonamiCode(() => {
      void this.router.navigate(['/', AppRoutes.snake]);
    });
  }

  ngOnDestroy(): void {
    for (const subscription of this.authSubscriptions) {
      subscription.unsubscribe();
    }
  }
}

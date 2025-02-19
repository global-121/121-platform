import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import KonamiCode from 'konami-code-js';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';

import { AppRoutes } from '~/app.routes';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private authSubscriptions: Subscription[] = [];
  toastKey = ToastService.TOAST_KEY;

  ngOnInit() {
    this.authSubscriptions = this.authService.initializeSubscriptions();
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

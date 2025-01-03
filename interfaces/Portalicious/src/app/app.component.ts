import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';

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
  private authSubscriptions: Subscription[] = [];
  toastKey = ToastService.TOAST_KEY;

  ngOnInit() {
    this.authSubscriptions = this.authService.initializeSubscriptions();
  }

  ngOnDestroy(): void {
    for (const subscription of this.authSubscriptions) {
      subscription.unsubscribe();
    }
  }
}

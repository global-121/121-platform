import { FormatWidth, getLocaleDateFormat } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  LOCALE_ID,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MessageService, PrimeNGConfig } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';

import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import { Locale } from '~/utils/locale';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  providers: [
    MessageService, // Needed by the ToastModule
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  private primengConfig = inject(PrimeNGConfig);
  private locale = inject<Locale>(LOCALE_ID);
  private readonly authService = inject(AuthService);
  private authSubscriptions: Subscription[] = [];
  toastKey = ToastService.TOAST_KEY;

  ngOnInit() {
    this.primengConfig.setTranslation({
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      dateFormat: getLocaleDateFormat(
        this.locale,
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        FormatWidth.Short,
      ).toLowerCase(), // toLowerCase because PrimeNG otherwise interprets DD and MM as "name of day" and "name of month"
      apply: $localize`:@@generic-apply:Apply`,
      clear: $localize`:@@generic-clear:Clear`,
    });

    this.authSubscriptions = this.authService.initializeSubscriptions();
  }

  ngOnDestroy(): void {
    for (const subscription of this.authSubscriptions) {
      subscription.unsubscribe();
    }
  }
}

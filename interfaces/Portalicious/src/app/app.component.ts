import { FormatWidth, getLocaleDateFormat } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  LOCALE_ID,
  OnInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MessageService, PrimeNGConfig } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

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
export class AppComponent implements OnInit {
  toastKey = ToastService.TOAST_KEY;
  primengConfig = inject(PrimeNGConfig);
  locale = inject<Locale>(LOCALE_ID);

  ngOnInit() {
    this.primengConfig.setTranslation({
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      dateFormat: getLocaleDateFormat(
        this.locale,
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        FormatWidth.Short,
      ).toLowerCase(), // toLowerCase because PrimeNG otherwise interprets DD and MM as "name of day" and "name of month"
    });
  }
}

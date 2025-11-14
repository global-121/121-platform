import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { MenuItem } from 'primeng/api';
import { TabsModule } from 'primeng/tabs';

import { AppRoutes } from '~/app.routes';
import { TabsMenuComponent } from '~/components/tabs-menu/tabs-menu.component';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-payment-menu',
  imports: [TabsModule, TabsMenuComponent],
  templateUrl: './payment-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMenuComponent {
  readonly programId = input.required<string>();
  readonly paymentId = input.required<string>();

  readonly authService = inject(AuthService);

  readonly navMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@page-title-program-transfer-list:Transfer list`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programPayments}/${this.paymentId()}/${AppRoutes.programPaymentTransferList}`,
      icon: 'pi pi-table',
    },
    {
      label: $localize`:@@page-title-program-payment-log:Payment log`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programPayments}/${this.paymentId()}/${AppRoutes.programPaymentLog}`,
      icon: 'pi pi-list',
    },
  ]);
}

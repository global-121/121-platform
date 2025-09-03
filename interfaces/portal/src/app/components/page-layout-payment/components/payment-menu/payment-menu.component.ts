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
  readonly projectId = input.required<string>();
  readonly paymentId = input.required<string>();

  readonly authService = inject(AuthService);

  readonly navMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@page-title-project-transfer-list:Transfer list`,
      routerLink: `/${AppRoutes.project}/${this.projectId()}/${AppRoutes.projectPayments}/${this.paymentId()}/${AppRoutes.projectPaymentTransferList}`,
      icon: 'pi pi-table',
    },
    {
      label: $localize`:@@page-title-project-payment-log:Payment log`,
      routerLink: `/${AppRoutes.project}/${this.projectId()}/${AppRoutes.projectPayments}/${this.paymentId()}/${AppRoutes.projectPaymentLog}`,
      icon: 'pi pi-list',
    },
  ]);
}

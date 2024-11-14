import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { AppRoutes } from '~/app.routes';
import { BreadcrumbsTitleComponent } from '~/components/page-layout/components/breadcrumbs-title/breadcrumbs-title.component';
import { PageLayoutTitleAndActionsComponent } from '~/components/page-layout/components/page-layout-title-and-actions/page-layout-title-and-actions.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { Locale } from '~/utils/locale';

@Component({
  selector: 'app-payment-header',
  standalone: true,
  imports: [PageLayoutTitleAndActionsComponent, BreadcrumbsTitleComponent],
  templateUrl: './payment-header.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentHeaderComponent {
  readonly paymentApiService = inject(PaymentApiService);
  private locale = inject<Locale>(LOCALE_ID);

  projectId = input.required<number>();
  paymentId = input.required<number>();

  payments = injectQuery(this.paymentApiService.getPayments(this.projectId));

  paymentDate = computed(() => {
    if (!this.paymentId() || !this.projectId() || this.payments.isPending()) {
      return '';
    }

    const date = this.payments
      .data()
      ?.find(
        (payment) => payment.payment === Number(this.paymentId()),
      )?.paymentDate;

    return new DatePipe(this.locale).transform(date, 'short') ?? '';
  });

  paymentTitle = computed(() => {
    return $localize`Payment` + ' ' + this.paymentDate();
  });

  allPaymentsLink = computed(() => [
    '/',
    AppRoutes.project,
    this.projectId(),
    AppRoutes.projectPayments,
  ]);
}

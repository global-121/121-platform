import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

import { FooterComponent } from '~/components/page-layout/components/footer/footer.component';
import { HeaderComponent } from '~/components/page-layout/components/header/header.component';
import { PageLayoutTitleAndActionsComponent } from '~/components/page-layout/components/page-layout-title-and-actions/page-layout-title-and-actions.component';
import { PaymentHeaderComponent } from '~/components/page-layout/components/payment-header/payment-header.component';
import { ProjectMenuComponent } from '~/components/page-layout/components/project-menu/project-menu.component';
import { RegistrationHeaderComponent } from '~/components/page-layout/components/registration-header/registration-header.component';
import { RegistrationMenuComponent } from '~/components/page-layout/components/registration-menu/registration-menu.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [
    HeaderComponent,
    ProjectMenuComponent,
    FooterComponent,
    RegistrationHeaderComponent,
    RegistrationMenuComponent,
    CardModule,
    PageLayoutTitleAndActionsComponent,
    MessageModule,
    PaymentHeaderComponent,
  ],
  templateUrl: './page-layout.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutComponent {
  readonly registrationApiService = inject(RegistrationApiService);
  readonly projectApiService = inject(ProjectApiService);
  readonly paymentApiService = inject(PaymentApiService);

  pageTitle = input<string>();
  projectId = input<number>();
  registrationId = input<number>();
  paymentId = input<number>();

  project = injectQuery(this.projectApiService.getProject(this.projectId));

  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );

  payment = injectQuery(
    this.paymentApiService.getPayment(this.projectId, this.paymentId),
  );
}

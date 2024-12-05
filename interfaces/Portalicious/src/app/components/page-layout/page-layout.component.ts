import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

import { BreadcrumbsTitleComponent } from '~/components/page-layout/components/breadcrumbs-title/breadcrumbs-title.component';
import { FooterComponent } from '~/components/page-layout/components/footer/footer.component';
import { HeaderComponent } from '~/components/page-layout/components/header/header.component';
import { PageLayoutTitleAndActionsComponent } from '~/components/page-layout/components/page-layout-title-and-actions/page-layout-title-and-actions.component';
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
    BreadcrumbsTitleComponent,
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
  parentPageTitle = input<string>();
  parentPageLink = input<RouterLink['routerLink']>();

  projectId = input<number>();
  registrationId = input<number>();
  paymentId = input<number>();

  isPending = input<boolean>();

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

  pageLoadError = computed(() => {
    if (this.project.isError()) {
      return $localize`Project not found. Please check the URL and try again.`;
    }

    if (this.registration.isError()) {
      return $localize`Registration not found. Please check the URL and try again.`;
    }

    if (this.payment.isError()) {
      return $localize`Payment not found. Please check the URL and try again.`;
    }

    return undefined;
  });
}

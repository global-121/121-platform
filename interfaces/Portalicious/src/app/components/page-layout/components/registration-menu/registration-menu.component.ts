import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { TabMenuModule } from 'primeng/tabmenu';
import { AppRoutes } from '~/app.routes';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';

@Component({
  selector: 'app-registration-menu',
  standalone: true,
  imports: [TabMenuModule],
  templateUrl: './registration-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationMenuComponent {
  readonly registrationApiService = inject(RegistrationApiService);
  readonly projectApiService = inject(ProjectApiService);

  projectId = input.required<number>();
  registrationId = input.required<number>();
  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );
  project = injectQuery(this.projectApiService.getProject(this.projectId));

  navMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@page-title-project-registrations-activity-log:Activity-log`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectRegistration}/${this.registrationId().toString()}/activity-log`,
      icon: 'pi pi-list',
    },
    {
      label: $localize`:@@page-title-project-registrations-personal-information:Personal-information`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectRegistration}/${this.registrationId().toString()}/personal-information`,
      icon: 'pi pi-card',
    },
    {
      label: $localize`:@@page-title-project-registrations-debit-cards:Debit-cards`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectRegistration}/${this.registrationId().toString()}/debit-cards`,
      icon: 'pi pi-credit-card',
      visible:
        this.registration.data()?.financialServiceProvider ===
        FinancialServiceProviderName.intersolveVisa,
    },
  ]);
}

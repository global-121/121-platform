import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { TabsModule } from 'primeng/tabs';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';

import { AppRoutes } from '~/app.routes';
import { TabsMenuComponent } from '~/components/tabs-menu/tabs-menu.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';

@Component({
  selector: 'app-registration-menu',
  imports: [TabsModule, TabsMenuComponent],
  templateUrl: './registration-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationMenuComponent {
  readonly projectId = input.required<string>();
  readonly registrationId = input.required<string>();

  readonly registrationApiService = inject(RegistrationApiService);
  readonly projectApiService = inject(ProjectApiService);

  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );
  project = injectQuery(this.projectApiService.getProject(this.projectId));

  readonly navMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@page-title-project-registrations-activity-log:Activity log`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectRegistrations}/${this.registrationId().toString()}/${AppRoutes.projectRegistrationActivityLog}`,
      icon: 'pi pi-list',
    },
    {
      label: $localize`:@@page-title-project-registrations-personal-information:Personal information`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectRegistrations}/${this.registrationId().toString()}/${AppRoutes.projectRegistrationPersonalInformation}`,
      icon: 'pi pi-id-card',
    },
    {
      label: $localize`:@@page-title-project-registrations-debit-cards:Debit cards`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectRegistrations}/${this.registrationId().toString()}/${AppRoutes.projectRegistrationDebitCards}`,
      icon: 'pi pi-credit-card',
      visible: this.registration.data()?.fspName === Fsps.intersolveVisa,
    },
  ]);
}

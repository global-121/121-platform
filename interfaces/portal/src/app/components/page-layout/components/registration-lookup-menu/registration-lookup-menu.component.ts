import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';

import { TabsMenuComponent } from '~/components/tabs-menu/tabs-menu.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { registrationLink } from '~/domains/registration/registration.helper';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-registration-lookup-menu',
  imports: [TabsMenuComponent],
  templateUrl: './registration-lookup-menu.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationLookupMenuComponent {
  readonly phonenumber = input.required<string>();

  readonly projectApiService = inject(ProjectApiService);
  readonly registrationApiService = inject(RegistrationApiService);
  readonly translatableStringService = inject(TranslatableStringService);

  assignedProjects = injectQuery(this.projectApiService.getAssignedProjects());
  registrations = injectQuery(
    this.registrationApiService.getRegistrationsByPhonenumber({
      phonenumber: this.phonenumber,
    }),
  );

  readonly registrationMenuItems = computed<MenuItem[]>(() => {
    const menuItems: MenuItem[] = [];

    if (
      !this.assignedProjects.isSuccess() ||
      !this.registrations.isSuccess() ||
      this.registrations.data().length <= 1
    ) {
      return menuItems;
    }

    for (const registration of this.registrations.data()) {
      const project = this.assignedProjects.data()[registration.projectId];

      if (!project) {
        continue;
      }

      menuItems.push({
        label: `${registration.name ?? ''} - ${this.translatableStringService.translate(project.titlePortal) ?? ''}`,
        routerLink: registrationLink({
          registrationId: registration.id,
          projectId: project.id,
        }),
      });
    }

    return menuItems;
  });
}

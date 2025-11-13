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
import { ProgramApiService } from '~/domains/program/program.api.service';
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

  readonly programApiService = inject(ProgramApiService);
  readonly registrationApiService = inject(RegistrationApiService);
  readonly translatableStringService = inject(TranslatableStringService);

  assignedPrograms = injectQuery(this.programApiService.getAssignedPrograms());
  registrations = injectQuery(
    this.registrationApiService.getRegistrationsByPhonenumber({
      phonenumber: this.phonenumber,
    }),
  );

  readonly registrationMenuItems = computed<MenuItem[]>(() => {
    const menuItems: MenuItem[] = [];

    if (
      !this.assignedPrograms.isSuccess() ||
      !this.registrations.isSuccess() ||
      this.registrations.data().length <= 1
    ) {
      return menuItems;
    }

    for (const registration of this.registrations.data()) {
      const program = this.assignedPrograms.data()[registration.programId];

      if (!program) {
        continue;
      }

      menuItems.push({
        label: `${registration.name ?? ''} - ${this.translatableStringService.translate(program.titlePortal) ?? ''}`,
        routerLink: registrationLink({
          registrationId: registration.id,
          programId: program.id,
        }),
      });
    }

    return menuItems;
  });
}

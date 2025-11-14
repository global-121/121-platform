import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { registrationLink } from '~/domains/registration/registration.helper';
import { RegistrationLookupService } from '~/services/registration-lookup.service';

@Component({
  selector: 'app-registration-lookup',
  imports: [PageLayoutComponent],
  templateUrl: './registration-lookup.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationLookupPageComponent {
  readonly registrationApiService = inject(RegistrationApiService);
  readonly registrationLookupService = inject(RegistrationLookupService);
  readonly router = inject(Router);

  registrations = injectQuery(() => ({
    ...this.registrationApiService.getRegistrationsByPhonenumber({
      phonenumber: this.registrationLookupService.phonenumber as Signal<string>,
    })(),
    enabled: () => this.registrationLookupService.isActive(),
    // always fetch the latest data
    staleTime: 0,
  }));

  checkRegistrationsCount = effect(() => {
    if (
      this.registrations.isSuccess() &&
      this.registrations.data().length === 1
    ) {
      // if only one registration is found, navigate directly to the page for that registration
      const registration = this.registrations.data()[0];

      void this.router.navigate(
        registrationLink({
          programId: registration.programId,
          registrationId: registration.id,
        }),
        {
          queryParamsHandling: 'preserve',
        },
      );
    }
  });
}

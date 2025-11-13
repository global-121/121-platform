import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { registrationLink } from '~/domains/registration/registration.helper';

@Component({
  selector: 'app-registration-by-reference-id',
  imports: [PageLayoutComponent, ProgressSpinnerModule],
  templateUrl: './registration-by-reference-id.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationByReferenceIdPageComponent {
  readonly programId = input.required<string>();
  readonly referenceId = input.required<string>();

  readonly registrationApiService = inject(RegistrationApiService);
  readonly router = inject(Router);

  readonly paginateQuery = computed(() => ({
    filter: {
      referenceId: this.referenceId(),
    },
  }));

  protected registrations = injectQuery(
    this.registrationApiService.getManyByQuery(
      this.programId,
      this.paginateQuery,
    ),
  );

  redirectToRegistrationPage = effect(() => {
    if (
      this.registrations.isSuccess() &&
      this.registrations.data().data.length === 1
    ) {
      const registration = this.registrations.data().data[0];

      void this.router.navigate(
        registrationLink({
          programId: registration.programId,
          registrationId: registration.id,
        }),
      );
    }
  });
}

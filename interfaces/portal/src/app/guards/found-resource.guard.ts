import { inject, signal } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { QueryClient } from '@tanstack/angular-query-experimental';

import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';

export type FoundResourceGuardType = 'payment' | 'project' | 'registration';

export const FOUND_RESOURCE_GUARD_QUERY_KEY = 'couldNotFindResource';

export const foundResourceGuard: (
  resourceType: FoundResourceGuardType,
) => CanActivateFn = (resourceType: FoundResourceGuardType) =>
  async function projectPermissionsCanActivateFn(
    route: ActivatedRouteSnapshot,
  ) {
    const queryClient = inject(QueryClient);
    const router = inject(Router);

    const registrationApiService = inject(RegistrationApiService);
    const projectApiService = inject(ProjectApiService);
    const paymentApiService = inject(PaymentApiService);

    let foundResource = false;

    try {
      if (resourceType === 'registration') {
        const registration = await queryClient.fetchQuery(
          registrationApiService.getRegistrationById(
            signal(route.params.projectId),
            signal(route.params.registrationId),
          )(),
        );

        foundResource = !!registration;
      } else if (resourceType === 'payment') {
        const payments = await queryClient.fetchQuery({
          ...paymentApiService.getPayments(signal(route.params.projectId))(),
          staleTime: 0,
        });

        foundResource = !!payments.find(
          (payment) =>
            payment.paymentId === parseInt(route.params.paymentId as string),
        );
      } else {
        const project = await queryClient.fetchQuery(
          projectApiService.getProject(signal(route.params.projectId))(),
        );

        foundResource = !!project;
      }
    } catch {
      foundResource = false;
    }

    if (foundResource) {
      return true;
    }

    return router.createUrlTree(['/'], {
      queryParams: {
        [FOUND_RESOURCE_GUARD_QUERY_KEY]: resourceType,
      },
    });
  };

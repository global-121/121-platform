import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { AppRoutes } from '~/app.routes';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';

@Component({
  selector: 'app-project-registrations',
  standalone: true,
  imports: [PageLayoutComponent, RouterLink],
  templateUrl: './project-registrations.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationsComponent {
  // this is injected by the router
  projectId = input.required<number>();

  private registrationApiService = inject(RegistrationApiService);

  registrations = injectQuery(
    this.registrationApiService.getManyByQuery(this.projectId),
  );

  registrationLink = (registrationId: number) => [
    '/',
    AppRoutes.project,
    this.projectId(),
    AppRoutes.projectRegistrations,
    registrationId,
  ];
}

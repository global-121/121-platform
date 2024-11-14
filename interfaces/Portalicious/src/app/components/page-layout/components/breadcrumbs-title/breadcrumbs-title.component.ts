import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { AppRoutes } from '~/app.routes';

@Component({
  selector: 'app-breadcrumbs-title',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './breadcrumbs-title.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsTitleComponent {
  projectId = input.required<number>();
  registrationId = input<number>();
  registrationName = input<string>();
  paymentDate = input<string>();

  parentLink = computed(() => {
    const base = `/${AppRoutes.project}/${this.projectId().toString()}`;

    if (this.registrationId()) {
      return `${base}/${AppRoutes.projectRegistrations}`;
    }

    if (this.paymentDate()) {
      return `${base}/${AppRoutes.projectPayments}`;
    }

    return base;
  });

  parentTitle = computed(() => {
    if (this.registrationId()) {
      return $localize`All Registrations`;
    }

    if (this.paymentDate()) {
      return $localize`All Payments`;
    }

    return '';
  });

  childTitle = computed(() => {
    if (this.registrationId() && this.registrationName()) {
      const localized = $localize`Reg. #`;
      return `${localized}${this.registrationId()?.toString() ?? ''} - ${this.registrationName() ?? ''}`;
    }

    if (this.paymentDate()) {
      const localized = $localize`Payment`;
      return `${localized} ${this.paymentDate() ?? ''}`;
    }

    return '';
  });
}

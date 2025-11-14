import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { SvgIconComponent } from 'angular-svg-icon';
import { TooltipModule } from 'primeng/tooltip';

import { TopPageBannerComponent } from '~/components/top-page-banner/top-page-banner.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { registrationLink } from '~/domains/registration/registration.helper';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-registration-duplicates-banner',
  imports: [
    SvgIconComponent,
    RouterLink,
    TooltipModule,
    TopPageBannerComponent,
  ],
  templateUrl: './registration-duplicates-banner.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationDuplicatesBannerComponent {
  readonly registrationApiService = inject(RegistrationApiService);
  readonly router = inject(Router);
  readonly translatableStringService = inject(TranslatableStringService);

  readonly programId = input.required<string>();
  readonly registrationReferenceId = input<string>();

  duplicates = injectQuery(() => ({
    ...this.registrationApiService.getDuplicates({
      programId: this.programId,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guaranteed by enabled
      referenceId: this.registrationReferenceId()!,
    })(),
    enabled: !!this.registrationReferenceId(),
  }));

  registrationLink = (registrationId: number | string) =>
    registrationLink({ programId: this.programId(), registrationId });
}

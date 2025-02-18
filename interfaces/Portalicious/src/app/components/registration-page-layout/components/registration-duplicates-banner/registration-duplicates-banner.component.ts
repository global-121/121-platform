import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SvgIconComponent } from 'angular-svg-icon';
import { TooltipModule } from 'primeng/tooltip';

import { registrationLink } from '~/domains/registration/registration.helper';
import { DuplicatesResult } from '~/domains/registration/registration.model';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-registration-duplicates-banner',
  imports: [SvgIconComponent, RouterLink, TooltipModule, NgClass],
  templateUrl: './registration-duplicates-banner.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationDuplicatesBannerComponent {
  readonly translatableStringService = inject(TranslatableStringService);
  readonly router = inject(Router);

  readonly projectId = input.required<string>();
  readonly duplicates = input.required<DuplicatesResult[]>();
  readonly loading = input.required<boolean>();

  registrationLink = (registrationId: number | string) =>
    registrationLink({ projectId: this.projectId(), registrationId });
}

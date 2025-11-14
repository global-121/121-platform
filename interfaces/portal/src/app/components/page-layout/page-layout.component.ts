import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';

import { FooterComponent } from '~/components/page-layout/components/footer/footer.component';
import { HeaderComponent } from '~/components/page-layout/components/header/header.component';
import { ProgramMenuComponent } from '~/components/page-layout/components/program-menu/program-menu.component';
import { RegistrationLookupMenuComponent } from '~/components/page-layout/components/registration-lookup-menu/registration-lookup-menu.component';
import {
  FOUND_RESOURCE_GUARD_QUERY_KEY,
  FoundResourceGuardType,
} from '~/guards/found-resource.guard';
import { PERMISSION_DENIED_QUERY_KEY } from '~/guards/program-permissions-guard';
import { RegistrationLookupService } from '~/services/registration-lookup.service';
import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-page-layout',
  imports: [
    HeaderComponent,
    ProgramMenuComponent,
    FooterComponent,
    CardModule,
    MessageModule,
    SkeletonModule,
    RouterLink,
    RegistrationLookupMenuComponent,
  ],
  templateUrl: './page-layout.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly route = inject(ActivatedRoute);
  readonly registrationLookupService = inject(RegistrationLookupService);

  readonly pageTitle = input<string>();
  readonly parentPageTitle = input<string>();
  readonly parentPageLink = input<RouterLink['routerLink']>();

  readonly programId = input<string>();

  readonly isPending = input<boolean>();

  readonly pageLoadError = computed(() => {
    const permissionDenied = this.route.snapshot.queryParams[
      PERMISSION_DENIED_QUERY_KEY
    ] as unknown;

    if (permissionDenied) {
      return $localize`You do not have permission to view this page.`;
    }

    const notFoundResource = this.route.snapshot.queryParams[
      FOUND_RESOURCE_GUARD_QUERY_KEY
    ] as FoundResourceGuardType | undefined;

    if (!notFoundResource) {
      return undefined;
    }

    switch (notFoundResource) {
      case 'program':
        return $localize`Program not found. Please check the URL and try again.`;
      case 'registration':
        return $localize`Registration out of scope or not found - please check URL or contact your supervisor`;
      case 'payment':
        return $localize`Payment not found. Please check the URL and try again.`;
    }
  });
}

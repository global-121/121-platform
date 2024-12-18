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
import { ProjectMenuComponent } from '~/components/page-layout/components/project-menu/project-menu.component';
import {
  FOUND_RESOURCE_GUARD_QUERY_KEY,
  FoundResourceGuardType,
} from '~/guards/found-resource.guard';
import { PERMISSION_DENIED_QUERY_KEY } from '~/guards/project-permissions-guard';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [
    HeaderComponent,
    ProjectMenuComponent,
    FooterComponent,
    CardModule,
    MessageModule,
    SkeletonModule,
    RouterLink,
  ],
  templateUrl: './page-layout.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutComponent {
  private route = inject(ActivatedRoute);

  pageTitle = input<string>();
  parentPageTitle = input<string>();
  parentPageLink = input<RouterLink['routerLink']>();

  projectId = input<number>();

  isPending = input<boolean>();

  pageLoadError = computed(() => {
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
      case 'project':
        return $localize`Project not found. Please check the URL and try again.`;
      case 'registration':
        return $localize`Registration not found. Please check the URL and try again.`;
      case 'payment':
        return $localize`Payment not found. Please check the URL and try again.`;
    }
  });
}

import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { EllipsisMenuComponent } from '~/components/ellipsis-menu/ellipsis-menu.component';
import { isKoboIntegrated } from '~/domains/kobo/kobo.helpers';
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { KoboConfigurationDialogComponent } from '~/pages/program-settings-registration-data/components/kobo-configuration-dialog/kobo-configuration-dialog.component';

const KOBO_URL_FORMS_PREFIX = 'forms';

@Component({
  selector: 'app-kobo-integration-card',
  imports: [
    CardWithLinkComponent,
    EllipsisMenuComponent,
    DatePipe,
    KoboConfigurationDialogComponent,
  ],
  templateUrl: './kobo-integration-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboIntegrationCardComponent {
  readonly programId = input.required<number | string>();

  private readonly koboApiService = inject(KoboApiService);

  readonly koboConfigurationDialog =
    viewChild.required<KoboConfigurationDialogComponent>(
      'koboConfigurationDialog',
    );

  readonly koboIntegration = injectQuery(() => ({
    ...this.koboApiService.getKoboIntegration(this.programId)(),
    enabled: !!this.programId(),
  }));

  readonly isKoboIntegrated = computed<boolean>(() =>
    isKoboIntegrated(this.koboIntegration),
  );

  readonly titleColoredChipLabel = computed(() =>
    this.isKoboIntegrated() ? $localize`Linked` : undefined,
  );

  readonly cardSubtitle = computed(() =>
    this.isKoboIntegrated() ? '' : $localize`Click to integrate`,
  );

  readonly externalFormUrl = computed<null | string>(() => {
    if (!this.isKoboIntegrated()) {
      return null;
    }
    const koboIntegrationData = this.koboIntegration.data();
    if (!koboIntegrationData) {
      return null;
    }
    // See: https://support.kobotoolbox.org/api.html#retrieving-your-project-asset-uid
    return `${koboIntegrationData.url}/#/${KOBO_URL_FORMS_PREFIX}/${koboIntegrationData.assetUid}/summary`;
  });

  readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`Reconfigure`,
      icon: 'pi pi-pencil',
      command: () => {
        this.koboConfigurationDialog().show();
      },
    },
  ]);
}

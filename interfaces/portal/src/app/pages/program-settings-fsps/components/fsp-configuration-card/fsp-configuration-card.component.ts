import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MentionModule } from 'angular-mentions';
import { AccordionModule } from 'primeng/accordion';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { FSP_IMAGE_URLS } from '~/domains/fsp-configuration/fsp-configuration.helper';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { FspConfigurationService } from '~/services/fsp-configuration.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-fsp-configuration-card',
  imports: [
    ButtonModule,
    TableModule,
    CardWithLinkComponent,
    AccordionModule,
    ColoredChipComponent,
    MentionModule,
  ],
  templateUrl: './fsp-configuration-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FspConfigurationCardComponent {
  readonly programId = input.required<string>();
  readonly configuration = input.required<FspConfiguration>();
  readonly reconfigureFsp = output<FspConfiguration>();

  readonly fspConfigurationService = inject(FspConfigurationService);
  readonly fspConfigurationApiService = inject(FspConfigurationApiService);
  readonly programApiService = inject(ProgramApiService);
  readonly translatableStringService = inject(TranslatableStringService);
  readonly toastService = inject(ToastService);

  readonly configurationPending = computed(
    () =>
      this.configuration().state ===
      FspConfigurationStates.configurationPending,
  );

  programAttributes = injectQuery(
    this.programApiService.getProgramAttributes({
      programId: this.programId,
      includeProgramRegistrationAttributes: true,
    }),
  );

  readonly fspConfigurationLabel = computed(
    () =>
      this.translatableStringService.translate(this.configuration().label) ??
      '',
  );

  readonly fspSetting = computed(
    () => FSP_SETTINGS[this.configuration().fspName],
  );

  readonly fspImage = computed(
    () => FSP_IMAGE_URLS[this.configuration().fspName],
  );

  readonly menuItems = computed<MenuItem[]>(() =>
    this.configurationPending()
      ? []
      : [
          {
            label: 'Reconfigure',
            icon: 'pi pi-pencil',
            command: () => {
              this.reconfigureFsp.emit(this.configuration());
            },
          },
        ],
  );

  readonly requiredRegistrationAttributes = computed(() => {
    const requiredFspAttributes =
      this.fspConfigurationService.getRequiredFspAttributes({
        fspSetting: this.fspSetting(),
        existingFspConfiguration: this.configuration(),
      });

    return requiredFspAttributes.map((propertyName) =>
      this.programAttributes.data()?.find((attr) => attr.name === propertyName),
    );
  });

  copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
    this.toastService.showToast({
      detail: $localize`"${text}" copied to clipboard`,
    });
  }
}

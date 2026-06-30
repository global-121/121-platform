import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { AccordionModule } from 'primeng/accordion';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import {
  ChipVariant,
  ColoredChipComponent,
} from '~/components/colored-chip/colored-chip.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
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
    FormDialogComponent,
  ],
  templateUrl: './fsp-configuration-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FspConfigurationCardComponent {
  readonly programId = input.required<string>();
  readonly configuration = input.required<FspConfiguration>();

  readonly reconfigureFsp = output<FspConfiguration>();
  readonly addFspConfiguration = output<Fsps>();

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

  readonly deleteConfirmationDialog = viewChild.required<FormDialogComponent>(
    'deleteConfigurationDialog',
  );

  readonly deleteConfigurationDialogHeader = computed(
    () => $localize`Remove` + ` "${this.fspConfigurationLabel()}"`,
  );

  readonly coloredChipProps = computed<{ label: string; variant: ChipVariant }>(
    () => {
      return {
        label: this.configurationPending()
          ? $localize`Integration required`
          : $localize`Integrated`,
        variant: this.configurationPending() ? 'red' : 'green',
      };
    },
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

  readonly menuItems = computed<MenuItem[]>(() => {
    const excelMenuItems: MenuItem[] = [
      {
        label: 'Create another Excel FSP',
        command: () => {
          this.addFspConfiguration.emit(this.configuration().fspName);
        },
      },
      {
        label: 'Remove integration',
        command: () => {
          this.deleteConfirmationDialog().show();
        },
      },
    ];

    const menuItems: MenuItem[] = [
      {
        label: 'Reconfigure',
        command: () => {
          this.reconfigureFsp.emit(this.configuration());
        },
      },
    ];

    if (this.configuration().fspName === Fsps.excel) {
      menuItems.push(...excelMenuItems);
    }

    return !this.configurationPending() ? menuItems : [];
  });

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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';

import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { FspConfigurationService } from '~/services/fsp-configuration.service';
import { ToastService } from '~/services/toast.service';
@Component({
  selector: 'app-required-attributes',
  imports: [TableModule, Button, TagModule],
  providers: [ToastService],
  templateUrl: './required-attributes.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequiredAttributesComponent {
  readonly programId = input.required<number | string>();
  private readonly toastService = inject(ToastService);

  readonly fspConfigurationApiService = inject(FspConfigurationApiService);
  readonly fspConfigurationService = inject(FspConfigurationService);
  readonly programApiService = inject(ProgramApiService);

  readonly fspConfigurations = injectQuery(
    this.fspConfigurationApiService.getFspConfigurations(this.programId),
  );

  readonly programAttributes = injectQuery(
    this.programApiService.getProgramAttributes({
      programId: this.programId,
      includeProgramRegistrationAttributes: true,
    }),
  );

  readonly requiredAttributes = computed(() => {
    const fspConfigs = this.fspConfigurations.data();
    const attributes = this.programAttributes.data();

    if (!fspConfigs || !attributes) {
      return [];
    }

    const requiredAttributeNames = new Set<string>([
      FspAttributes.fullName,
      FspAttributes.phoneNumber,
    ]);

    for (const fspConfig of fspConfigs) {
      const fspSetting = FSP_SETTINGS[fspConfig.fspName];

      try {
        const required = this.fspConfigurationService.getRequiredFspAttributes({
          fspSetting,
          existingFspConfiguration: fspConfig,
        });

        for (const name of required) {
          requiredAttributeNames.add(name);
        }
      } catch {
        // Skip FSPs with incomplete configuration (e.g., Excel without columnsToExport set yet)
      }
    }

    return attributes.filter((attr) => requiredAttributeNames.has(attr.name));
  });

  copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
    this.toastService.showToast({
      detail: $localize`"${text}" copied to clipboard`,
    });
  }
}

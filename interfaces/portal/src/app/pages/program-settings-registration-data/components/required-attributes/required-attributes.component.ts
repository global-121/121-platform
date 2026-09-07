import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { AccordionModule } from 'primeng/accordion';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';

import {
  ExplainerComponent,
  ExplainerItem,
} from '~/components/explainer/explainer.component';
import { FspTagsComponent } from '~/components/fsp-tags/fsp-tags.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { FspConfigurationService } from '~/services/fsp-configuration.service';
import { ToastService } from '~/services/toast.service';
@Component({
  selector: 'app-required-attributes',
  imports: [
    TableModule,
    Button,
    InfoTooltipComponent,
    AccordionModule,
    FspTagsComponent,
    ExplainerComponent,
  ],
  providers: [ToastService],
  templateUrl: './required-attributes.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequiredAttributesComponent {
  readonly programId = input.required<number | string>();
  readonly isKoboIntegrated = input.required<boolean>();

  private readonly toastService = inject(ToastService);
  readonly fspConfigurationApiService = inject(FspConfigurationApiService);
  readonly fspConfigurationService = inject(FspConfigurationService);
  readonly programApiService = inject(ProgramApiService);

  readonly fspConfigurations = injectQuery(
    this.fspConfigurationApiService.getFspConfigurations(this.programId),
  );

  readonly programFspNames = computed(() => {
    const fspConfigs = this.fspConfigurations.data() ?? [];
    return fspConfigs.map((fspConfig) => fspConfig.name);
  });

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );
  readonly enableScope = computed(() => this.program.data()?.enableScope);

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

    const requiredAttributeNames = new Set<string>([FspAttributes.fullName]);

    // Workaround: the backend only auto-adds phoneNumber when Twilio is enabled, so its presence here is
    // a proxy for "Twilio is enabled" (an admin manually adding it via the API instead is very unlikely).
    // Kobo forms must include this field whenever Twilio is enabled
    const phoneNumberAttributeName: string =
      DefaultRegistrationDataAttributeNames.phoneNumber;
    if (attributes.some((attr) => attr.name === phoneNumberAttributeName)) {
      requiredAttributeNames.add(phoneNumberAttributeName);
    }

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

    // The FSP is a hidden field that is always required, so we hardcode it to the list of required attributes
    // until we do not require it anymore for programs with only one FSP configured.
    const fspEntry = {
      name: 'fsp',
      label: 'Fsp',
      infoTooltip: () => {
        const fspNames = this.programFspNames().join(', ');
        return this.programFspNames().length === 1
          ? $localize`fsp should be a 'hidden' field in your form that has the 'default response' set to the FSP name: ${fspNames}`
          : $localize`fsp should be 'select many' with the following FSP names as options: ${fspNames}`;
      },
    };

    // Scope is a field that is independent from the FSPs, so we hardcode it to the list of required attributes if the program has scope enabled.
    const scope = {
      name: 'scope',
      label: 'Scope',
      infoTooltip: () =>
        $localize`Scope should be a 'hidden' field in your form that has the 'default response' set to the scope of the registration`,
    };

    return [
      fspEntry,
      ...(this.enableScope() ? [scope] : []),
      ...attributes.filter((attr) => requiredAttributeNames.has(attr.name)),
    ];
  });

  readonly accordionValue = computed(() =>
    this.isKoboIntegrated() ? undefined : 'integrated-fsps-accordion-panel',
  );

  readonly dataColumnNamesExplainers: {
    title: string;
    items: ExplainerItem[];
  } = {
    title: $localize`Where do I find data column names?`,
    items: [
      {
        content: $localize`In kobo, when creating or editing the form, locate the question you want to change the data column name of and click on the settings (the cog icon)`,
        image: {
          url: 'assets/images/explainers/kobo/kobo-data-column-names-field.png',
          alt: $localize`Question settings cog icon in kobo`,
        },
      },
      {
        content: $localize`You will then find the data column name in the 'Question Options'`,
        image: {
          url: 'assets/images/explainers/kobo/kobo-data-column-names-question-options.png',
          alt: $localize`Data column name field in question options`,
        },
      },
      {
        content: $localize`Replace the data column name from the question to the required name from the table`,
        image: {
          url: 'assets/images/explainers/kobo/kobo-data-column-names-column-name.png',
          alt: $localize`Replacing the data column name with the required name`,
        },
      },

      {
        content: $localize`Exit the settings and continue to the next question. This will not affect the way the questions are displayed in the form.`,
      },
    ],
  };

  copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
    this.toastService.showToast({
      detail: $localize`"${text}" copied to clipboard`,
    });
  }
}

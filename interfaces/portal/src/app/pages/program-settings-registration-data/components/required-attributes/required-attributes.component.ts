import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { AccordionModule } from 'primeng/accordion';
import { TableModule } from 'primeng/table';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import {
  DefaultRegistrationDataAttributeNames,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';

import { CopyToClipboardButtonComponent } from '~/components/copy-to-clipboard-button/copy-to-clipboard.component';
import {
  ExplainerComponent,
  ExplainerItem,
} from '~/components/explainer/explainer.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { FspConfigurationService } from '~/services/fsp-configuration.service';
import { ToastService } from '~/services/toast.service';
@Component({
  selector: 'app-required-attributes',
  imports: [
    TableModule,
    AccordionModule,
    ExplainerComponent,
    CopyToClipboardButtonComponent,
    InfoTooltipComponent,
  ],
  providers: [ToastService],
  templateUrl: './required-attributes.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequiredAttributesComponent {
  readonly programId = input.required<number | string>();
  readonly isKoboIntegrated = input.required<boolean>();

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
    };

    // Scope is a field that is independent from the FSPs, so we hardcode it to the list of required attributes if the program has scope enabled.
    const scope = {
      name: 'scope',
      label: 'Scope',
      infoTooltip: () => $localize`xxxx`,
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
        content: $localize`In KoboToolbox, when creating or editing the form, locate the question you want to change the data column name of and click on the settings (the cog icon)`,
        image: {
          url: 'assets/images/explainers/kobo/kobo-data-column-names-field.png',
          alt: $localize`Location of question settings button (cog icon) in KoboToolbox`,
        },
      },
      {
        content: $localize`You will then find the data column name in the 'Question Options'`,
        image: {
          url: 'assets/images/explainers/kobo/kobo-data-column-names-question-options.png',
          alt: $localize`Location of the 'Data Column Name' field in 'Question Options'`,
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

  getRecommendedFspAttributeType() {
    if (this.programFspNames().length === 1) {
      return $localize`Hidden`;
    } else {
      return $localize`Select Many`;
    }
  }

  getTranslatedRecommendedAttributeType(attribute: {
    type: RegistrationAttributeTypes;
    name: string;
  }) {
    if (attribute.name === 'fsp') {
      return this.getRecommendedFspAttributeType();
    }

    if (attribute.name === 'scope') {
      return $localize`Hidden`;
    }

    switch (attribute.type) {
      case RegistrationAttributeTypes.dropdown:
        return $localize`Select One`;
      case RegistrationAttributeTypes.tel:
      case RegistrationAttributeTypes.numeric:
      case RegistrationAttributeTypes.numericNullable:
        return $localize`Number`;
      case RegistrationAttributeTypes.text:
        return $localize`Text`;
      case RegistrationAttributeTypes.date:
        return $localize`Date`;
      case RegistrationAttributeTypes.multiSelect:
        return $localize`Select Many`;
      case RegistrationAttributeTypes.boolean:
        return $localize`Checkbox`;
      case RegistrationAttributeTypes.koboImage:
        return $localize`Photo`;
    }
  }
}

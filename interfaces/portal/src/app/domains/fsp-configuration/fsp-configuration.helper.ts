import { computed, inject, InputSignal } from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';

import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';

export const FSP_CONFIGURATION_PROPERTY_LABELS: Record<
  FspConfigurationProperties,
  string
> = {
  [FspConfigurationProperties.password]: $localize`Password`,
  [FspConfigurationProperties.username]: $localize`Username`,
  [FspConfigurationProperties.columnsToExport]: $localize`Columns to export`,
  [FspConfigurationProperties.columnToMatch]: $localize`Field for identifying registrations`,
  [FspConfigurationProperties.brandCode]: $localize`Brand code`,
  [FspConfigurationProperties.coverLetterCode]: $localize`Cover letter code`,
  [FspConfigurationProperties.fundingTokenCode]: $localize`Funding token code`,
  [FspConfigurationProperties.paymentReferencePrefix]: $localize`Payment reference prefix`,
  [FspConfigurationProperties.corporateCodeOnafriq]: $localize`Corporate code`,
  [FspConfigurationProperties.passwordOnafriq]: $localize`Password`,
  [FspConfigurationProperties.uniqueKeyOnafriq]: $localize`Unique key`,
  [FspConfigurationProperties.debitAccountNumber]: $localize`Debit account number`,
  [FspConfigurationProperties.cardDistributionByMail]: $localize`Card distribution by mail`,
  [FspConfigurationProperties.maxBalanceInCents]: $localize`Max amount to spend per month (in cents)`,
  [FspConfigurationProperties.subscriptionKeyMtn]: $localize`Subscription key`,
  [FspConfigurationProperties.referenceIdMtn]: $localize`:@@attribute-label-referenceId:Reference ID`,
  [FspConfigurationProperties.apiKeyMtn]: $localize`API key`,
};

export const FSP_IMAGE_URLS: Record<Fsps, string> = {
  [Fsps.intersolveVoucherWhatsapp]: 'assets/fsps/ah.png',
  [Fsps.intersolveVoucherPaper]: 'assets/fsps/ah.png',
  [Fsps.intersolveVisa]: 'assets/fsps/visa.png',
  [Fsps.safaricom]: 'assets/fsps/safaricom.png',
  [Fsps.airtel]: 'assets/fsps/airtel.svg',
  [Fsps.commercialBankEthiopia]: 'assets/fsps/cbe.png',
  [Fsps.excel]: 'assets/fsps/excel.png',
  [Fsps.nedbank]: 'assets/fsps/nedbank.png',
  [Fsps.onafriq]: 'assets/fsps/onafriq.jpg',
  [Fsps.cooperativeBankOfOromia]: 'assets/fsps/cbo.png',
  [Fsps.mtn]: 'assets/fsps/mtn.png',
};

const hasPendingFspConfiguration = ({
  fspConfigurations,
}: {
  fspConfigurations: FspConfiguration[] | undefined;
}): boolean => {
  return (
    fspConfigurations?.some(
      (fspConfiguration) =>
        fspConfiguration.state === FspConfigurationStates.configurationPending,
    ) ?? false
  );
};

export const injectFspConfigurations = ({
  programId,
}: {
  programId: InputSignal<string>;
}) => {
  const fspConfigurationApiService = inject(FspConfigurationApiService);

  const fspConfigurations = injectQuery(
    fspConfigurationApiService.getFspConfigurations(programId),
  );

  const notAllFspsIntegrated = computed(() =>
    hasPendingFspConfiguration({
      fspConfigurations: fspConfigurations.data(),
    }),
  );

  return {
    fspConfigurations,
    notAllFspsIntegrated,
  };
};

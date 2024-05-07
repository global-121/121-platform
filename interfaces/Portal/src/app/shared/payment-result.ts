import { TranslateService } from '@ngx-translate/core';
import FspName from '../enums/fsp-name.enum';
import { FspIntegrationType } from '../models/fsp.model';
import { Program } from '../models/program.model';

export function getFspIntegrationType(
  fspsInPayment: FspName[],
  program: Program,
) {
  // In case of multiple FSPs default integrationType to API, but overwrite if any FSP has a different integration type
  // This variable is only used to return different UX copy on doPayment result
  let fspIntegrationType = FspIntegrationType.api;
  for (const fsp of fspsInPayment) {
    const programFsp = program.financialServiceProviders.find(
      (f) => f.fsp === fsp,
    );
    if (
      [FspIntegrationType.csv, FspIntegrationType.xml].includes(
        programFsp.integrationType,
      )
    ) {
      fspIntegrationType = programFsp.integrationType;
      return fspIntegrationType;
    }
  }
  return fspIntegrationType;
}

export function getPaymentResultText(
  nrPa: number,
  fspIntegrationType: FspIntegrationType,
  translateService: TranslateService,
): string {
  let message = '';

  switch (fspIntegrationType) {
    case FspIntegrationType.xml:
      message += translateService.instant(
        'page.program.program-payout.result.xml',
        { nrPa: `<strong>${nrPa}</strong>` },
      );
      break;

    case FspIntegrationType.csv:
      message += translateService.instant(
        'page.program.program-payout.result.csv',
        { nrPa: `<strong>${nrPa}</strong>` },
      );
      break;

    case FspIntegrationType.api:
    default:
      message += translateService.instant(
        'page.program.program-payout.result.api',
        { nrPa: `<strong>${nrPa}</strong>` },
      );
      break;
  }

  return message;
}

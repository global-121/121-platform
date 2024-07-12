import { FinancialServiceProviderIntegrationType } from '@121-service/src/program-financial-service-provider-configurations/financial-service-provider-integration-type.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

interface DeliveryMechanism {
  name: string;
  type: string;
  defaultLabel: LocalizedString;
  notifyOnTransaction: boolean;
  attributes: { name: string; required: boolean }[];
}

export interface FinancialServiceProvider {
  name: string;
  integrationType: FinancialServiceProviderIntegrationType;
  hasReconciliation: boolean;

  // TODO: Delivery mechanism is not yet needed in this refactor
  // Remove this property and only get the attributes from the delivery mechanism
  deliveryMechanisms: DeliveryMechanism[];
}

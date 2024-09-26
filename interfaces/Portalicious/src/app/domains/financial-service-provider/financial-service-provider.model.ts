import { FinancialServiceProvidersController } from '@121-service/src/financial-service-providers/financial-service-provider.controller';

import { Dto121Service } from '~/utils/dto-type';
import { ArrayElement } from '~/utils/type-helpers';

export type FinancialServiceProvider = ArrayElement<
  Dto121Service<FinancialServiceProvidersController['getAllFsps']>
>;

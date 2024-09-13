import { FinancialServiceProviderDto } from '@121-service/src/financial-service-providers/financial-service-provider.dto';
import { FINANCIAL_SERVICE_PROVIDERS } from '@121-service/src/financial-service-providers/financial-service-providers.const';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FinancialServiceProvidersService {
  public async getFspByName(
    name: string,
  ): Promise<FinancialServiceProviderDto | undefined> {
    return FINANCIAL_SERVICE_PROVIDERS.find((fsp) => fsp.name === name);
  }

  public async getAllFsps(): Promise<FinancialServiceProviderDto[]> {
    return FINANCIAL_SERVICE_PROVIDERS;
  }
}

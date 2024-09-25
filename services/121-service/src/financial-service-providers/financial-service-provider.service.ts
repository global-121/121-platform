import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { FinancialServiceProviderDto } from '@121-service/src/financial-service-providers/financial-service-provider.dto';
import { FINANCIAL_SERVICE_PROVIDERS } from '@121-service/src/financial-service-providers/financial-service-providers.const';

@Injectable()
export class FinancialServiceProvidersService {
  public async getFspByName(
    name: string,
  ): Promise<FinancialServiceProviderDto> {
    const fsp = FINANCIAL_SERVICE_PROVIDERS.find((fsp) => fsp.name === name);
    if (!fsp) {
      const availableFsps = FINANCIAL_SERVICE_PROVIDERS.map(
        (fsp) => fsp.name,
      ).join(', ');
      throw new HttpException(
        `Financial Service Provider not found. Available FSPs: ${availableFsps}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return fsp;
  }

  public async getAllFsps(): Promise<FinancialServiceProviderDto[]> {
    return FINANCIAL_SERVICE_PROVIDERS;
  }
}

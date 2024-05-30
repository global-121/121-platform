import { OnafriqTransferResponseDto } from '@121-service/src/payments/fsp-integration/onafriq/dto/onafriq-load-response.dto';
import { OnafriqTransferPayloadDto } from '@121-service/src/payments/fsp-integration/onafriq/dto/onafriq-transfer-payload.dto';
import {
  CustomHttpService,
  Header,
} from '@121-service/src/shared/services/custom-http.service';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { TokenSet } from 'openid-client';

@Injectable()
export class OnafriqApiService {
  public tokenSet: TokenSet;

  public constructor(private readonly httpService: CustomHttpService) {}

  private generateAuthorizationKey(
    corporateCode: string,
    password: string,
    timestamp: string,
  ): string {
    const data = corporateCode + password + timestamp;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  public async transfer(payload: OnafriqTransferPayloadDto): Promise<any> {
    try {
      const paymentUrl = process.env.MOCK_ONAFRIQ
        ? `${process.env.MOCK_SERVICE_URL}/api/fsp/onafriq/transfer`
        : `${process.env.ONAFRIQ_API_URL}/payments/onafriq/transaction`;

      const corporateCode = process.env.ONAFRIQ_CORPORATE_CODE;
      const password = process.env.ONAFRIQ_PASSWORD;
      const timestamp = new Date().toISOString();
      const authorizationKey = this.generateAuthorizationKey(
        corporateCode,
        password,
        timestamp,
      );

      const headers: Header[] = [
        { name: 'Authorization', value: `Key ${authorizationKey}` },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'timestamp', value: timestamp },
      ];

      const { data } = await this.httpService.post<OnafriqTransferResponseDto>(
        paymentUrl,
        payload,
        headers,
      );

      return data;
    } catch (error) {
      console.error('Failed to make Onafriq payment API call', error);
      return error.response?.data;
    }
  }
}

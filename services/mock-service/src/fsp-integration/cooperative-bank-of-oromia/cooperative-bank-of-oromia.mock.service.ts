import { Injectable } from '@nestjs/common';

import { CooperativeBankOfOromiaAuthenticateResponseSuccessDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-request-body.mock.dto';

enum CooperativeBankOfOromiaMockFailureEnum {
  genericError = '1234567890',
  duplicateError = '1234567891',
  unexpectedError = '1234567892',
}

interface CooperativeBankOfOromiaApiTransferRequestBodyDto {
  readonly debitAccount: string;
  readonly creditAccount: string;
  readonly creditAmount: number;
  readonly narrative: string;
  readonly messageId: string;
}

@Injectable()
export class CooperativeBankOfOromiaMockService {
  public async transfer({
    body,
  }: {
    body: CooperativeBankOfOromiaApiTransferRequestBodyDto;
  }): Promise<any> {
    if (
      body.creditAccount === CooperativeBankOfOromiaMockFailureEnum.genericError
    ) {
      return {
        success: false,
        error: {
          code: 'T24Error',
          messages:
            'CREDIT.ACCT.NO:1:1=Bucket Error E-110980CREDIT.ACCT.NO:1:1=Bucket Error E-113962DEBIT.ACCT.NO:1:1=Bucket Error E-156260',
          description: 'Invalid account number.',
        },
      };
    }
    if (
      body.creditAccount ===
      CooperativeBankOfOromiaMockFailureEnum.duplicateError
    ) {
      return {
        success: false,
        error: {
          code: 'T24Error',
          messages: 'DUPLICATE.TRAP:1:1=TRUE',
          description:
            'Duplicate transaction detected. Please use a unique message ID.',
        },
      };
    }

    if (
      body.creditAccount ===
      CooperativeBankOfOromiaMockFailureEnum.unexpectedError
    ) {
      throw new Error('Unexpected server error occurred');
    }

    return {
      success: true,
      message: 'Transaction completed',
      data: {
        transactionId: 'FT23137LWG57',
        messageId: 'DFHddDhgccffff5ngJHFA1',
        debitAccount: body.debitAccount,
        creditAccount: body.creditAccount,
        amountDebited: `ETB${body.creditAmount}.00`,
        amountCredited: `ETB${body.creditAmount}.00`,
        processingDate: '20230517', // This seem to be a random static date on UAT, but we do not use it
      },
    };
  }

  public async getOauth2Token({
    headers: _headers,
    body: _body,
  }: {
    headers: Record<string, string>;
    body: any;
  }): Promise<CooperativeBankOfOromiaAuthenticateResponseSuccessDto> {
    return {
      access_token: 'mocked-access-token',
      expires_in: 3600,
    };
  }
}

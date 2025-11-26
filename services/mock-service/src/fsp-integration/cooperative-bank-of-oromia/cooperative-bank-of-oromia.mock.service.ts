import { Injectable } from '@nestjs/common';

import { CooperativeBankOfOromiaAuthenticateResponseSuccessDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-request-body.mock.dto';
import { CooperativeBankOfOromiaApiTransferRequestBodyDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-request-body.dto';
import { CooperativeBankOfOromiaApiTransferResponseDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-response.dto';

enum CooperativeBankOfOromiaTransferMockFailureEnum {
  genericError = '1234567890',
  duplicateError = '1234567891',
  unexpectedError = '1234567892',
}

enum CooperativeBankOfOromiaAccountValidationMockFailureEnum {
  nonExistentAccount = '1234567893',
  unexpectedError = '1234567894',
}

@Injectable()
export class CooperativeBankOfOromiaMockService {
  public async transfer({
    body,
  }: {
    body: CooperativeBankOfOromiaApiTransferRequestBodyDto;
  }): Promise<CooperativeBankOfOromiaApiTransferResponseDto> {
    if (
      body.creditAccount ===
      CooperativeBankOfOromiaTransferMockFailureEnum.genericError
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
      CooperativeBankOfOromiaTransferMockFailureEnum.duplicateError
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
      CooperativeBankOfOromiaTransferMockFailureEnum.unexpectedError
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
    body: unknown;
  }): Promise<CooperativeBankOfOromiaAuthenticateResponseSuccessDto> {
    return {
      access_token: 'mocked-access-token',
      expires_in: 3600,
    };
  }

  public async accountValidation({
    bankAccountNumber,
  }: {
    bankAccountNumber: string;
  }): Promise<{
    success: boolean;
    data?: {
      accountTitle: string;
      accountNumber: string;
    };
    error?: {
      code: string;
      message: string;
    };
  }> {
    const code = 'T24Error';
    if (
      bankAccountNumber ===
      CooperativeBankOfOromiaAccountValidationMockFailureEnum.nonExistentAccount
    ) {
      return {
        success: false,
        error: {
          code,
          message: 'No records were found that matched the selection criteria',
        },
      };
    }
    if (
      bankAccountNumber ===
      CooperativeBankOfOromiaAccountValidationMockFailureEnum.unexpectedError
    ) {
      throw new Error('Unexpected server error occurred');
    }
    return {
      success: true,
      data: {
        accountTitle: 'JANE DOE', // capitalized on purpose as the api also sometimes gives capitalized names
        accountNumber: bankAccountNumber,
      },
    };
  }
}

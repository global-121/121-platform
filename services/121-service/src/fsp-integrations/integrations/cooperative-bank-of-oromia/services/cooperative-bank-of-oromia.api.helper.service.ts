import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';

import { env } from '@121-service/src/env';
import { CooperativeBankOfOromiaApiAccountValidationErrorResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-account-validation-error-response-body.dto';
import { CooperativeBankOfOromiaApiAccountValidationResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-account-validation-response-body.dto';
import { CooperativeBankOfOromiaApiTransferErrorResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-error-response-body.dto';
import { CooperativeBankOfOromiaApiTransferRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-request-body.dto';
import { CooperativeBankOfOromiaApiTransferResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-response-body.dto';
import { CooperativeBankOfOromiaTransferResultEnum } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaTransferMessageEnum } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-transfer-messages.enum';

@Injectable()
export class CooperativeBankOfOromiaApiHelperService {
  public buildTransferPayload({
    cooperativeBankOfOromiaMessageId,
    recipientCreditAccountNumber,
    debitAccountNumber,
    amount,
  }: {
    cooperativeBankOfOromiaMessageId: string;
    recipientCreditAccountNumber: string;
    debitAccountNumber: string;
    amount: number;
  }): CooperativeBankOfOromiaApiTransferRequestBodyDto {
    return {
      debitAccount: debitAccountNumber,
      creditAccount: recipientCreditAccountNumber,
      creditAmount: amount,
      narrative: env.COOPERATIVE_BANK_OF_OROMIA_NARRATIVE!, // Will be defined when COOPERATIVE_BANK_OF_OROMIA_MODE=EXTERNAL
      messageId: cooperativeBankOfOromiaMessageId, // Should be max 12 chars ALPHANUMERIC
    };
  }

  public handleAccountValidationResponse(
    responseData: CooperativeBankOfOromiaApiAccountValidationResponseBodyDto,
  ): {
    cooperativeBankOfOromiaName?: string;
    errorMessage?: string;
  } {
    if (responseData && responseData.success === true) {
      return {
        cooperativeBankOfOromiaName: responseData.data?.accountTitle,
      };
    }

    return {
      errorMessage: this.parseAccountValidationErrorMessage(responseData.error),
    };
  }

  public handleTransferResponse(
    responseData: CooperativeBankOfOromiaApiTransferResponseBodyDto,
  ): { result: CooperativeBankOfOromiaTransferResultEnum; message?: string } {
    if (!responseData) {
      return {
        result: CooperativeBankOfOromiaTransferResultEnum.fail,
        message:
          'No response received from Cooperative Bank of Oromia API. The service may be temporarily unavailable.',
      };
    }

    if (responseData.success === true) {
      return {
        result: CooperativeBankOfOromiaTransferResultEnum.success,
      };
    }

    if (
      responseData?.error?.messages ===
      CooperativeBankOfOromiaTransferMessageEnum.duplicateMessageId
    ) {
      return {
        result: CooperativeBankOfOromiaTransferResultEnum.duplicate,
      };
    }

    return {
      result: CooperativeBankOfOromiaTransferResultEnum.fail,
      message: this.parseTransferErrorMessage(responseData.error),
    };
  }

  private parseTransferErrorMessage(
    errorObject?: CooperativeBankOfOromiaApiTransferErrorResponseBodyDto,
  ): string {
    if (!errorObject) {
      return 'Cooperative Bank of Oromia did not provide error details. The service may be temporarily unavailable or returned an unexpected response format.';
    }

    return `Error description: ${errorObject.description}, Error Code: ${errorObject.code}, Message: ${errorObject.messages || errorObject.message}`;
  }

  private parseAccountValidationErrorMessage(
    errorObject?: CooperativeBankOfOromiaApiAccountValidationErrorResponseBodyDto,
  ): string {
    if (!errorObject || !errorObject.message) {
      return 'Cooperative Bank of Oromia did not provide error details for account validation. The service may be temporarily unavailable or returned an unexpected response format.';
    }
    return `Message: ${errorObject.message}`;
  }
}

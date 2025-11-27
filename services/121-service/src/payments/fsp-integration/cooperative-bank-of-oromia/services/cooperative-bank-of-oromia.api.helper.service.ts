import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';

import { env } from '@121-service/src/env';
import { CooperativeBankOfOromiaApiPaymentResponseBodyDto } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-payment-response-body.dto';
import { CooperativeBankOfOromiaApiTransferRequestBodyDto } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-request-body.dto';
import { CooperativeBankOfOromiaTransferResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaTransferMessageEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-transfer-messages.enum';

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
      narrative: env.COOPERATIVE_BANK_OF_OROMIA_NARRATIVE,
      messageId: cooperativeBankOfOromiaMessageId, // Should be max 12 chars ALPHANUMERIC
    };
  }

  public handleTransferResponse(
    responseData: CooperativeBankOfOromiaApiPaymentResponseBodyDto,
  ): { result: CooperativeBankOfOromiaTransferResultEnum; message?: string } {
    if (responseData && responseData.success === true) {
      return {
        result: CooperativeBankOfOromiaTransferResultEnum.success,
      };
    }

    if (
      responseData &&
      responseData?.error?.messages ===
        CooperativeBankOfOromiaTransferMessageEnum.duplicateMessageId
    ) {
      return {
        result: CooperativeBankOfOromiaTransferResultEnum.duplicate,
      };
    }

    return {
      result: CooperativeBankOfOromiaTransferResultEnum.fail,
      message: this.parseErrorMessage(responseData),
    };
  }

  private parseErrorMessage(
    responseData: CooperativeBankOfOromiaApiPaymentResponseBodyDto,
  ): string {
    const errorObject = responseData.error;
    if (!errorObject) {
      return 'Unknown error occurred';
    }

    return `Error description: ${errorObject.description}, Error Code: ${errorObject.code}, Message: ${errorObject.messages}`;
  }
}

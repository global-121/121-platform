import { CooperativeBankOfOromiaApiTransferErrorResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-error-response-body.dto';

export interface CooperativeBankOfOromiaApiTransferResponseBodyDto {
  readonly success: boolean;
  // When success is true
  readonly data?: {
    readonly transactionId: string;
    readonly messageId: string;
    readonly debitAccount: string;
    readonly creditAccount: string;
    readonly amountDebited: string;
    readonly amountCredited: string;
    readonly processingDate: string;
  };
  // When success is false
  readonly error?: CooperativeBankOfOromiaApiTransferErrorResponseBodyDto;
}

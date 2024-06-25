import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';

export class TransferResponseDto {
  public status: number;
  public statusText?: string;
  public data: {
    success: boolean;
    errors: ErrorsInResponseDto[];
    code: string;
    correlationId: string;
    data: {
      creditTransactionId: string;
      debitTransactionId: string;
    };
  };
}

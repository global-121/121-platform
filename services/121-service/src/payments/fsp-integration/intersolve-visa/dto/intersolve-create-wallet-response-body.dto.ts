import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';
import { IntersolveCreateWalletResponseDataDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet-response-data.dto';

export class IntersolveCreateWalletResponseBodyDto {
  public success: boolean;
  public errors?: ErrorsInResponseDto[];
  public code?: string;
  public correlationId?: string;
  public data: IntersolveCreateWalletResponseDataDto;
}

import { IntersolveCreateWalletResponseDataDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet-response-data.dto';
import { IntersolveReponseErrorDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-response-error.dto';

export class IntersolveCreateWalletResponseBodyDto {
  public success: boolean;
  public errors?: IntersolveReponseErrorDto[];
  public code?: string;
  public correlationId?: string;
  public data: IntersolveCreateWalletResponseDataDto;
}

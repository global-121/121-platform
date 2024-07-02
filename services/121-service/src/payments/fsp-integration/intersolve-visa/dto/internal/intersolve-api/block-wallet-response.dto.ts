import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';

export enum BlockWalletReasonCodeEnum {
  BLOCK_GENERAL = 'BLOCK_GENERAL',
  UNBLOCK_GENERAL = 'UNBLOCK_GENERAL',
}

export class BlockWalletResponseDto {
  public data: {
    success?: boolean;
    errors?: ErrorsInResponseDto[];
    code?: string;
    correlationId?: string;
  };
  public status: number;
  public statusText?: string;
}

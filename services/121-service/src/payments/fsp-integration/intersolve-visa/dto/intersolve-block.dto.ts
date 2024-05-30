import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';

export class IntersolveBlockWalletDto {
  public reasonCode: BlockReasonEnum | UnblockReasonEnum;
}

export enum BlockReasonEnum {
  BLOCK_GENERAL = 'BLOCK_GENERAL',
  TOKEN_DISABLED = 'TOKEN_DISABLED',
}
export enum UnblockReasonEnum {
  UNBLOCK_GENERAL = 'UNBLOCK_GENERAL',
}

export class IntersolveBlockWalletResponseDto {
  public data: IntersolveBlockWalletResponseBodyDto;
  public status: number;
  public statusText?: string;
}

class IntersolveBlockWalletResponseBodyDto {
  public success?: boolean;
  public errors?: ErrorsInResponseDto[];
  public code?: string;
  public correlationId?: string;
}

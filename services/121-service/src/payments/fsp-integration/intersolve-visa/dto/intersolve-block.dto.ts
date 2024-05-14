import { IntersolveReponseErrorDto } from './intersolve-response-error.dto';

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
  public errors?: IntersolveReponseErrorDto[];
  public code?: string;
  public correlationId?: string;
}

import { IntersolveReponseErrorDto } from './intersolve-response-error.dto';

export class IntersolveCreateVirtualCardDto {
  public brand: 'VISA_CARD' | 'MASTER_CARD';
}

export class IntersolveCreateVirtualCardResponseDto {
  public data: {
    success?: boolean;
    errors?: IntersolveReponseErrorDto[];
    code?: string;
  };
  public status: number;
  public statusText: string;
}

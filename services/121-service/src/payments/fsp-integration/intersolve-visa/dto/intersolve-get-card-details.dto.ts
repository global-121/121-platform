import { IntersolveVisaCardStatus } from '../intersolve-visa-wallet.entity';
import { IntersolveReponseErrorDto } from './intersolve-response-error.dto';

export class GetCardDetailsReponseDto {
  public data: CardDetailsReponseDataDto;
  public success: boolean;
  public errors?: IntersolveReponseErrorDto[];
  public code?: string;
  public correlationId: string;
}

export class CardDetailsReponseDataDto {
  public cardURL: string;
  public cardFrameURL: string;
  public accessToken: string;
  public status: IntersolveVisaCardStatus;
}

export class IntersolveGetCardResponseDto {
  public data: GetCardDetailsReponseDto;
  public status: number;
  public statusText?: string;
}

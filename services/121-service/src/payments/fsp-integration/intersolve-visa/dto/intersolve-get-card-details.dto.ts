import { IntersolveVisaCardStatus } from '../intersolve-visa-wallet.entity';
import { IntersolveReponseErrorDto } from './intersolve-response-error.dto';

class GetCardDetailsResponseDto {
  public data: CardDetailsResponseDataDto;
  public success: boolean;
  public errors?: IntersolveReponseErrorDto[];
  public code?: string;
  public correlationId: string;
}

class CardDetailsResponseDataDto {
  public cardURL: string;
  public cardFrameURL: string;
  public accessToken: string;
  public status: IntersolveVisaCardStatus;
}

export class IntersolveGetCardResponseDto {
  public data: GetCardDetailsResponseDto;
  public status: number;
  public statusText?: string;
}

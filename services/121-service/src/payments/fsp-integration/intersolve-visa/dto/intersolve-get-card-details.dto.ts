import { IntersolveReponseErrorDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-response-error.dto';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';

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

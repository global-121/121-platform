import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-status.enum';

class GetCardDetailsResponseDto {
  public data: CardDetailsResponseDataDto;
  public success: boolean;
  public errors?: ErrorsInResponseDto[];
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

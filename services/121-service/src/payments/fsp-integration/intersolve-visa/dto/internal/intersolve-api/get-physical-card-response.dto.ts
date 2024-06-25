import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-status.enum';

// TODO: REFACTOR: Make properties readonly
export class GetPhysicalCardResponseDto {
  public data: {
    data: {
      cardURL: string;
      cardFrameURL: string;
      accessToken: string;
      status: IntersolveVisaCardStatus;
    };
    success: boolean;
    errors?: ErrorsInResponseDto[];
    code?: string;
    correlationId: string;
  };
  public status: number;
  public statusText?: string;
}

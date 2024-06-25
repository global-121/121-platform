import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';

export class CreatePhysicalCardResponseDto {
  public data: {
    success?: boolean;
    errors?: ErrorsInResponseDto[];
    code?: string;
  };
  public status: number;
  public statusText: string;
}

import { CooperativeBankOfOromiaApiAccountValidationErrorResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-account-validation-error-response-body.dto';

export interface CooperativeBankOfOromiaApiAccountValidationResponseBodyDto {
  readonly success: boolean;
  // When success is true
  readonly data?: {
    readonly accountTitle: string;
    readonly accountNumber: string;
  };
  // When success is false
  readonly error?: CooperativeBankOfOromiaApiAccountValidationErrorResponseBodyDto;
}

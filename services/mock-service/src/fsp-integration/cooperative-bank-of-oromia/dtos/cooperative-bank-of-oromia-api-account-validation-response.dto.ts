export class CooperativeBankOfOromiaApiAccountValidationResponseDto {
  readonly success: boolean;
  data?: {
    readonly accountTitle: string;
    readonly accountNumber: string;
  };
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}

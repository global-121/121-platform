// this is a non-exhaustive dto representing a successful response only
// there are more properties in the succes response but these are not relevant for our implementation
export class CooperativeBankOfOromiaAuthenticateResponseSuccessDto {
  public readonly access_token: string;
  public readonly expires_in: number;
}

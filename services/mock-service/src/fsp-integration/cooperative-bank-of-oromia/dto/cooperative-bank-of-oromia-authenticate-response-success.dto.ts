export class CooperativeBankOfOromiaAuthenticateResponseSuccessDto {
  public access_token: string;
  public expires_in: string; // A number inside a string (e.g., "180")
  public token_type: string;
}

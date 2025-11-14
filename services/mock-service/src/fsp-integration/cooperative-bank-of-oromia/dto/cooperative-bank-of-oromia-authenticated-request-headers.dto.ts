export interface CooperativeBankOfOromiaAuthenticatedRequestHeadersDto {
  'content-type'?: string;
  authorization?: string; // See comments in controller for why this is optional
  authorization_?: string;
  'x-country': string;
  'x-currency': string;
  origin?: string;
}

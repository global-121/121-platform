export class IntersolveIssueTokenDto {
  public reference: string;
  public activate = false;
  public quantities: [{ quantity: { assetCode: string; value: number } }];
}

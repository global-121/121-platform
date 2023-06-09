export class IntersolveIssueTokenDto {
  public reference: string;
  public activate: boolean = false;
  public quantities: [{ quantity: { assetCode: string; value: number } }];
}

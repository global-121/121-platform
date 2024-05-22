export class IntersolveLoadDto {
  public reference: string;
  public saleId?: string;
  public quantities: IntersolveQuantityObjectDto[];
}

export class IntersolveQuantityObjectDto {
  public quantity: IntersolveQuantityDto;
  public expiresAt?: string;
}

class IntersolveQuantityDto {
  public assetCode: string;
  public value: number;
}

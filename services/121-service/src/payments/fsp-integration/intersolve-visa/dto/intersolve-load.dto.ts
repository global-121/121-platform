export class IntersolveLoadDto {
  public reference: string;
  public saleId: string;
  public quantities: IntersolveQuantityObjectDto[];
}

class IntersolveQuantityObjectDto {
  public quantity: IntersolveQuantityDto;
}

class IntersolveQuantityDto {
  public assetCode: string;
  public value: number;
}

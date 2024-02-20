export class ExcelFspInstructions {
  public amount: number;
  // Other fields are added dynamically based on program fsp configuration
}

export class ExcelReconciliationDto {
  public id: number;
  public referenceId: string;
  public amount: number;
  // columnToMatch field is added dynamically based on program fsp configuration
}

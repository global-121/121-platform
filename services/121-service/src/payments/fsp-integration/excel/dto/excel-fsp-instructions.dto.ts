export class ExcelFspInstructions {
  public amount: number;
}

export class ExcelReconciliationDto {
  public id: number;
  public referenceId: string;
  public amount: number;
  // columnToMatch field is added dynamically based on program fsp configuration
  // Allow dynamic fields based on program FSP configuration
  [key: string]: string | number;
}

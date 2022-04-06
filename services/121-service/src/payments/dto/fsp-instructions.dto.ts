export class FspInstructions {
  public data: any[];
  public fileType: ExportFileType;
}

export enum ExportFileType {
  csv = 'csv',
  excel = 'excel',
}

export class FspInstructions {
  public data: any[] | string;
  public fileType: ExportFileType;
}

export enum ExportFileType {
  csv = 'csv',
  excel = 'excel',
  xml = 'xml',
}

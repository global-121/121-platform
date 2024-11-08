export interface GetVersionDto {
  schemaVersion: number;
  label: string;
  message: string;
  isError?: boolean;
}

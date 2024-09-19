export class RowType {
  registrationProgramId?: number;
  fspDisplayName?: Record<string, string> | string;
  [key: string]: string | number | Record<string, string> | undefined | null;
}

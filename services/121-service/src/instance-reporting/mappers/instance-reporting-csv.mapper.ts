import { InstanceReportingRegistrationDto } from '@121-service/src/instance-reporting/dtos/instance-reporting-registration.dto';
import { InstanceReportingTransactionDto } from '@121-service/src/instance-reporting/dtos/instance-reporting-transaction.dto';

// Record<keyof Dto, true> enforces compile-time completeness: the compiler
// errors if a field is added to or removed from the DTO without updating the
// corresponding record. Object.keys() then derives the headers array at runtime.
// This is to ensure we can upload a header-only CSV when there are no
// transactions or registrations yet in an instance.
const registrationHeaderRecord: Record<
  keyof InstanceReportingRegistrationDto,
  true
> = {
  instance: true,
  version: true,
  programTitle: true,
  programId: true,
  status: true,
  referenceId: true,
  uploadDate: true,
};

const transactionHeaderRecord: Record<
  keyof InstanceReportingTransactionDto,
  true
> = {
  instance: true,
  version: true,
  programId: true,
  programTitle: true,
  id: true,
  status: true,
  amountEuro: true,
  amount: true,
  localCurrency: true,
  createdDate: true,
  updatedDate: true,
  registrationReferenceId: true,
  uploadDate: true,
};

export class InstanceReportingCsvMapper {
  static readonly registrationHeaders = Object.keys(
    registrationHeaderRecord,
  ) as (keyof InstanceReportingRegistrationDto)[];

  static readonly transactionHeaders = Object.keys(
    transactionHeaderRecord,
  ) as (keyof InstanceReportingTransactionDto)[];

  public static mapItemToCsvRow<T extends object>({
    headers,
    item,
  }: {
    headers: (keyof T & string)[];
    item: T;
  }): string {
    const values = headers.map((header) => this.escapeCsvValue(item[header]));
    return this.toCsvRow({ values });
  }

  public static toCsvRow({ values }: { values: string[] }): string {
    return values.join(',') + '\n';
  }

  // Custom CSV escaping instead of a library like PapaParse (which we use in
  // the FE) because libraries build the entire CSV string in memory. This works
  // with per-row streaming, which is less risky given the potentially large size
  // of the data.
  private static escapeCsvValue(value: unknown): string {
    // Null/undefined values are rendered as empty fields (,,) because CSV has no
    // native null representation. Empty fields are the standard convention and
    // PowerBI interprets them as null/missing values automatically.
    if (value == null) {
      return '';
    }
    const str = String(value);
    if (
      str.includes(',') ||
      str.includes('"') ||
      str.includes('\n') ||
      str.includes('\r')
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}

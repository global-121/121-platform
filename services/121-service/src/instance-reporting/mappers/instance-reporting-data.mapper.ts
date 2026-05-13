import { APP_VERSION } from '@121-service/src/config';
import { InstanceReportingRegistrationDto } from '@121-service/src/instance-reporting/dtos/instance-reporting-registration.dto';
import { InstanceReportingTransactionDto } from '@121-service/src/instance-reporting/dtos/instance-reporting-transaction.dto';
import { InstanceReportingProgramRaw } from '@121-service/src/instance-reporting/interfaces/instance-reporting-program-raw.interface';
import { InstanceReportingRegistrationRaw } from '@121-service/src/instance-reporting/interfaces/instance-reporting-registration-raw.interface';
import { InstanceReportingTransactionRaw } from '@121-service/src/instance-reporting/interfaces/instance-reporting-transaction-raw.interface';
import { ValueExtractor } from '@121-service/src/registration-events/utils/registration-events.helpers';

export class InstanceReportingDataMapper {
  public static mapRegistration({
    registration,
    instance,
    uploadDate,
  }: {
    registration: InstanceReportingRegistrationRaw;
    instance: string;
    uploadDate: string;
  }): InstanceReportingRegistrationDto {
    return {
      instance,
      version: APP_VERSION,
      programTitle: InstanceReportingDataMapper.extractProgramTitle(
        registration.program,
      ),
      programId: registration.program.id,
      status: registration.registrationStatus,
      referenceId: registration.referenceId,
      uploadDate,
    };
  }

  public static mapTransaction({
    transaction,
    instance,
    amountEuro,
    uploadDate,
  }: {
    transaction: InstanceReportingTransactionRaw;
    instance: string;
    amountEuro: number | null;
    uploadDate: string;
  }): InstanceReportingTransactionDto {
    const program = transaction.registration.program;

    return {
      instance,
      version: APP_VERSION,
      programId: program.id,
      programTitle: InstanceReportingDataMapper.extractProgramTitle(program),
      id: transaction.id,
      status: transaction.status,
      amountEuro,
      amount: transaction.transferValue,
      localCurrency: program.currency,
      createdDate: transaction.created.toISOString(),
      updatedDate: transaction.updated.toISOString(),
      registrationReferenceId: transaction.registration.referenceId,
      uploadDate,
    };
  }

  private static extractProgramTitle(
    program: InstanceReportingProgramRaw,
  ): string {
    return (
      ValueExtractor.getLocalizedStringOrFallback(program.titlePortal) ??
      `Program ${program.id}`
    );
  }
}

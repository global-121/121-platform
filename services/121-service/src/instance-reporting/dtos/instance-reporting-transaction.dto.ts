import { ApiProperty } from '@nestjs/swagger';

export class InstanceReportingTransactionDto {
  @ApiProperty({ example: 'ethiopia' })
  readonly instance: string;

  @ApiProperty({ example: '1.0.0' })
  readonly version: string;

  @ApiProperty({ example: 1 })
  readonly programId: number;

  @ApiProperty({ example: 'Cash for Work' })
  readonly programTitle: string;

  @ApiProperty({ example: 42 })
  readonly id: number;

  @ApiProperty({ example: 'success' })
  readonly status: string;

  @ApiProperty({ example: 100, nullable: true })
  readonly amountEuro: number | null;

  @ApiProperty({ example: 5000, nullable: true })
  readonly amount: number | null;

  @ApiProperty({ example: 'ETB', nullable: true })
  readonly localCurrency: string | null;

  @ApiProperty({ example: '2026-03-30T12:00:00.000Z' })
  readonly createdDate: string;

  @ApiProperty({ example: '2026-03-30T12:00:00.000Z', nullable: true })
  readonly startedDate: string | null;

  @ApiProperty({ example: '2026-03-30T12:00:00.000Z' })
  readonly updatedDate: string;

  @ApiProperty({ example: 'REF-001' })
  readonly registrationReferenceId: string;

  @ApiProperty({ example: '2026-03-30' })
  readonly uploadDate: string;
}

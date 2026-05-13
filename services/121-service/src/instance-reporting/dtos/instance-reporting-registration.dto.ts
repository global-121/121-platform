import { ApiProperty } from '@nestjs/swagger';

export class InstanceReportingRegistrationDto {
  @ApiProperty({ example: 'ethiopia' })
  readonly instance: string;

  @ApiProperty({ example: '1.0.0' })
  readonly version: string;

  @ApiProperty({ example: 'Cash for Work' })
  readonly programTitle: string;

  @ApiProperty({ example: 1 })
  readonly programId: number;

  @ApiProperty({ example: 'included', nullable: true })
  readonly status: string | null;

  @ApiProperty({ example: 'abc-123' })
  readonly referenceId: string;

  @ApiProperty({ example: '2026-03-30' })
  readonly uploadDate: string;
}

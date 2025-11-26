import { ApiProperty } from '@nestjs/swagger';

export class CooperativeBankOfOromiaAccountValidationReportRecordDto {
  @ApiProperty({ type: String, nullable: true })
  public nameUsedForTheMatch: string | null;

  @ApiProperty({ type: String, nullable: true })
  public bankAccountNumberUsedForCall: string | null;

  @ApiProperty({ type: String, nullable: true })
  public cooperativeBankOfOromiaName: string | null;

  @ApiProperty({ type: Boolean })
  public namesMatch: boolean;

  @ApiProperty({ type: String, nullable: true })
  public errorMessage: string | null;

  @ApiProperty({ type: Number })
  public registrationProgramId: number;

  @ApiProperty({ type: String })
  public referenceId: string;

  @ApiProperty({ type: String })
  public updated: string;
}

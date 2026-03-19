import { ApiProperty } from '@nestjs/swagger';

export class AirtelUserLookupReportRecordDto {
  @ApiProperty({ type: String, nullable: true })
  public phoneNumberUsedForCall: string | null;

  @ApiProperty({ type: String, nullable: true })
  public nameUsedForTheMatch: string | null;

  @ApiProperty({ type: Boolean, nullable: true })
  public isAirtelUser: boolean | null;

  @ApiProperty({ type: String, nullable: true })
  public airtelName: string | null;

  @ApiProperty({ type: String, nullable: true })
  public errorMessage: string | null;

  @ApiProperty({ type: Number })
  public registrationProgramId: number;

  @ApiProperty({ type: String })
  public referenceId: string;

  @ApiProperty({ type: String })
  public updated: string;
}

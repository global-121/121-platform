import { ApiProperty } from '@nestjs/swagger';

export class MonitoringDataRegistrationDto {
  @ApiProperty()
  public instance: string;

  @ApiProperty()
  public version: string;

  @ApiProperty()
  public programTitle: string;

  @ApiProperty()
  public programId: number;

  @ApiProperty()
  public status: string;

  @ApiProperty({
    description: 'Date only, format YYYY-MM-DD',
  })
  public uploadDate: string;
}

export class MonitoringDataTransactionDto {
  @ApiProperty()
  public instance: string;

  @ApiProperty()
  public version: string;

  @ApiProperty()
  public programId: number;

  @ApiProperty()
  public programTitle: string;

  @ApiProperty()
  public id: number;

  @ApiProperty()
  public status: string;

  @ApiProperty()
  public amountEuro: number;

  @ApiProperty()
  public amountChf: number;

  @ApiProperty()
  public amount: number;

  @ApiProperty()
  public localCurrency: string;

  @ApiProperty()
  public createdDate: string;

  @ApiProperty()
  public updatedDate: string;

  @ApiProperty()
  public registrationReferenceId: string;

  @ApiProperty({
    description: 'Date only, format YYYY-MM-DD',
  })
  public uploadDate: string;
}

export class PushMonitoringDataDto {
  @ApiProperty({ type: [MonitoringDataRegistrationDto] })
  public registrations: MonitoringDataRegistrationDto[];

  @ApiProperty({ type: [MonitoringDataTransactionDto] })
  public transactions: MonitoringDataTransactionDto[];
}

import { ApiProperty } from '@nestjs/swagger';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export class GetTransactionResponseDto {
  @ApiProperty({ example: 1, type: 'number' })
  public id: number;

  @ApiProperty({
    example: '2023-09-28T08:00:10.363Z',
    type: 'string',
    format: 'date-time',
  })
  public created: Date;

  @ApiProperty({
    example: '2023-09-28T08:00:10.363Z',
    type: 'string',
    format: 'date-time',
  })
  public updated: Date;

  @ApiProperty({ example: 1, type: 'number' })
  public paymentId: number;

  @ApiProperty({ example: TransactionStatusEnum.success, type: 'string' })
  public status: TransactionStatusEnum;

  @ApiProperty({ example: 25, type: 'number' })
  public amount: number;

  @ApiProperty({ example: 'Something went wrong', type: 'string' })
  public errorMessage: string | null;

  @ApiProperty({ example: 'ironBank' })
  public programFspConfigurationName: string;

  @ApiProperty({ example: 111, type: 'number' })
  public registrationProgramId: number;

  @ApiProperty({ example: 111, type: 'number' })
  public registrationId: number;

  @ApiProperty({ example: RegistrationStatusEnum.included, type: 'string' })
  public registrationStatus: RegistrationStatusEnum;

  @ApiProperty({ example: '12345', type: 'string' })
  public registrationReferenceId: string;

  @ApiProperty({ example: '', type: 'string' })
  public registrationScope: string;

  @ApiProperty({ example: 'Juan Garcia' })
  public registrationName?: string;
}

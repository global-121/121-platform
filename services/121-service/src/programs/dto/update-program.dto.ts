import { ApiModelProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  Length,
  IsBoolean,
  IsIn,
  IsArray,
  IsNumber,
  ValidateNested,
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';

export class UpdateProgramDto {
  @ApiModelProperty()
  @IsOptional()
  @IsBoolean()
  public readonly published: boolean;

  @ApiModelProperty()
  @IsOptional()
  @IsString()
  public readonly location: string;

  @ApiModelProperty({ example: { en: 'title' } })
  @IsOptional()
  public readonly titlePortal: JSON;

  @ApiModelProperty({ example: { en: 'title' } })
  @IsOptional()
  public readonly titlePaApp: JSON;

  @ApiModelProperty()
  @IsOptional()
  @IsString()
  public readonly ngo: string;

  @ApiModelProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsOptional()
  @IsDateString()
  public readonly startDate: Date;

  @ApiModelProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsOptional()
  @IsDateString()
  public readonly endDate: Date;

  @ApiModelProperty({ example: 'MWK' })
  @IsOptional()
  @IsString()
  @Length(3, 3, {
    message: 'Currency should be a 3 letter abbreviation',
  })
  public readonly currency: string;

  @ApiModelProperty()
  @IsOptional()
  @IsString()
  public readonly distributionFrequency: string;

  @ApiModelProperty()
  @IsOptional()
  @IsNumber()
  public readonly distributionDuration: number;

  @ApiModelProperty({ example: 500 })
  @IsOptional()
  public readonly fixedTransferValue: number;

  @ApiModelProperty({
    example: [
      {
        id: 1,
      },
      {
        id: 2,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @IsDefined()
  @Type(() => FinancialServiceProviderEntity)
  public readonly financialServiceProviders: FinancialServiceProviderEntity[];

  @ApiModelProperty({ example: 'minimumScore' })
  @IsOptional()
  @IsIn(['minimumScore', 'highestScoresX'])
  public readonly inclusionCalculationType: string;

  @ApiModelProperty()
  @IsOptional()
  @IsNumber()
  public readonly minimumScore: number;

  @ApiModelProperty()
  @IsOptional()
  @IsNumber()
  public readonly highestScoresX: number;

  @ApiModelProperty()
  @IsOptional()
  @IsBoolean()
  public readonly validation: boolean;

  @ApiModelProperty()
  @IsOptional()
  @IsBoolean()
  public readonly validationByQr: boolean;

  @ApiModelProperty({
    example: { en: 'Identity card;Health Insurance;Proof of children' },
  })
  @IsOptional()
  public readonly meetingDocuments: JSON;

  @ApiModelProperty({
    example: {
      en: {
        included: 'You have been included in this program.',
        rejected:
          'Unfortunately we have to inform you that you will not receive any (more) payments for this program. If you have questions, please contact us.',
      },
      nl: {
        included: 'Je zit wel in het programma',
        rejected: 'Je zit niet in het programma',
      },
    },
  })
  @IsOptional()
  public readonly notifications: JSON;

  @ApiModelProperty({ example: '+000 000 00 00' })
  @IsString()
  @IsOptional()
  public readonly phoneNumberPlaceholder: string;

  @ApiModelProperty({ example: { en: 'description' } })
  @IsOptional()
  public readonly description: JSON;

  @ApiModelProperty({ example: { en: 'descCashType' } })
  @IsOptional()
  public readonly descCashType: JSON;
}

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { FinancialServiceProviderName } from '../../financial-service-providers/enum/financial-service-provider-name.enum';
import { ProgramPhase } from '../../shared/enum/program-phase.enum';
import { ProgramFinancialServiceProviderDto } from './create-program.dto';

export class UpdateProgramDto {
  @ApiProperty({
    enum: ProgramPhase,
    example: ProgramPhase.registrationValidation,
  })
  @IsString()
  @IsEnum(ProgramPhase)
  @IsOptional()
  public readonly phase: ProgramPhase;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  public readonly published: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  public readonly location: string;

  @ApiProperty({ example: { en: 'title' } })
  @IsOptional()
  public readonly titlePortal: JSON;

  @ApiProperty()
  @IsOptional()
  @IsString()
  public readonly ngo: string;

  @ApiProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsOptional()
  @IsDateString()
  public readonly startDate: Date;

  @ApiProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsOptional()
  @IsDateString()
  public readonly endDate: Date;

  @ApiProperty({ example: 'MWK' })
  @IsOptional()
  @IsString()
  @Length(3, 3, {
    message: 'Currency should be a 3 letter abbreviation',
  })
  public readonly currency: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  public readonly distributionFrequency: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  public readonly distributionDuration: number;

  @ApiProperty({ example: 500 })
  @IsOptional()
  public readonly fixedTransferValue: number;

  @ApiProperty({ example: '0 + 1 * nrOfHouseHoldMembers' })
  @IsOptional()
  @IsString()
  public readonly paymentAmountMultiplierFormula: string;

  @ApiProperty({
    example: [
      {
        fsp: FinancialServiceProviderName.intersolveVoucherWhatsapp,
      },
      {
        fsp: FinancialServiceProviderName.intersolveVoucherPaper,
      },
    ],
    description:
      'Use the GET /api/financial-service-providers endpoint to find valid fspNames. Any fspName supplied that is not already configured for the program, will be added. Existing FSPs are not removed from a program. Program-fsp-config is not processed. Use specific POST/PUT endpoints for that.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => ProgramFinancialServiceProviderDto)
  public readonly financialServiceProviders: ProgramFinancialServiceProviderDto[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  public readonly targetNrRegistrations: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  public readonly validation: boolean;

  @ApiProperty({ example: { en: 'description' } })
  @IsOptional()
  public readonly description: JSON;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  public readonly enableMaxPayments: boolean;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  public readonly enableScope: boolean;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  public readonly allowEmptyPhoneNumber: boolean;

  @ApiProperty({ example: 100000 })
  @IsOptional()
  @IsNumber()
  public readonly budget: number;
}

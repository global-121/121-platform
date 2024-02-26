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
import { FspName } from '../../fsp/enum/fsp-name.enum';
import { ProgramPhase } from '../../shared/enum/program-phase.enum';
import { SetFspDto } from './create-program.dto';

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

  @ApiProperty({ example: { en: 'title' } })
  @IsOptional()
  public readonly titlePaApp: JSON;

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
        fsp: FspName.intersolveVoucherWhatsapp,
      },
      {
        fsp: FspName.intersolveVoucherPaper,
      },
    ],
    description:
      'Use the GET /api/financial-service-providers endpoint to find valid fspNames. Any fspName supplied that is not already configured for the program, will be added. Existing FSPs are not removed from a program. Program-fsp-config is not processed. Use specific POST/PUT endpoints for that.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => SetFspDto) // TODO: SetFspDto is now imported from create-program.dto.ts, is that correct? Or put SetFspDto definition in a separate file?
  public readonly financialServiceProviders: SetFspDto[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  public readonly targetNrRegistrations: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  public readonly validation: boolean;

  @ApiProperty({
    example: { en: 'Identity card;Health Insurance;Proof of children' },
  })
  @IsOptional()
  public readonly meetingDocuments: JSON;

  @ApiProperty({ example: '+000 000 00 00' })
  @IsString()
  @IsOptional()
  public readonly phoneNumberPlaceholder: string;

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

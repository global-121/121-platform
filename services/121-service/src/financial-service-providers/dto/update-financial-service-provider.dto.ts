import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ExportType } from '../../metrics/dto/export-details.dto';
import { ProgramPhase } from '../../shared/enum/program-phase.enum';

export class UpdateFinancialServiceProviderAttributeDto {
  @ApiProperty({ example: { en: 'attribute label' } })
  @IsOptional()
  public label: JSON;

  @ApiProperty({ example: { en: 'attribute placeholder' } })
  @IsOptional()
  public placeholder: JSON;

  @ApiProperty({
    example: [
      {
        option: 'true',
        label: {
          en: 'Yes',
        },
      },
      {
        option: 'false',
        label: {
          en: 'No',
        },
      },
    ],
  })
  @IsOptional()
  public options: JSON;

  @ApiProperty({
    example: [ExportType.allPeopleAffected, ExportType.included],
  })
  @IsOptional()
  public export: JSON;

  @ApiProperty()
  @IsOptional()
  public answerType: string;

  @ApiProperty({
    example: [
      ProgramPhase.registrationValidation,
      ProgramPhase.inclusion,
      ProgramPhase.payment,
    ],
  })
  @IsOptional()
  public phases: JSON;
}

export class CreateFspAttributeDto extends UpdateFinancialServiceProviderAttributeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public readonly name: string;
}

export class UpdateFspDto {
  @ApiProperty({ example: { en: 'FSP PA-app display name' } })
  @IsOptional()
  public readonly displayNamePaApp: JSON;

  @ApiProperty({ example: 'FSP portal display name' })
  @IsOptional()
  public readonly displayNamePortal: string;
}

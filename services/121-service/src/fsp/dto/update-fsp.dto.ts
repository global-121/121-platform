import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ExportType } from '../../export-metrics/dto/export-details';
import { ProgramPhase } from '../../shared/enum/program-phase.model';

export class FspAttributeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public readonly fsp: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public readonly name: string;

  @ApiProperty({ example: { en: 'FSP display name' } })
  @IsOptional()
  public label: JSON;

  @ApiProperty({ example: { en: 'FSP display name' } })
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
    example: [
      ExportType.allPeopleAffected,
      ExportType.included,
      ExportType.selectedForValidation,
    ],
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

export class UpdateFspDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly fsp: string;

  @ApiProperty({ example: { en: 'FSP display name' } })
  @IsOptional()
  public readonly fspDisplayName: JSON;
}

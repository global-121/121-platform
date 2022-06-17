import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ExportType } from '../../export-metrics/dto/export-details';
import { ProgramPhase } from '../../shared/enum/program-phase.model';

export class FspAttributeDto {
  @ApiModelProperty()
  @IsString()
  @IsNotEmpty()
  public readonly fsp: string;

  @ApiModelProperty()
  @IsString()
  @IsNotEmpty()
  public readonly name: string;

  @ApiModelProperty({ example: { en: 'FSP display name' } })
  @IsOptional()
  public label: JSON;

  @ApiModelProperty({ example: { en: 'FSP display name' } })
  @IsOptional()
  public placeholder: JSON;

  @ApiModelProperty({
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

  @ApiModelProperty({
    example: [
      ExportType.allPeopleAffected,
      ExportType.included,
      ExportType.selectedForValidation,
    ],
  })
  @IsOptional()
  public export: JSON;

  @ApiModelProperty()
  @IsOptional()
  public answerType: string;

  @ApiModelProperty({
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
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly fsp: string;

  @ApiModelProperty({ example: { en: 'FSP display name' } })
  @IsOptional()
  public readonly fspDisplayName: JSON;
}

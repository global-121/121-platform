import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LocalizedString } from 'src/shared/enum/language.enums';
import { QuestionOption } from 'src/shared/enum/question.enums';
import { ExportType } from '../../metrics/dto/export-details.dto';
import { ProgramPhase } from '../../shared/enum/program-phase.enum';

export class UpdateFspAttributeDto {
  @ApiProperty({ example: { en: 'attribute label' } })
  @IsOptional()
  public label?: LocalizedString;

  @ApiProperty({ example: { en: 'attribute placeholder' } })
  @IsOptional()
  public placeholder?: LocalizedString;

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
  public options?: QuestionOption[];

  @ApiProperty({
    example: [ExportType.allPeopleAffected, ExportType.included],
  })
  @IsOptional()
  public export?: ExportType[];

  @ApiProperty()
  @IsOptional()
  public answerType?: string;

  @ApiProperty({
    example: [
      ProgramPhase.registrationValidation,
      ProgramPhase.inclusion,
      ProgramPhase.payment,
    ],
  })
  @IsOptional()
  public phases?: ProgramPhase[];
}

export class CreateFspAttributeDto extends UpdateFspAttributeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public readonly name: string;
}

export class UpdateFinancialServiceProviderDto {
  @ApiProperty({
    example: { en: 'FSP display name', nl: 'FSP weergavenaam' },
  })
  @IsOptional()
  public readonly displayName?: LocalizedString;
}

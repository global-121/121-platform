import { ExportType } from '@121-service/src/metrics/dto/export-details.dto';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { QuestionOption } from 'src/shared/enum/question.enums';

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
    example: false,
  })
  @IsOptional()
  public showInPeopleAffectedTable: boolean;
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

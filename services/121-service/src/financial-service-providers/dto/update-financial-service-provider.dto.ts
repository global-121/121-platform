import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ExportType } from '../../metrics/dto/export-details.dto';

export class UpdateFspAttributeDto {
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
  public readonly displayName: JSON;
}

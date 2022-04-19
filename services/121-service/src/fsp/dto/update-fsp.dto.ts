import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

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

  @ApiModelProperty()
  @IsOptional()
  public answerType: string;
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

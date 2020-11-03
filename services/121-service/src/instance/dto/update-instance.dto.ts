import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateInstanceDto {
  @ApiModelProperty({ example: 'NGO-name' })
  @IsString()
  public readonly name: string;

  @ApiModelProperty({ example: { en: 'NGO display name' } })
  @IsOptional()
  public readonly displayName: JSON;

  @ApiModelProperty({
    example: { en: '<data policy>' },
  })
  @IsOptional()
  public readonly dataPolicy: JSON;

  @ApiModelProperty({
    example: { en: '<about program>' },
  })
  @IsOptional()
  public readonly aboutProgram: JSON;

  @ApiModelProperty({
    example: { en: '<contact details>' },
  })
  @IsOptional()
  public readonly contactDetails: JSON;
}

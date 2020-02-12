import { ApiModelProperty } from '@nestjs/swagger';

import { Length, IsString, IsNotEmpty } from 'class-validator';

export class CustomDataDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: 'phone' })
  @IsNotEmpty()
  @IsString()
  public readonly key: string;
  @ApiModelProperty({ example: 'BSN:244672027' })
  @IsNotEmpty()
  @IsString()
  public readonly value: string;
}

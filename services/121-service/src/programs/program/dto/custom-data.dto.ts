import { ApiModelProperty } from '@nestjs/swagger';

import { Length, IsString, IsNotEmpty } from 'class-validator';

export class CustomDataDto {
  @ApiModelProperty({ example: 'did:sov:exampleExampleExample' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: 'whatsappPhoneNumber' })
  @IsNotEmpty()
  @IsString()
  public readonly key: string;
  @ApiModelProperty({ example: '31600000000' })
  @IsNotEmpty()
  @IsString()
  public readonly value: string;
}

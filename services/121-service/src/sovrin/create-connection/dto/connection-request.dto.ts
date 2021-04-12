import { Length, IsNotEmpty, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class ConnectionRequestDto {
  @ApiModelProperty({ example: 'did:sov:exampleExampleExample' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: '123456789' })
  @IsNotEmpty()
  @IsString()
  public readonly nonce: string;
}

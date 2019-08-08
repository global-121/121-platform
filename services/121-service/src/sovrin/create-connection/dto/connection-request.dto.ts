import { Length, IsNotEmpty, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class ConnectionRequestDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(30, 30)
  public readonly did: string;
  @ApiModelProperty({ example: '123456789' })
  @IsNotEmpty()
  @IsString()
  public readonly nonce: string;
}

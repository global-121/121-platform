import { ApiModelProperty } from '@nestjs/swagger';
import { Length, IsNotEmpty, IsString } from 'class-validator';

export class ConnectionReponseDto {
  @ApiModelProperty({ example: 'did:sov:exampleExampleExample' })
  @Length(29, 30)
  public readonly did: string;
  @IsNotEmpty()
  @IsString()
  @ApiModelProperty({ example: 'verkey:sample' })
  public readonly verkey: string;
  @ApiModelProperty({ example: '123456789' })
  @IsNotEmpty()
  @IsString()
  public readonly nonce: string;
  @ApiModelProperty({ example: 'meta:sample' })
  public readonly meta: string;
}

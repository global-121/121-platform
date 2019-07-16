import { ApiModelProperty } from '@nestjs/swagger';
import { Length, IsNotEmpty, IsString } from 'class-validator';

export class CreateConnectionDto {
  @ApiModelProperty({ example: 'did:s' })
  @Length(30, 30)
  public readonly did: string;
  @IsNotEmpty()
  @IsString()
  @ApiModelProperty({ example: 'verkey:sample' })
  public readonly verkey: string;
  @ApiModelProperty({ example: 'meta:sample' })
  public readonly meta: string;
}

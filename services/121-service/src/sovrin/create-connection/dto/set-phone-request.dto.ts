import { Length, IsNotEmpty, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class SetPhoneRequestDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: '0031600000000' })
  @IsNotEmpty()
  @IsString()
  public readonly phonenumber: string;
}

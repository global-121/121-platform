import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class EncryptedMessageDto {
  @ApiModelProperty({ example: 'encrypted:example' })
  @IsNotEmpty()
  @IsString()
  public readonly message: string;
}

import { ApiModelProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString
} from 'class-validator';

export class RegisterTimeslotDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @IsNotEmpty()
  @IsString()
  public readonly did: string;
}

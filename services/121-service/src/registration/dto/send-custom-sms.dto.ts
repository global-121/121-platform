import { ApiModelProperty } from '@nestjs/swagger';
import {
  Length,
  ValidateIf,
  IsString,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';

export class SendCustomSmsDto {
  @ApiModelProperty({ example: ['910c50be-f131-4b53-b06b-6506a40a2734'] })
  @ArrayMinSize(1)
  public readonly referenceIds: string[];
  @ApiModelProperty({
    example: 'Your voucher can be picked up at the location',
  })
  @IsString()
  public readonly message: string;
}

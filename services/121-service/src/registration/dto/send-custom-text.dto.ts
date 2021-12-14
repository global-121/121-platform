import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, ArrayMinSize } from 'class-validator';

export class SendCustomTextDto {
  @ApiModelProperty({ example: ['910c50be-f131-4b53-b06b-6506a40a2734'] })
  @ArrayMinSize(1)
  public readonly referenceIds: string[];
  @ApiModelProperty({
    example: 'Your voucher can be picked up at the location',
  })
  @IsString()
  public readonly message: string;
}

import { ApiModelProperty } from '@nestjs/swagger';
import { Length, IsString, IsIn } from 'class-validator';

export enum AttributesEnum {
  paymentAmountMultiplier = 'paymentAmountMultiplier',
}
const attributesArray = Object.values(AttributesEnum).map(item => String(item));

export class UpdateAttributeDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiModelProperty({
    enum: attributesArray,
    example: attributesArray.join(' | '),
  })
  @IsIn(attributesArray)
  public readonly attribute: AttributesEnum;
  @ApiModelProperty({ example: 'new value' })
  @IsString()
  public readonly value: string;
}

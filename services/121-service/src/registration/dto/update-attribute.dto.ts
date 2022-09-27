import { ApiProperty } from '@nestjs/swagger';
import { Length } from 'class-validator';
import { CustomDataAttributes } from '../enum/custom-data-attributes';

export enum AdditionalAttributes {
  paymentAmountMultiplier = 'paymentAmountMultiplier',
}
export const Attributes = { ...AdditionalAttributes, ...CustomDataAttributes };
export type Attributes = AdditionalAttributes | CustomDataAttributes;

const attributesArray = Object.values(Attributes).map(item => String(item));

export class UpdateAttributeDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiProperty({
    enum: attributesArray,
    example: attributesArray.join(' | '),
  })
  public readonly attribute: Attributes | string;
  @ApiProperty({ example: 'new value' })
  public readonly value: string | number | string[];
}

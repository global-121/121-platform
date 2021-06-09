import { ApiModelProperty } from '@nestjs/swagger';
import { Length, IsString, IsIn } from 'class-validator';
import { CustomDataAttributes } from '../validation-data/dto/custom-data-attributes';

export enum AdditionalAttributes {
  namePartnerOrganization = 'namePartnerOrganization',
  paymentAmountMultiplier = 'paymentAmountMultiplier',
}
export const Attributes = { ...AdditionalAttributes, ...CustomDataAttributes };
export type Attributes = AdditionalAttributes | CustomDataAttributes;

const attributesArray = Object.values(Attributes).map(item => String(item));

export class UpdateAttributeDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiModelProperty({
    enum: attributesArray,
    example: attributesArray.join(' | '),
  })
  @IsIn(attributesArray)
  public readonly attribute: Attributes;
  @ApiModelProperty({ example: 'new value' })
  public readonly value: string | number;
}

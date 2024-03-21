import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { CustomDataAttributes } from '../enum/custom-data-attributes';
import { IsRegistrationDataValidType } from '../validators/registration-data-type.class.validator';

export enum AdditionalAttributes {
  paymentAmountMultiplier = 'paymentAmountMultiplier',
  preferredLanguage = 'preferredLanguage',
  maxPayments = 'maxPayments',
  referenceId = 'referenceId',
  scope = 'scope',
}
export const Attributes = { ...AdditionalAttributes, ...CustomDataAttributes };
export type Attributes = AdditionalAttributes | CustomDataAttributes;

const attributesArray = Object.values(Attributes).map((item) => String(item));

export class UpdateAttributeDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(5, 200)
  public readonly referenceId: string;
  @ApiProperty({
    enum: attributesArray,
    example: attributesArray.join(' | '),
  })
  public readonly attribute: Attributes | string;
  @ApiProperty({ example: 'new value' })
  @IsRegistrationDataValidType({
    referenceId: 'referenceId',
    attribute: 'attribute',
  })
  public readonly value: string | number | string[];

  public readonly userId: number;
}

export class UpdateRegistrationDto {
  @ApiProperty({
    description: `Key value pairs of the registration object.`,
    example: `{ "phoneNumber" : "1234567890" }`,
  })
  public data: object;

  @ApiProperty({
    description: `Reason is the same for all provided attributes in one API-call`,
    example: 'Reason for update',
  })
  @IsOptional()
  @IsString()
  public readonly reason: string;
}

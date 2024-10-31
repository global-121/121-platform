import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';

export enum AdditionalAttributes {
  paymentAmountMultiplier = 'paymentAmountMultiplier',
  preferredLanguage = 'preferredLanguage',
  maxPayments = 'maxPayments',
  referenceId = 'referenceId',
  scope = 'scope',
  programFinancialServiceProviderConfigurationName = 'programFinancialServiceProviderConfigurationName',
}
export const Attributes = {
  ...AdditionalAttributes,
  ...DefaultRegistrationDataAttributeNames,
};
export type Attributes =
  | AdditionalAttributes
  | DefaultRegistrationDataAttributeNames;

export class UpdateRegistrationDto {
  @ApiProperty({
    description: `Key value pairs of the registration object.`,
    example: `{ "phoneNumber" : "1234567890" }`,
  })
  public data: Record<string, string | number | boolean | undefined>;

  @ApiProperty({
    description: `Reason is the same for all provided attributes in one API-call`,
    example: 'Reason for update',
  })
  @IsOptional()
  @IsString()
  public readonly reason?: string;
}

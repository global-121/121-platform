import { HttpException, HttpStatus } from '@nestjs/common';

export interface ParseVisaCardOrderAddressParams {
  readonly address: string;
}

export interface ParseVisaCardOrderAddressResult {
  readonly addressStreet: string;
  readonly addressHouseNumber: string;
  readonly addressHouseNumberAddition?: string;
}

export function parseVisaCardOrderAddressOrThrow({
  address,
}: ParseVisaCardOrderAddressParams): ParseVisaCardOrderAddressResult {
  const normalizedAddress = address.trim().replace(/\s+/g, ' ');
  const parsedAddress =
    /^(?<addressStreet>.+?)\s+(?<addressHouseNumber>\d+)(?:\s*(?<addressHouseNumberAddition>[A-Za-z0-9-/]+))?$/.exec(
      normalizedAddress,
    );

  if (
    !parsedAddress?.groups?.addressStreet ||
    !parsedAddress.groups.addressHouseNumber
  ) {
    throw new HttpException(
      'Address must include street name and house number.',
      HttpStatus.BAD_REQUEST,
    );
  }

  return {
    addressStreet: parsedAddress.groups.addressStreet.trim(),
    addressHouseNumber: parsedAddress.groups.addressHouseNumber.trim(),
    addressHouseNumberAddition:
      parsedAddress.groups.addressHouseNumberAddition?.trim() || undefined,
  };
}

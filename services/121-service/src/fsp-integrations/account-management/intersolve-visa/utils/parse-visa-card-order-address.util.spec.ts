import { HttpException, HttpStatus } from '@nestjs/common';

import { parseVisaCardOrderAddressOrThrow } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/utils/parse-visa-card-order-address.util';

describe('parseVisaCardOrderAddressOrThrow', () => {
  it('parses street and house number', () => {
    const result = parseVisaCardOrderAddressOrThrow({
      address: 'Damrak 1',
    });

    expect(result).toEqual({
      addressStreet: 'Damrak',
      addressHouseNumber: '1',
      addressHouseNumberAddition: undefined,
    });
  });

  it('parses house number addition', () => {
    const result = parseVisaCardOrderAddressOrThrow({
      address: 'Damrak 1 A',
    });

    expect(result).toEqual({
      addressStreet: 'Damrak',
      addressHouseNumber: '1',
      addressHouseNumberAddition: 'A',
    });
  });

  it('normalizes extra whitespace', () => {
    const result = parseVisaCardOrderAddressOrThrow({
      address: '  Damrak   1   A  ',
    });

    expect(result).toEqual({
      addressStreet: 'Damrak',
      addressHouseNumber: '1',
      addressHouseNumberAddition: 'A',
    });
  });

  it('throws when house number is missing', () => {
    expect(() =>
      parseVisaCardOrderAddressOrThrow({
        address: 'Damrak',
      }),
    ).toThrow(
      new HttpException(
        'Address must include street name and house number.',
        HttpStatus.BAD_REQUEST,
      ),
    );
  });
});

import { HttpStatus } from '@nestjs/common';

import { UpdateProgramRegistrationAttributesBatchDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { patchProgramRegistrationAttributesInBatch } from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const OCW_PROGRAM_ID = 3;

async function setupNlrcEnvironment() {
  await resetDB({ seedScript: SeedScript.nlrcMultiple });
  const accessToken = await getAccessToken();

  return accessToken;
}

describe('Update program registration attributes in batch', () => {
  let accessToken: string;

  beforeEach(async () => {
    accessToken = await setupNlrcEnvironment();
  });

  it('should successfully update multiple attributes', async () => {
    const attributesToUpdateSuccess: UpdateProgramRegistrationAttributesBatchDto[] =
      [
        {
          programRegistrationAttributeName: 'whatsappPhoneNumber',
          updateProgramRegistrationAttribute: {
            label: { en: 'WhatsApp Phone Number' },
          },
        },
        {
          programRegistrationAttributeName: 'addressPostalCode',
          updateProgramRegistrationAttribute: {
            label: { en: 'Address PostalCode' },
            placeholder: { en: 'Postal code' },
          },
        },
      ];

    // Act
    const response = await patchProgramRegistrationAttributesInBatch({
      programId: OCW_PROGRAM_ID,
      accessToken,
      attributesToUpdate: attributesToUpdateSuccess,
    });

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);

    const updatedAttributes = response.body;

    expect(updatedAttributes).toHaveLength(2);
    expect(updatedAttributes[0]['label']['en']).toBe('WhatsApp Phone Number');
    expect(updatedAttributes[1]['label']['en']).toBe('Address PostalCode');
    expect(updatedAttributes[1]['placeholder']['en']).toBe('Postal code');
  });

  it('should fail on updating a non existing attribute name', async () => {
    const attributesToUpdateFail = [
      {
        programRegistrationAttributeName: 'attributeFailNotFound',
        updateProgramRegistrationAttribute: {
          label: { en: 'WhatsApp Phone Number' },
        },
      },
    ];

    // Act

    const response = await patchProgramRegistrationAttributesInBatch({
      programId: OCW_PROGRAM_ID,
      accessToken,
      attributesToUpdate: attributesToUpdateFail,
    });

    // Assert
    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  });
});

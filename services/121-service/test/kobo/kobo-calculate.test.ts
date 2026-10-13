import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { KoboMockAssetUids } from '@121-service/test/fixtures/kobo-mock-asset-uids';
import { KoboMockSubmissionUuids } from '@121-service/test/fixtures/kobo-mock-submission-uuids';
import {
  setupProgramWithKoboIntegration,
  triggerKoboSubmission,
} from '@121-service/test/helpers/kobo.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const fspConfiguration: CreateProgramFspConfigurationDto = {
  name: 'Safaricom',
  label: { en: 'Safaricom' },
  fspName: Fsps.safaricom,
  properties: [],
};

const baseProgram: Partial<CreateProgramDto> = {
  currency: CurrencyCode.EUR,
  enableMaxPayments: true,
  fixedTransferValue: 20,
  programRegistrationAttributes: [
    {
      name: FspAttributes.nationalId,
      label: { en: 'National ID' },
      type: RegistrationAttributeTypes.text,
      options: [],
    },
  ],
};

describe('Add calculate question', () => {
  let accessToken: string;
  // let programId: number;
  const submissionUuid = `${KoboMockSubmissionUuids.success}-calculate-question-test`;
  const assetUidInput = KoboMockAssetUids.calculatedQuestion;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.productionInitialState });
    accessToken = await getAccessToken();

    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: { en: 'Program for Kobo calculate question testing' },
      languages: [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ],
    } as CreateProgramDto;

    const setup = await setupProgramWithKoboIntegration({
      assetUid: assetUidInput,
      program,
      fspConfiguration,
      accessToken,
    });
    // programId = setup.programId;

    // Create a registration via Kobo webhook (which stores the image attachment URL)
    const res = await triggerKoboSubmission({
      assetUid: setup.assetUid,
      submissionUuid,
      koboVersion: KoboMockAssetUids.calculatedQuestion,
    });

    console.log(res.status, res.body);
  });

  it('creates a numeric attribute for the numeric calculate question', async () => {
    // fetch the program, find the attribute named "calculation",
    // and expect its type to be RegistrationAttributeTypes.numeric
  });
});

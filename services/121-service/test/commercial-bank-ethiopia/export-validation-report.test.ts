import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  getCbeValidationReport,
  startCbeValidationProcess,
} from '@121-service/test/helpers/program.helper';
import { importRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Export CBE validation report', () => {
  const programId = 1;

  const registrationCbe = {
    referenceId: 'registration-cbe-1',
    phoneNumber: '14155238886',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    fspName: FinancialServiceProviderName.commercialBankEthiopia,
    maxPayments: 3,
    fullName: 'ANDUALEM MOHAMMED YIMER',
    idNumber: '39231855170',
    age: '48',
    gender: 'male',
    howManyFemale: '1',
    howManyMale: '2',
    totalFamilyMembers: '3',
    howManyFemaleUnder18: '1',
    howManyMaleUnder18: '2',
    howManyFemaleOver18: '1',
    howManyMaleOver18: '1',
    howManyFemaleDisabilityUnder18: '2',
    howManyMaleDisabilityUnder18: '1',
    howManyFemaleDisabilityOver18: '1',
    howManyMaleDisabilityOver18: '2',
    bankAccountNumber: '407951684723597',
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.ethJointResponse);
    accessToken = await getAccessToken();
    await waitFor(1_000);
  });

  it('should succesfully generate a report of CBE validation data', async () => {
    // // Arrange
    await importRegistrations(programId, [registrationCbe], accessToken);
    await startCbeValidationProcess(programId, accessToken);

    // Act
    const exportResult = await getCbeValidationReport(programId, accessToken);

    // Assert
    expect(exportResult.body.fileName).toBe('cbe-validation-report');
    // We remove updated, because aways changes
    const { updated: _updated, ...result } = exportResult.body.data[0];
    expect(result).toMatchSnapshot();
  });
});

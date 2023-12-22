import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { LanguageEnum } from '../../src/registration/enum/language.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.enum';
import { waitFor } from '../../src/utils/waitFor.helper';
import {
  changePhase,
  getCbeValidationReport,
  startCbeValidationProcess,
} from '../helpers/program.helper';
import { importRegistrations } from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Export CBE validation report', () => {
  const programId = 1;

  const registrationCbe = {
    referenceId: '2982g82bdsf89sdsd',
    phoneNumber: '14155238886',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    fspName: FspName.commercialBankEthiopia,
    maxPayments: 3,
    fullName: 'ANDUALEM MOHAMMED YIMER',
    idNumber: '39231855170',
    age: '48',
    gender: 'Male',
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

    await changePhase(
      programId,
      ProgramPhase.registrationValidation,
      accessToken,
    );
  });

  it('should succesfully generate a report of CBE validation data', async () => {
    // // Arrange
    await importRegistrations(programId, [registrationCbe], accessToken);
    await startCbeValidationProcess(programId, accessToken);

    // Act
    const exportResult = await getCbeValidationReport(programId, accessToken);

    // Assert
    expect(exportResult.body.fileName).toBe('cbe-validation-report');
    expect(exportResult.body.data[0].registrationProgramId).toBeGreaterThan(0);
    expect(exportResult.body.data[0].fullNameUsedForTheMatch).toBeDefined();
    expect(
      exportResult.body.data[0].bankAccountNumberUsedForCall,
    ).toBeDefined();
    expect(exportResult.body.data[0].cbeName).toBeDefined();
    expect(exportResult.body.data[0].cbeStatus).toBeDefined();
    expect(exportResult.body.data[0].errorMessage).toBeDefined();
    expect(exportResult.body.data[0].updated).toBeDefined();
  });
});

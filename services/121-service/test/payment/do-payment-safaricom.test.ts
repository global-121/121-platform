import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { UpdateProgramDto } from '@121-service/src/programs/dto/update-program.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  getTransactions,
  patchProgram,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { HttpStatus } from '@nestjs/common';

describe('Do payment to 1 PA', () => {
  const programId = 2;
  const payment = 1;
  const amount = 12327;
  const registrationSafaricom = {
    referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
    fspName: FinancialServiceProviderName.safaricom,
    phoneNumber: '254708374149',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    maxPayments: 6,
    fullName: 'Barbara Floyd',
    gender: 'male',
    age: 25,
    maritalStatus: 'married',
    registrationType: 'self',
    nationalId: 32121321,
    nameAlternate: 'test',
    totalHH: 56,
    totalSub5: 1,
    totalAbove60: 1,
    otherSocialAssistance: 'no',
    county: 'ethiopia',
    subCounty: 'ethiopia',
    ward: 'dsa',
    location: 21,
    subLocation: 2113,
    village: 'adis abea',
    nearestSchool: 213321,
    areaType: 'urban',
    mainSourceLivelihood: 'salary_from_formal_employment',
    mainSourceLivelihoodOther: 213,
    Male05: 1,
    Female05: 0,
    Male612: 0,
    Female612: 0,
    Male1324: 0,
    Female1324: 0,
    Male2559: 0,
    Female2559: 0,
    Male60: 0,
    Female60: 0,
    maleTotal: 0,
    femaleTotal: 0,
    householdMembersDisability: 'no',
    disabilityAmount: 0,
    householdMembersChronicIllness: 'no',
    chronicIllnessAmount: 0,
    householdMembersPregnantLactating: 'no',
    pregnantLactatingAmount: 0,
    habitableRooms: 0,
    tenureStatusOfDwelling: 'Owner occupied',
    ownerOccupiedState: 'purchased',
    ownerOccupiedStateOther: 0,
    rentedFrom: 'individual',
    rentedFromOther: 0,
    constructionMaterialRoof: 'tin',
    ifRoofOtherSpecify: 31213,
    constructionMaterialWall: 'tiles',
    ifWallOtherSpecify: 231312,
    constructionMaterialFloor: 'cement',
    ifFloorOtherSpecify: 'asdsd',
    dwellingRisk: 'fire',
    ifRiskOtherSpecify: 123213,
    mainSourceOfWater: 'lake',
    ifWaterOtherSpecify: 'dasdas',
    pigs: 'no',
    ifYesPigs: 123123,
    chicken: 'no',
    mainModeHumanWasteDisposal: 'septic_tank',
    ifHumanWasteOtherSpecify: 31213,
    cookingFuel: 'electricity',
    ifFuelOtherSpecify: 'asdsda',
    Lighting: 'electricity',
    ifLightingOtherSpecify: 'dasasd',
    householdItems: 'none',
    excoticCattle: 'no',
    ifYesExoticCattle: 12231123,
    IndigenousCattle: 'no',
    ifYesIndigenousCattle: 123132123,
    sheep: 'no',
    ifYesSheep: 12312312,
    goats: 'no',
    ifYesGoats: 312123,
    camels: 'no',
    ifYesCamels: 312123,
    donkeys: 'no',
    ifYesDonkeys: 213312,
    ifYesChicken: 2,
    howManyBirths: 0,
    howManyDeaths: 0,
    householdConditions: 'poor',
    skipMeals: 'no',
    receivingBenefits: 0,
    ifYesNameProgramme: 0,
    typeOfBenefit: 'in_kind',
    ifOtherBenefit: 2123312,
    ifCash: 12312,
    ifInKind: 132132,
    feedbackOnRespons: 'no',
    ifYesFeedback: 312123,
    whoDecidesHowToSpend: 'male_household_head',
    possibilityForConflicts: 'no',
    genderedDivision: 'no',
    ifYesElaborate: 'asddas',
    geopoint: 123231,
  };

  describe('with FSP: Safaricom', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.krcsMultiple);
      accessToken = await getAccessToken();
    });

    it('should successfully pay-out', async () => {
      // Arrange
      await importRegistrations(
        programId,
        [registrationSafaricom],
        accessToken,
      );

      await awaitChangePaStatus(
        programId,
        [registrationSafaricom.referenceId],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [registrationSafaricom.referenceId];

      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      // Assert
      let getTransactionsBody: any[] = [];
      while (getTransactionsBody.length <= 0) {
        getTransactionsBody = (
          await getTransactions(
            programId,
            payment,
            registrationSafaricom.referenceId,
            accessToken,
          )
        ).body;
        if (getTransactionsBody.length > 0) {
          break;
        }
        await waitFor(2_000);
      }

      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(getTransactionsBody[0].status).toBe(StatusEnum.success);
      expect(getTransactionsBody[0].errorMessage).toBe(null);
    });

    it('should give error about phoneNumber', async () => {
      const program = {
        allowEmptyPhoneNumber: true,
      };

      // Act
      // Call the update function
      await patchProgram(2, program as UpdateProgramDto, accessToken);

      // Arrange
      registrationSafaricom.phoneNumber = '';
      await importRegistrations(
        programId,
        [registrationSafaricom],
        accessToken,
      );
      await awaitChangePaStatus(
        programId,
        [registrationSafaricom.referenceId],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [registrationSafaricom.referenceId];

      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      // Assert
      let getTransactionsBody: any[] = [];
      while (getTransactionsBody.length <= 0) {
        getTransactionsBody = (
          await getTransactions(
            programId,
            payment,
            registrationSafaricom.referenceId,
            accessToken,
          )
        ).body;
        if (getTransactionsBody.length > 0) {
          break;
        }
        await waitFor(2_000);
      }

      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(getTransactionsBody[0].status).toBe(StatusEnum.error);
      expect(getTransactionsBody[0].errorMessage).toBe(
        'The initiator information is invalid.',
      );
    });
  });
});

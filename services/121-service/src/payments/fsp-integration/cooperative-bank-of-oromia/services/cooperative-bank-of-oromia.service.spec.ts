import { Test, TestingModule } from '@nestjs/testing';

import { CooperativeBankOfOromiaDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaError } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/errors/cooperative-bank-of-oromia.error';
import { CooperativeBankOfOromiaApiService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.service';
import { CooperativeBankOfOromiaService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.service';

const responseSuccess = {
  result: CooperativeBankOfOromiaDisbursementResultEnum.success,
  message: '',
};

const responseFail = {
  result: CooperativeBankOfOromiaDisbursementResultEnum.fail as const,
  message: 'mock failure message',
};

const responseAmbiguous = {
  result: CooperativeBankOfOromiaDisbursementResultEnum.ambiguous,
  message: 'mock ambiguous message',
};

const responseDuplicate = {
  result: CooperativeBankOfOromiaDisbursementResultEnum.duplicate,
  message: 'mock duplicate message',
};

describe('CooperativeBankOfOromiaService', () => {
  let service: CooperativeBankOfOromiaService;
  let apiService: CooperativeBankOfOromiaApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CooperativeBankOfOromiaService,
        {
          provide: CooperativeBankOfOromiaApiService,
          useValue: {
            disburse: jest.fn().mockResolvedValue(responseSuccess),
            enquire: jest.fn().mockResolvedValue(responseSuccess),
          },
        },
      ],
    }).compile();

    service = module.get<CooperativeBankOfOromiaService>(CooperativeBankOfOromiaService);
    apiService = module.get<CooperativeBankOfOromiaApiService>(CooperativeBankOfOromiaApiService);
  });

  describe('attemptOrCheckDisbursement', () => {
    const amount = 200;
    const cooperativeBankOfOromiaTransactionId = 'mock-transaction-id';
    const phoneNumber = '260000000000';
    const phoneNumberWithoutCountryCode = phoneNumber.slice(3); // Remove country code '260'

    // Happy path
    it('should send a disbursement request', async () => {
      // Act
      const result = await service.attemptOrCheckDisbursement({
        cooperativeBankOfOromiaTransactionId,
        phoneNumber,
        amount,
      });

      // Assert
      expect(result).toEqual(undefined);
      expect(apiService.disburse).toHaveBeenCalledWith(
        expect.objectContaining({
          cooperativeBankOfOromiaTransactionId,
          phoneNumberWithoutCountryCode,
          amount,
        }),
      );
    });

    it('should throw an CooperativeBankOfOromiaError if the phoneNumber has the wrong length', async () => {
      // Arrange
      const invalidPhoneNumber = '26012345'; // Too short

      // Act
      let error: CooperativeBankOfOromiaError | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.attemptOrCheckDisbursement({
          cooperativeBankOfOromiaTransactionId,
          phoneNumber: invalidPhoneNumber,
          amount,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(CooperativeBankOfOromiaError);
      expect(error.message).toMatchSnapshot();
      expect(error.type).toBe(CooperativeBankOfOromiaDisbursementResultEnum.fail);
      expect(apiService.disburse).not.toHaveBeenCalled();
    });

    it('should throw an CooperativeBankOfOromiaError if disburse returns fail', async () => {
      // Arrange
      jest.spyOn(apiService, 'disburse').mockResolvedValue(responseFail);

      // Act
      let error: CooperativeBankOfOromiaError | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.attemptOrCheckDisbursement({
          cooperativeBankOfOromiaTransactionId,
          phoneNumber,
          amount,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(CooperativeBankOfOromiaError);
      expect(error.message).toMatchSnapshot();
      expect(error.type).toBe(CooperativeBankOfOromiaDisbursementResultEnum.fail);
    });

    it('should throw an CooperativeBankOfOromiaError if disburse returns ambiguous', async () => {
      // Arrange
      jest.spyOn(apiService, 'disburse').mockResolvedValue(responseAmbiguous);

      // Act
      let error: CooperativeBankOfOromiaError | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.attemptOrCheckDisbursement({
          cooperativeBankOfOromiaTransactionId,
          phoneNumber,
          amount,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(CooperativeBankOfOromiaError);
      expect(error.message).toMatchSnapshot();
      expect(error.type).toBe(CooperativeBankOfOromiaDisbursementResultEnum.ambiguous);
    });

    describe('when disburse call returns "duplicate"', () => {
      beforeEach(() => {
        // Overrides the one in the outer beforeEach.
        jest.spyOn(apiService, 'disburse').mockResolvedValue(responseDuplicate);
      });

      it('should call enquire endpoint', async () => {
        // Act
        await service.attemptOrCheckDisbursement({
          cooperativeBankOfOromiaTransactionId,
          phoneNumber,
          amount,
        });

        // Assert
        expect(apiService.enquire).toHaveBeenCalledWith(
          expect.objectContaining({
            cooperativeBankOfOromiaTransactionId,
          }),
        );
      });

      it('if enquire endpoint returns "success" this should return undefined', async () => {
        // Act
        const result = await service.attemptOrCheckDisbursement({
          cooperativeBankOfOromiaTransactionId,
          phoneNumber,
          amount,
        });

        // Assert
        expect(result).toEqual(undefined);
      });

      it('if enquire endpoint returns "fail" we should get an CooperativeBankOfOromiaError', async () => {
        // Arrange
        jest.spyOn(apiService, 'enquire').mockResolvedValue(responseFail);

        // Act
        let error: CooperativeBankOfOromiaError | any; // The any is unfortunately needed to prevent type errors
        try {
          await service.attemptOrCheckDisbursement({
            cooperativeBankOfOromiaTransactionId,
            phoneNumber,
            amount,
          });
        } catch (e) {
          error = e;
        }

        // Assert
        expect(error).toBeInstanceOf(CooperativeBankOfOromiaError);
        expect(error.message).toMatchSnapshot();
        expect(error.type).toBe(CooperativeBankOfOromiaDisbursementResultEnum.fail);
      });
    });
  });
});

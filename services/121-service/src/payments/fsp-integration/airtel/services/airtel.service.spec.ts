import { Test, TestingModule } from '@nestjs/testing';

import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';
import { AirtelError } from '@121-service/src/payments/fsp-integration/airtel/errors/airtel.error';
import { AirtelApiService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.api.service';
import { AirtelService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.service';

const responseSuccess = {
  result: AirtelDisbursementResultEnum.success,
  message: '',
};

const responseFail = {
  result: AirtelDisbursementResultEnum.fail as const,
  message: 'mock failure message',
};

const responseAmbiguous = {
  result: AirtelDisbursementResultEnum.ambiguous,
  message: 'mock ambiguous message',
};

const responseDuplicate = {
  result: AirtelDisbursementResultEnum.duplicate,
  message: 'mock duplicate message',
};

describe('AirtelService', () => {
  let service: AirtelService;
  let apiService: AirtelApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AirtelService,
        {
          provide: AirtelApiService,
          useValue: {
            disburse: jest.fn().mockResolvedValue(responseSuccess),
            enquire: jest.fn().mockResolvedValue(responseSuccess),
          },
        },
      ],
    }).compile();

    service = module.get<AirtelService>(AirtelService);
    apiService = module.get<AirtelApiService>(AirtelApiService);
  });

  describe('attemptOrCheckDisbursement', () => {
    const amount = 200;
    const airtelTransactionId = 'mock-transaction-id';
    const phoneNumber = '260000000000';
    const phoneNumberWithoutCountryCode = phoneNumber.slice(3); // Remove country code '260'

    // Happy path
    it('should send a disbursement request', async () => {
      // Act
      const result = await service.attemptOrCheckDisbursement({
        airtelTransactionId,
        phoneNumber,
        amount,
      });

      // Assert
      expect(result).toEqual(undefined);
      expect(apiService.disburse).toHaveBeenCalledWith(
        expect.objectContaining({
          airtelTransactionId,
          phoneNumberWithoutCountryCode,
          amount,
        }),
      );
    });

    it('should throw an AirtelError if the phoneNumber has the wrong length', async () => {
      // Arrange
      const invalidPhoneNumber = '26012345'; // Too short

      // Act
      let error: AirtelError | Error; // Handle both custom and generic errors
      try {
        await service.attemptOrCheckDisbursement({
          airtelTransactionId,
          phoneNumber: invalidPhoneNumber,
          amount,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(AirtelError);
      expect(error.message).toMatchSnapshot();
      expect(error.type).toBe(AirtelDisbursementResultEnum.fail);
      expect(apiService.disburse).not.toHaveBeenCalled();
    });

    it('should throw an AirtelError if disburse returns fail', async () => {
      // Arrange
      jest.spyOn(apiService, 'disburse').mockResolvedValue(responseFail);

      // Act
      let error: AirtelError | Error; // Handle both custom and generic errors
      try {
        await service.attemptOrCheckDisbursement({
          airtelTransactionId,
          phoneNumber,
          amount,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(AirtelError);
      expect(error.message).toMatchSnapshot();
      expect(error.type).toBe(AirtelDisbursementResultEnum.fail);
    });

    it('should throw an AirtelError if disburse returns ambiguous', async () => {
      // Arrange
      jest.spyOn(apiService, 'disburse').mockResolvedValue(responseAmbiguous);

      // Act
      let error: AirtelError | Error; // Handle both custom and generic errors
      try {
        await service.attemptOrCheckDisbursement({
          airtelTransactionId,
          phoneNumber,
          amount,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(AirtelError);
      expect(error.message).toMatchSnapshot();
      expect(error.type).toBe(AirtelDisbursementResultEnum.ambiguous);
    });

    describe('when disburse call returns "duplicate"', () => {
      beforeEach(() => {
        // Overrides the one in the outer beforeEach.
        jest.spyOn(apiService, 'disburse').mockResolvedValue(responseDuplicate);
      });

      it('should call enquire endpoint', async () => {
        // Act
        await service.attemptOrCheckDisbursement({
          airtelTransactionId,
          phoneNumber,
          amount,
        });

        // Assert
        expect(apiService.enquire).toHaveBeenCalledWith(
          expect.objectContaining({
            airtelTransactionId,
          }),
        );
      });

      it('if enquire endpoint returns "succes" this should return undefined', async () => {
        // Act
        const result = await service.attemptOrCheckDisbursement({
          airtelTransactionId,
          phoneNumber,
          amount,
        });

        // Assert
        expect(result).toEqual(undefined);
      });

      it('if enquire endpoint returns "fail" we should get an AirtelError', async () => {
        // Arrange
        jest.spyOn(apiService, 'enquire').mockResolvedValue(responseFail);

        // Act
        let error: AirtelError | Error; // Handle both custom and generic errors
        try {
          await service.attemptOrCheckDisbursement({
            airtelTransactionId,
            phoneNumber,
            amount,
          });
        } catch (e) {
          error = e;
        }

        // Assert
        expect(error).toBeInstanceOf(AirtelError);
        expect(error.message).toMatchSnapshot();
        expect(error.type).toBe(AirtelDisbursementResultEnum.fail);
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';

import { AirtelService } from '@121-service/src/payments/fsp-integration/airtel/airtel.service';
import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';
import { AirtelError } from '@121-service/src/payments/fsp-integration/airtel/errors/airtel.error';
import { AirtelApiService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.api.service';
import { AirtelEncryptionService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.encryption.service';

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
            disburse: jest.fn(),
            // enquire: jest.fn(),
          },
        },
        {
          provide: AirtelEncryptionService,
          useValue: {
            encryptPinV1: jest.fn().mockReturnValue('mock-encrypted-pin'),
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
    const currencyCode = 'ZMW';
    const countryCode = 'ZM';
    const encryptedPin = 'mock-encrypted-pin';

    it('should send a disbursement request', async () => {
      // Arrange
      jest.spyOn(apiService, 'disburse').mockResolvedValue({
        result: AirtelDisbursementResultEnum.success,
        message: '',
      });
      const phoneNumber = '260000000000';

      // Act
      const result = await service.attemptOrCheckDisbursement({
        airtelTransactionId,
        phoneNumber,
        currencyCode,
        countryCode,
        amount,
      });

      // Assert
      expect(result).toEqual(undefined);
      expect(apiService.disburse).toHaveBeenCalledWith(
        expect.objectContaining({
          airtelTransactionId,
          encryptedPin,
          phoneNumberWithoutCountryCode: phoneNumber.slice(3), // Remove country code '260'
          currencyCode,
          countryCode,
          amount,
        }),
      );
    });

    it('should throw an error if the phoneNumber has the wrong length', async () => {
      // Arrange
      jest.spyOn(apiService, 'disburse').mockResolvedValue({
        result: AirtelDisbursementResultEnum.success,
        message: '',
      });
      const invalidPhoneNumber = '26012345'; // Too short

      // Act & Assert
      let error: AirtelError | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.attemptOrCheckDisbursement({
          airtelTransactionId,
          phoneNumber: invalidPhoneNumber,
          currencyCode,
          countryCode,
          amount,
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(AirtelError);
      expect(error.message).toMatchSnapshot();
      expect(error.type).toBe(AirtelDisbursementResultEnum.fail);
      expect(apiService.disburse).not.toHaveBeenCalled();
    });

    it('should throw an AirtelError with type "fail" if the phoneNumber has the wrong length', async () => {
      const invalidPhoneNumber = '26012345'; // Too short
      await expect(
        service.attemptOrCheckDisbursement({
          airtelTransactionId,
          phoneNumber: invalidPhoneNumber,
          currencyCode: 'ZMW',
          countryCode: 'ZM',
          amount,
        }),
      ).rejects.toMatchObject({
        name: 'AirtelError',
        message: expect.stringContaining('does not have a valid phone number'),
        type: 'fail',
      });
    });
  });
});

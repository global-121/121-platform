import { TwilioMessageEntity } from './../../notifications/twilio.entity';
import { IntersolveApiService } from './api/instersolve.api.service';
import { SoapService } from './api/soap.service';
import { FspAttributeEntity } from './fsp-attribute.entity';
import { fspName } from './financial-service-provider.entity';
/* eslint-disable jest/no-jasmine-globals */
import { FspService } from './fsp.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../../mock/repositoryMock.factory';
import { TransactionEntity } from '../program/transactions.entity';
import { FspCallLogEntity } from './fsp-call-log.entity';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { HttpModule } from '@nestjs/common/http';
import { ConnectionEntity } from '../../connection/connection.entity';
import { AfricasTalkingNotificationEntity } from './africastalking-notification.entity';
import { AfricasTalkingApiService } from './api/africas-talking.api.service';
import { AfricasTalkingService } from './africas-talking.service';
import { IntersolveService } from './intersolve.service';
import { WhatsappService } from '../../notifications/whatsapp/whatsapp.service';
import { ImageCodeService } from '../../notifications/imagecode/image-code.service';
import { ImageCodeEntity } from '../../notifications/imagecode/image-code.entity';
import { IntersolveBarcodeEntity } from './intersolve-barcode.entity';
import { ImageCodeExportVouchersEntity } from '../../notifications/imagecode/image-code-export-vouchers.entity';
import { PaPaymentDataDto } from './dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from './dto/payment-transaction-result.dto';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';
import { AfricasTalkingNotificationDto } from './dto/africas-talking-notification.dto';
import { ProgramEntity } from '../program/program.entity';
import { IntersolveRequestEntity } from './intersolve-request.entity';
import { IntersolveInstructionsEntity } from './intersolve-instructions.entity';

describe('Fsp service', (): void => {
  let service: FspService;
  let africasTalkingService: AfricasTalkingService;
  let module: TestingModule;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [HttpModule],
        providers: [
          FspService,
          AfricasTalkingApiService,
          AfricasTalkingService,
          SoapService,
          ImageCodeService,
          IntersolveService,
          IntersolveApiService,
          WhatsappService,
          {
            provide: getRepositoryToken(ProgramEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(TransactionEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(FspCallLogEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(FinancialServiceProviderEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(FspAttributeEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(AfricasTalkingNotificationEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(ImageCodeEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(ImageCodeExportVouchersEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(IntersolveBarcodeEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(TwilioMessageEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(ConnectionEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(IntersolveRequestEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(IntersolveInstructionsEntity),
            useFactory: repositoryMockFactory,
          },
        ],
      }).compile();

      service = module.get<FspService>(FspService);
    },
  );

  afterAll(
    async (): Promise<void> => {
      module.close();
    },
  );

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('payout', (): void => {
    const paPaymentDataList = [new PaPaymentDataDto()];
    paPaymentDataList[0].fspName = fspName.africasTalking;
    paPaymentDataList[0].paymentAddress = '+254711339581';
    const programId = 1;
    const installment = 1;
    const amount = 10;

    it.skip('should return default values', async (): Promise<void> => {
      const result = await service.payout(
        paPaymentDataList,
        programId,
        installment,
        amount,
      );
      expect(result.nrSuccessfull).toBeDefined();
      expect(service).toBeDefined();
    });

    it.skip('should return the right count of PAs', async (): Promise<void> => {
      const paymentTransactionResultDto = {
        nrSuccessfull: 0,
        nrFailed: 0,
        nrWaiting: 0,
      };
      const intersolvePaPayment = [new PaPaymentDataDto()];
      intersolvePaPayment[0].fspName = fspName.intersolve;
      const intersolveNoWhatsappPaPayment = [new PaPaymentDataDto()];
      intersolveNoWhatsappPaPayment[0].fspName = fspName.intersolveNoWhatsapp;
      const africasTalkingPaPayment = [new PaPaymentDataDto()];
      africasTalkingPaPayment[0].fspName = fspName.africasTalking;
      const paLists = {
        intersolvePaPayment,
        intersolveNoWhatsappPaPayment,
        africasTalkingPaPayment,
      };
      const transactionResults = {
        intersolveTransactionResult: new FspTransactionResultDto(),
        intersolveNoWhatsappTransactionResult: new FspTransactionResultDto(),
        africasTalkingTransactionResult: new FspTransactionResultDto(),
      };
      // @ts-ignore
      spyOn<any>(service, 'splitPaListByFsp').and.returnValue(
        Promise.resolve(paLists),
      );
      spyOn<any>(service, 'makePaymentRequest').and.returnValue(
        Promise.resolve(transactionResults),
      );
      spyOn<any>(service, 'storeAllTransactions').and.returnValue(
        Promise.resolve(),
      );
      spyOn<any>(service, 'calcAggregateStatus').and.returnValue(
        Promise.resolve(paymentTransactionResultDto),
      );

      const result = await service.payout(
        paPaymentDataList,
        programId,
        installment,
        amount,
      );
      const countResult =
        result.nrSuccessfull + result.nrFailed + result.nrWaiting;
      const countInput =
        paLists.africasTalkingPaPayment.length +
        paLists.intersolveNoWhatsappPaPayment.length +
        paLists.intersolvePaPayment.length;
      expect(countResult).toBe(countInput);
    });
  });

  describe('checkPaymentValidation', (): void => {
    const fsp = fspName.africasTalking;
    const africasTalkingValidationData = new AfricasTalkingValidationDto();

    it('should return Validated', async (): Promise<void> => {
      // @ts-ignore
      const result = await service.checkPaymentValidation(
        fsp,
        africasTalkingValidationData,
      );
      expect(result.status).toBe('Validated');
    });
  });

  describe('processPaymentNotification', (): void => {
    const programId = 1;
    const installment = 1;
    const amount = 10;
    const fsp = fspName.africasTalking;
    const africasTalkingNotificationData = new AfricasTalkingNotificationDto();
    it.skip('should return default values', async (): Promise<void> => {
      // @ts-ignore
      const result = await service.processPaymentNotification(
        fsp,
        africasTalkingNotificationData,
      );
      expect(result).toBeDefined();
      expect(service).toBeDefined();
    });

    it.skip('should return store a transaction', async (): Promise<void> => {
      const enrichedTransaction = {
        paTransactionResult: new PaTransactionResultDto(),
        programId,
        installment,
        amount,
      };
      spyOn(africasTalkingService, 'processNotification').and.returnValue(
        Promise.resolve(enrichedTransaction),
      );
      // Comment add <any> to mock private functions
      spyOn<any>(service, 'storeTransaction').and.returnValue(
        Promise.resolve(),
      );
      // @ts-ignore
      const result = await service.processPaymentNotification(
        fsp,
        africasTalkingNotificationData,
      );
      expect(result).toBeDefined();
    });
  });
});

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
import { ProgramEntity } from '../program/program.entity';
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';
import { StatusEnum } from '../../shared/enum/status.enum';
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

describe('Fsp service', (): void => {
  let service: FspService;
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
    const programId = 1;
    const installment = 1;
    const amount = 10;

    it('should return default values', async (): Promise<void> => {
      const result = await service.payout(
        paPaymentDataList,
        programId,
        installment,
        amount,
      );
      expect(result.nrSuccessfull).toBeDefined();
      expect(service).toBeDefined();
    });

    it('should return the right count of PAs', async (): Promise<void> => {
      const paymentTransactionResultDto = {
        nrSuccessfull: 0,
        nrFailed: 0,
        nrWaiting: 0,
      };
      const paLists = {
        intersolvePaPayment: [new PaPaymentDataDto()],
        intersolveNoWhatsappPaPayment: [new PaPaymentDataDto()],
        africasTalkingPaPayment: [new PaPaymentDataDto()],
      };
      const transactionResults = {
        intersolveTransactionResult: new FspTransactionResultDto(),
        intersolveNoWhatsappTransactionResult: new FspTransactionResultDto(),
        africasTalkingTransactionResult: new FspTransactionResultDto(),
      };
      // @ts-ignore
      spyOn(service, 'splitPaListByFsp').and.returnValue(
        Promise.resolve(paLists),
      );
      spyOn(service, 'makePaymentRequest').and.returnValue(
        Promise.resolve(transactionResults),
      );
      spyOn(service, 'storeAllTransactions').and.returnValue(Promise.resolve());
      // Comment add <any> to mock private functions
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

    // it('should return paymentResult status succes', async (): Promise<void> => {
    //   const statusMessageDto = {
    //     status: StatusEnum.success,
    //     message: {},
    //   };
    //   // @ts-ignore
    //   spyOn(service, 'createPaymentDetails').and.returnValue(
    //     Promise.resolve(paymentDetailsDto),
    //   );
    //   spyOn(service, 'sendPayment').and.returnValue(
    //     Promise.resolve(statusMessageDto),
    //   );
    //   spyOn(service, 'logFspCall').and.returnValue(Promise.resolve());
    //   // Add <any> to mock private functions
    //   spyOn<any>(service, 'storeTransaction').and.returnValue(
    //     Promise.resolve(),
    //   );
    //   const result = await service.createSendPaymentListFsp(
    //     fsp,
    //     connections,
    //     10,
    //     program,
    //     1,
    //   );
    //   expect(result.nrConnectionsFsp).toBe(connectionList.length);
    //   expect(result.paymentResult.status).toBe(StatusEnum.success);
    //   // This ts-ignore can be used to test if a private function has been called
    //   // @ts-ignore
    //   expect(service.storeTransaction).toHaveBeenCalled();
    // });
    // it('should return paymentResult status error', async (): Promise<void> => {
    //   const statusMessageDto = {
    //     status: StatusEnum.error,
    //     message: {},
    //   };
    //   // @ts-ignore
    //   spyOn(service, 'createPaymentDetails').and.returnValue(
    //     Promise.resolve(paymentDetailsDto),
    //   );

    //   spyOn(service, 'sendPayment').and.returnValue(
    //     Promise.resolve(statusMessageDto),
    //   );
    //   spyOn(service, 'logFspCall').and.returnValue(Promise.resolve());
    //   // Add <any> to mock private functions
    //   spyOn<any>(service, 'storeTransaction').and.returnValue(
    //     Promise.resolve(),
    //   );

    //   const result = await service.createSendPaymentListFsp(
    //     fsp,
    //     connections,
    //     10,
    //     program,
    //     1,
    //   );
    //   expect(result.nrConnectionsFsp).toBe(connectionList.length);
    //   expect(result.paymentResult.status).toBe(StatusEnum.error);
    // });
  });

  describe('checkPaymentValidation', (): void => {
    const fsp = fspName.africasTalking;
    const africasTalkingValidationData = new AfricasTalkingValidationDto();
    it('should return default values', async (): Promise<void> => {
      // @ts-ignore
      const result = await service.checkPaymentValidation(
        fsp,
        africasTalkingValidationData,
      );
      expect(result).toBeDefined();
      expect(service).toBeDefined();
    });

    it('should return Validated', async (): Promise<void> => {
      // @ts-ignore
      const result = await service.checkPaymentValidation(
        fsp,
        africasTalkingValidationData,
      );
      expect(result).toBe('Validated');
    });

    // it('should return nr of intersolve connections', async (): Promise<
    //   void
    // > => {
    //   const connectionInterSolve = new ConnectionEntity();
    //   connectionInterSolve.fsp = fspIntersolve;
    //   connectionInterSolve.customData = JSON.parse(`{ "phone": "+21" }`);
    //   const fspAttr = new FspAttributeEntity();
    //   fspAttr.name = 'phone';
    //   fspIntersolve.attributes = [fspAttr];

    //   const connsInstersolve = [
    //     connectionInterSolve,
    //     connectionInterSolve,
    //     connectionInterSolve,
    //   ];

    //   spyOn(service, 'getFspById').and.returnValue(
    //     Promise.resolve(fspIntersolve),
    //   );
    //   // @ts-ignore
    //   const result = await service.createPaymentDetails(
    //     connsInstersolve,
    //     amount,
    //     1,
    //   );
    //   expect(result.connectionsForFsp.length).toBe(connsInstersolve.length);
    //   expect(result.paymentList[0].amount).toBe(amount);
    //   expect(result.paymentList[0].phone).toBe('+21');
    // });
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
      spyOn(
        service,
        'africasTalkingService.processNotification',
      ).and.returnValue(Promise.resolve(enrichedTransaction));
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

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

  describe('createSendPaymentListFsp', (): void => {
    const connections = [new ConnectionEntity()];
    const program = new ProgramEntity();
    const fsp = new FinancialServiceProviderEntity();
    fsp.id = 1;

    const connectionList = [new ConnectionEntity()];
    const paymentDetailsDto = {
      paymentList: connectionList,
      connectionsForFsp: connectionList,
    };

    it('should return default values', async (): Promise<void> => {
      const result = await service.createSendPaymentListFsp(
        fsp,
        connections,
        10,
        program,
        1,
      );
      expect(result.nrConnectionsFsp).toBeDefined();
      expect(service).toBeDefined();
    });

    it('should return paymentResult status succes with default values', async (): Promise<
      void
    > => {
      const statusMessageDto = {
        status: StatusEnum.success,
        message: {},
      };
      // @ts-ignore
      spyOn(service, 'createPaymentDetails').and.returnValue(
        Promise.resolve(paymentDetailsDto),
      );
      spyOn(service, 'sendPayment').and.returnValue(
        Promise.resolve(statusMessageDto),
      );
      spyOn(service, 'logFspCall').and.returnValue(Promise.resolve());
      // Comment add <any> to mock private functions
      spyOn<any>(service, 'storeTransaction').and.returnValue(
        Promise.resolve(),
      );

      const result = await service.createSendPaymentListFsp(
        fsp,
        connections,
        10,
        program,
        1,
      );
      expect(result.nrConnectionsFsp).toBe(connectionList.length);
      expect(result.paymentResult.status).toBe(StatusEnum.success);
    });

    it('should return paymentResult status succes', async (): Promise<void> => {
      const statusMessageDto = {
        status: StatusEnum.success,
        message: {},
      };
      // @ts-ignore
      spyOn(service, 'createPaymentDetails').and.returnValue(
        Promise.resolve(paymentDetailsDto),
      );
      spyOn(service, 'sendPayment').and.returnValue(
        Promise.resolve(statusMessageDto),
      );
      spyOn(service, 'logFspCall').and.returnValue(Promise.resolve());
      // Add <any> to mock private functions
      spyOn<any>(service, 'storeTransaction').and.returnValue(
        Promise.resolve(),
      );
      const result = await service.createSendPaymentListFsp(
        fsp,
        connections,
        10,
        program,
        1,
      );
      expect(result.nrConnectionsFsp).toBe(connectionList.length);
      expect(result.paymentResult.status).toBe(StatusEnum.success);
      // This ts-ignore can be used to test if a private function has been called
      // @ts-ignore
      expect(service.storeTransaction).toHaveBeenCalled();
    });
    it('should return paymentResult status error', async (): Promise<void> => {
      const statusMessageDto = {
        status: StatusEnum.error,
        message: {},
      };
      // @ts-ignore
      spyOn(service, 'createPaymentDetails').and.returnValue(
        Promise.resolve(paymentDetailsDto),
      );

      spyOn(service, 'sendPayment').and.returnValue(
        Promise.resolve(statusMessageDto),
      );
      spyOn(service, 'logFspCall').and.returnValue(Promise.resolve());
      // Add <any> to mock private functions
      spyOn<any>(service, 'storeTransaction').and.returnValue(
        Promise.resolve(),
      );

      const result = await service.createSendPaymentListFsp(
        fsp,
        connections,
        10,
        program,
        1,
      );
      expect(result.nrConnectionsFsp).toBe(connectionList.length);
      expect(result.paymentResult.status).toBe(StatusEnum.error);
    });
  });

  describe('createPaymentDetails', (): void => {
    const amount = 10;
    const connections = [new ConnectionEntity()];
    const fspIntersolve = new FinancialServiceProviderEntity();
    fspIntersolve.id = 1;
    fspIntersolve.fsp = fspName.intersolve;
    const fspMpesa = new FinancialServiceProviderEntity();
    fspMpesa.id = 1;
    fspMpesa.fsp = fspName.mpesa;
    const paymentList = [];
    it('should return default values', async (): Promise<void> => {
      // @ts-ignore
      const result = await service.createPaymentDetails(connections, 10, 1);
      expect(result.connectionsForFsp).toBeDefined();
      expect(service).toBeDefined();
    });

    it('should return PaymentDetailsDto with a paymentlist with default values', async (): Promise<
      void
    > => {
      spyOn(service, 'getFspById').and.returnValue(
        Promise.resolve(fspIntersolve),
      );
      // @ts-ignore
      const result = await service.createPaymentDetails(connections, amount, 1);
      expect(result.paymentList.length).toBe(paymentList.length);
    });

    it('should return nr of intersolve connections', async (): Promise<
      void
    > => {
      const connectionInterSolve = new ConnectionEntity();
      connectionInterSolve.fsp = fspIntersolve;
      connectionInterSolve.customData = JSON.parse(`{ "phone": "+21" }`);
      const fspAttr = new FspAttributeEntity();
      fspAttr.name = 'phone';
      fspIntersolve.attributes = [fspAttr];

      const connsInstersolve = [
        connectionInterSolve,
        connectionInterSolve,
        connectionInterSolve,
      ];

      spyOn(service, 'getFspById').and.returnValue(
        Promise.resolve(fspIntersolve),
      );
      // @ts-ignore
      const result = await service.createPaymentDetails(
        connsInstersolve,
        amount,
        1,
      );
      expect(result.connectionsForFsp.length).toBe(connsInstersolve.length);
      expect(result.paymentList[0].amount).toBe(amount);
      expect(result.paymentList[0].phone).toBe('+21');
    });
  });
});

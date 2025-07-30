import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { PaymentsHelperService } from '@121-service/src/payments/payments.helper.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';

describe('PaymentsHelperService', () => {
  let service: PaymentsHelperService;
  let programRepository: Repository<ProgramEntity>;
  let programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsHelperService,
        {
          provide: getRepositoryToken(ProgramEntity),
          useValue: {
            findOneByOrFail: jest.fn(),
            findOneOrFail: jest.fn(),
          },
        },
        {
          provide: ProgramRegistrationAttributeRepository,
          useValue: {
            find: jest.fn().mockReturnValue(() => []),
          },
        },
      ],
    }).compile();

    service = module.get(PaymentsHelperService);
    programRepository = module.get(getRepositoryToken(ProgramEntity));
    programRegistrationAttributeRepository = module.get(
      ProgramRegistrationAttributeRepository,
    );
  });

  describe('getSelectForExport', () => {
    it('returns default and export attributes', async () => {
      const customAttributeName1 = 'custom1';
      const customAttributeName2 = 'custom2';
      (programRepository.findOneByOrFail as jest.Mock).mockResolvedValue({
        enableMaxPayments: false,
        enableScope: false,
      });
      (
        programRegistrationAttributeRepository.find as jest.Mock
      ).mockResolvedValue([
        { name: customAttributeName1 },
        { name: customAttributeName2 },
      ]);
      const result = await service.getSelectForExport(1);
      expect(result).toContain(customAttributeName1);
      expect(result).toContain(customAttributeName2);
      expect(result).toContain(GenericRegistrationAttributes.referenceId);
    });

    it('includes maxPayments and scope if enabled', async () => {
      (programRepository.findOneByOrFail as jest.Mock).mockResolvedValue({
        enableMaxPayments: true,
        enableScope: true,
      });
      (
        programRegistrationAttributeRepository.find as jest.Mock
      ).mockResolvedValue([]);
      const result = await service.getSelectForExport(1);
      expect(result).toContain(GenericRegistrationAttributes.maxPayments);
      expect(result).toContain(GenericRegistrationAttributes.scope);
    });
  });

  describe('getFspSpecificJoinFields', () => {
    it('returns Safaricom join fields', async () => {
      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        programFspConfigurations: [{ fspName: Fsps.safaricom }],
      });
      const result = await service.getFspSpecificJoinFields(1);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            entityJoinedToTransaction: SafaricomTransferEntity,
            attribute: 'mpesaTransactionId',
            alias: 'mpesaTransactionId',
          }),
        ]),
      );
    });

    it('returns Nedbank join fields', async () => {
      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        programFspConfigurations: [{ fspName: Fsps.nedbank }],
      });
      const result = await service.getFspSpecificJoinFields(1);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            attribute: 'status',
            alias: 'nedbankVoucherStatus',
          }),
          expect.objectContaining({
            attribute: 'orderCreateReference',
            alias: 'nedbankOrderCreateReference',
          }),
          expect.objectContaining({
            attribute: 'paymentReference',
            alias: 'nedbankPaymentReference',
          }),
        ]),
      );
    });

    it('returns empty array if no matching FSPs', async () => {
      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        programFspConfigurations: [],
      });
      const result = await service.getFspSpecificJoinFields(1);
      expect(result).toEqual([]);
    });
  });
});

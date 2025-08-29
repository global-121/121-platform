import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { PaymentsReportingHelperService } from '@121-service/src/payments/services/payments-reporting.helper.service';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { ProjectRegistrationAttributeRepository } from '@121-service/src/projects/repositories/project-registration-attribute.repository';
import {
  DefaultRegistrationDataAttributeNames,
  GenericRegistrationAttributes,
} from '@121-service/src/registration/enum/registration-attribute.enum';

describe('PaymentsReportingHelperService', () => {
  let service: PaymentsReportingHelperService;
  let projectRepository: Repository<ProjectEntity>;
  let projectRegistrationAttributeRepository: ProjectRegistrationAttributeRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsReportingHelperService,
        {
          provide: getRepositoryToken(ProjectEntity),
          useValue: {
            findOneByOrFail: jest.fn(),
            findOneOrFail: jest.fn(),
          },
        },
        {
          provide: ProjectRegistrationAttributeRepository,
          useValue: {
            find: jest.fn().mockReturnValue(() => []),
          },
        },
      ],
    }).compile();

    service = module.get(PaymentsReportingHelperService);
    projectRepository = module.get(getRepositoryToken(ProjectEntity));
    projectRegistrationAttributeRepository = module.get(
      ProjectRegistrationAttributeRepository,
    );
  });

  describe('getSelectForExport', () => {
    const defaultSelect = [
      DefaultRegistrationDataAttributeNames.name,
      GenericRegistrationAttributes.registrationProjectId,
      GenericRegistrationAttributes.phoneNumber,
      GenericRegistrationAttributes.preferredLanguage,
      GenericRegistrationAttributes.paymentAmountMultiplier,
      GenericRegistrationAttributes.projectFspConfigurationLabel,
      GenericRegistrationAttributes.paymentCount,
    ];

    it('returns export attributes', async () => {
      // Arrange
      const customAttributeName1 = 'custom1';
      const customAttributeName2 = 'custom2';
      (projectRepository.findOneByOrFail as jest.Mock).mockResolvedValue({
        enableMaxPayments: false,
        enableScope: false,
      });
      (
        projectRegistrationAttributeRepository.find as jest.Mock
      ).mockResolvedValue([
        { name: customAttributeName1 },
        { name: customAttributeName2 },
      ]);

      // Act
      const result = await service.getSelectForExport(1);

      // Assert
      const expectedAttributes = [
        ...defaultSelect,
        customAttributeName1,
        customAttributeName2,
      ];
      expect(result).toStrictEqual(expectedAttributes);
    });

    it('includes maxPayments and scope if enabled', async () => {
      // Arrange
      (projectRepository.findOneByOrFail as jest.Mock).mockResolvedValue({
        enableMaxPayments: true,
        enableScope: true,
      });
      (
        projectRegistrationAttributeRepository.find as jest.Mock
      ).mockResolvedValue([]);

      // Act
      const result = await service.getSelectForExport(1);

      // Assert
      const expectedAttributes = [
        ...defaultSelect,
        GenericRegistrationAttributes.maxPayments,
        GenericRegistrationAttributes.scope,
      ];
      expect(result).toStrictEqual(expectedAttributes);
    });
  });

  describe('getFspSpecificJoinFields', () => {
    it('returns Safaricom join fields', async () => {
      // Arrange
      (projectRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        projectFspConfigurations: [{ fspName: Fsps.safaricom }],
      });

      // Act
      const result = await service.getFspSpecificJoinFields(1);

      // Assert
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
      // Arrange
      (projectRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        projectFspConfigurations: [{ fspName: Fsps.nedbank }],
      });

      // Act
      const result = await service.getFspSpecificJoinFields(1);

      // Assert
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
      // Arrange
      (projectRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        projectFspConfigurations: [],
      });
      // Act
      const result = await service.getFspSpecificJoinFields(1);
      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('createTransactionsExportFilename', () => {
    it('should include all parts when all arguments are provided', () => {
      // Arrange
      const projectId = 42;
      const fromDate = new Date('2024-01-01T12:00:00Z');
      const toDate = new Date('2024-01-31T18:30:00Z');
      const payment = 3;
      const fromDateString = '2024-01-01T12-00-00';
      const toDateString = '2024-01-31T18-30-00';
      const paymentString = `payment_${payment}`;
      const expected = `transactions_${projectId}_${fromDateString}_${toDateString}_${paymentString}`;

      // Act
      const result = service.createTransactionsExportFilename(
        projectId,
        fromDate,
        toDate,
        payment,
      );

      // Assert
      expect(result).toBe(expected);
    });

    it('should omit fromDate if not provided', () => {
      // Arrange
      const projectId = 1;
      const toDate = new Date('2024-02-01T00:00:00Z');
      const payment = 2;
      const toDateString = '2024-02-01T00-00-00';
      const paymentString = `payment_${payment}`;
      const expected = `transactions_${projectId}_${toDateString}_${paymentString}`;

      // Act
      const result = service.createTransactionsExportFilename(
        projectId,
        undefined,
        toDate,
        payment,
      );

      // Assert
      expect(result).toBe(expected);
    });

    it('should omit toDate if not provided', () => {
      // Arrange
      const projectId = 5;
      const fromDate = new Date('2024-03-01T10:00:00Z');
      const payment = 7;
      const fromDateString = '2024-03-01T10-00-00';
      const paymentString = `payment_${payment}`;
      const expected = `transactions_${projectId}_${fromDateString}_${paymentString}`;

      // Act
      const result = service.createTransactionsExportFilename(
        projectId,
        fromDate,
        undefined,
        payment,
      );

      // Assert
      expect(result).toBe(expected);
    });

    it('should omit payment if not provided', () => {
      // Arrange
      const projectId = 9;
      const fromDate = new Date('2024-04-01T08:00:00Z');
      const toDate = new Date('2024-04-30T20:00:00Z');
      const fromDateString = '2024-04-01T08-00-00';
      const toDateString = '2024-04-30T20-00-00';
      const expected = `transactions_${projectId}_${fromDateString}_${toDateString}`;

      // Act
      const result = service.createTransactionsExportFilename(
        projectId,
        fromDate,
        toDate,
        undefined,
      );

      // Assert
      expect(result).toBe(expected);
    });

    it('should only include projectId if nothing else is provided', () => {
      // Arrange
      const projectId = 99;
      const expected = `transactions_${projectId}`;

      // Act
      const result = service.createTransactionsExportFilename(projectId);

      // Assert
      expect(result).toBe(expected);
    });
  });
});

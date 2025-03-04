import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

import { EventsService } from '@121-service/src/events/events.service';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utilts/registration-utils.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationsService } from '@121-service/src/registration/registrations.service';
import { DistinctRegistrationPairRepository } from '@121-service/src/registration/repositories/distinct-registration-pair.repository';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { RegistrationsImportService } from '@121-service/src/registration/services/registrations-import.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserService } from '@121-service/src/user/user.service';

describe('RegistrationsService', () => {
  let service: RegistrationsService;
  let registrationScopedRepository: RegistrationScopedRepository;
  let distinctRegistrationPairRepository: DistinctRegistrationPairRepository;
  let eventsService: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsService,
        {
          provide: RegistrationScopedRepository,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneOrFail: jest.fn(),
            getWithRelationsByReferenceIdAndProgramId: jest.fn(),
          },
        },
        {
          provide: DistinctRegistrationPairRepository,
          useValue: {
            findOne: jest.fn(),
            store: jest.fn(),
          },
        },
        {
          provide: RegistrationViewScopedRepository,
          useValue: {
            findOne: jest.fn(),
            findOneOrFail: jest.fn(),
          },
        },
        {
          provide: EventsService,
          useValue: {
            createForDistinctRegistrationPair: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ProgramEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ProgramRegistrationAttributeEntity),
          useClass: Repository,
        },
        {
          provide: LookupService,
          useValue: {
            lookupAndCorrect: jest.fn(),
          },
        },
        {
          provide: MessageQueuesService,
          useValue: {
            addMessageJob: jest.fn(),
          },
        },
        {
          provide: InclusionScoreService,
          useValue: {
            calculateInclusionScore: jest.fn(),
            calculatePaymentAmountMultiplier: jest.fn(),
          },
        },
        {
          provide: RegistrationsImportService,
          useValue: {
            importRegistrationsFromCsv: jest.fn(),
            importRegistrations: jest.fn(),
          },
        },
        {
          provide: RegistrationDataService,
          useValue: {
            saveData: jest.fn(),
            deleteProgramRegistrationAttributeData: jest.fn(),
          },
        },
        {
          provide: IntersolveVisaService,
          useValue: {
            hasIntersolveCustomer: jest.fn(),
            retrieveAndUpdateWallet: jest.fn(),
          },
        },
        {
          provide: RegistrationsPaginationService,
          useValue: {
            getPaginate: jest.fn(),
            getRegistrationViewsByReferenceIds: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            getProgramScopeIdsUserHasPermission: jest.fn(),
          },
        },
        {
          provide: RegistrationUtilsService,
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: ProgramFinancialServiceProviderConfigurationRepository,
          useValue: {
            findOne: jest.fn(),
            getPropertiesByNamesOrThrow: jest.fn(),
          },
        },
        {
          provide: RegistrationDataScopedRepository,
          useValue: {
            getRegistrationDataArrayByName: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            }),
          },
        },
        {
          provide: RegistrationsInputValidator,
          useValue: {
            validateAndCleanInput: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RegistrationsService>(RegistrationsService);
    registrationScopedRepository = module.get<RegistrationScopedRepository>(
      RegistrationScopedRepository,
    );
    distinctRegistrationPairRepository =
      module.get<DistinctRegistrationPairRepository>(
        DistinctRegistrationPairRepository,
      );
    eventsService = module.get<EventsService>(EventsService);

    // Spy on the private method to test how it's called
    jest
      .spyOn(service as any, 'createRegistrationDistinctPair')
      .mockResolvedValue(undefined);
  });

  describe('createRegistrationDistinctPairs', () => {
    it('should throw an error if duplicate registrationIds are provided', async () => {
      const registrationIds = [1, 2, 3, 2];
      const programId = 1;
      const reason = 'testing';

      await expect(
        service.createRegistrationDistinctPairs({
          regisrationIds: registrationIds,
          programId,
          reason,
        }),
      ).rejects.toThrow(HttpException);

      expect(registrationScopedRepository.find).not.toHaveBeenCalled();
    });

    it('should create 1 pair for 2 registrations', async () => {
      const registrationIds = [1, 2];
      const programId = 1;
      const reason = 'testing';

      jest
        .spyOn(registrationScopedRepository, 'find')
        .mockResolvedValue([
          { id: 1 } as RegistrationEntity,
          { id: 2 } as RegistrationEntity,
        ]);

      await service.createRegistrationDistinctPairs({
        regisrationIds: registrationIds,
        programId,
        reason,
      });

      expect(registrationScopedRepository.find).toHaveBeenCalledWith({
        where: {
          id: In(registrationIds),
          programId: Equal(programId),
        },
        select: ['id'],
      });

      expect(service['createRegistrationDistinctPair']).toHaveBeenCalledTimes(
        1,
      );
      expect(service['createRegistrationDistinctPair']).toHaveBeenCalledWith({
        registration1Id: 1,
        registration2Id: 2,
        reason,
      });
    });

    it('should create 3 pairs for 3 registrations', async () => {
      const registrationIds = [1, 2, 3];
      const programId = 1;
      const reason = 'testing';

      jest
        .spyOn(registrationScopedRepository, 'find')
        .mockResolvedValue([
          { id: 1 } as RegistrationEntity,
          { id: 2 } as RegistrationEntity,
          { id: 3 } as RegistrationEntity,
        ]);

      await service.createRegistrationDistinctPairs({
        regisrationIds: registrationIds,
        programId,
        reason,
      });

      expect(registrationScopedRepository.find).toHaveBeenCalledWith({
        where: {
          id: In(registrationIds),
          programId: Equal(programId),
        },
        select: ['id'],
      });

      // Should call createRegistrationDistinctPair 3 times with IDs (1,2), (1,3), (2,3)
      expect(service['createRegistrationDistinctPair']).toHaveBeenCalledTimes(
        3,
      );
      expect(service['createRegistrationDistinctPair']).toHaveBeenCalledWith({
        registration1Id: 1,
        registration2Id: 2,
        reason,
      });
      expect(service['createRegistrationDistinctPair']).toHaveBeenCalledWith({
        registration1Id: 1,
        registration2Id: 3,
        reason,
      });
      expect(service['createRegistrationDistinctPair']).toHaveBeenCalledWith({
        registration1Id: 2,
        registration2Id: 3,
        reason,
      });
    });

    it('should create 6 pairs for 4 registrations', async () => {
      const registrationIds = [1, 2, 3, 4];
      const programId = 1;
      const reason = 'testing';

      jest
        .spyOn(registrationScopedRepository, 'find')
        .mockResolvedValue([
          { id: 1 } as RegistrationEntity,
          { id: 2 } as RegistrationEntity,
          { id: 3 } as RegistrationEntity,
          { id: 4 } as RegistrationEntity,
        ]);

      await service.createRegistrationDistinctPairs({
        regisrationIds: registrationIds,
        programId,
        reason,
      });

      // Should be called 6 times (n*(n-1)/2 pairs for n elements)
      expect(service['createRegistrationDistinctPair']).toHaveBeenCalledTimes(
        6,
      );
      // Verify all pairs are created
      const expectedPairs = [
        { registration1Id: 1, registration2Id: 2 },
        { registration1Id: 1, registration2Id: 3 },
        { registration1Id: 1, registration2Id: 4 },
        { registration1Id: 2, registration2Id: 3 },
        { registration1Id: 2, registration2Id: 4 },
        { registration1Id: 3, registration2Id: 4 },
      ];

      expectedPairs.forEach((pair) => {
        expect(service['createRegistrationDistinctPair']).toHaveBeenCalledWith({
          ...pair,
          reason,
        });
      });
    });
  });

  describe('createRegistrationDistinctPair', () => {
    beforeEach(() => {
      // Restore the original implementation for this test suite
      jest.restoreAllMocks();
    });

    it('should store a new distinct pair and create an event', async () => {
      // Mock required dependencies for this test
      jest
        .spyOn(distinctRegistrationPairRepository, 'findOne')
        .mockResolvedValue(null);
      jest
        .spyOn(distinctRegistrationPairRepository, 'store')
        .mockResolvedValue(undefined);
      jest
        .spyOn(registrationScopedRepository, 'findOneOrFail')
        .mockResolvedValueOnce({
          id: 1,
          registrationProgramId: 101,
        } as RegistrationEntity)
        .mockResolvedValueOnce({
          id: 2,
          registrationProgramId: 102,
        } as RegistrationEntity);
      jest
        .spyOn(eventsService, 'createForDistinctRegistrationPair')
        .mockResolvedValue(undefined);

      // Call the private method directly using any type assertion
      await (service as any).createRegistrationDistinctPair({
        registration1Id: 2, // Intentionally using larger ID first
        registration2Id: 1,
        reason: 'testing',
      });

      // Verify IDs are sorted correctly (smaller ID first)
      expect(distinctRegistrationPairRepository.findOne).toHaveBeenCalledWith({
        where: {
          smallerRegistrationId: Equal(1),
          largerRegistrationId: Equal(2),
        },
      });

      // Verify pair is stored
      expect(distinctRegistrationPairRepository.store).toHaveBeenCalledWith({
        smallerRegistrationId: 1,
        largerRegistrationId: 2,
      });

      // Verify event is created with correct data
      expect(
        eventsService.createForDistinctRegistrationPair,
      ).toHaveBeenCalledWith({
        registration1: {
          id: 1,
          registrationProgramId: 101,
        },
        registration2: {
          id: 2,
          registrationProgramId: 102,
        },
        reason: 'testing',
      });
    });

    it('should not store or create event if pair already exists', async () => {
      // Mock existing pair
      jest
        .spyOn(distinctRegistrationPairRepository, 'findOne')
        .mockResolvedValue({
          id: 1,
          smallerRegistrationId: 1,
          largerRegistrationId: 2,
        } as any);

      await (service as any).createRegistrationDistinctPair({
        registration1Id: 1,
        registration2Id: 2,
        reason: 'testing',
      });

      // Verify store and event creation are not called
      expect(distinctRegistrationPairRepository.store).not.toHaveBeenCalled();
      expect(
        eventsService.createForDistinctRegistrationPair,
      ).not.toHaveBeenCalled();
    });
  });
});

import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

import { IntersolveVisaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/intersolve-visa-account-management/intersolve-visa-account-management.service';
import { IntersolveVisaDataSynchronizationService } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa-data-synchronization/intersolve-visa-data-synchronization.service';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utils/registration-utils.service';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { UniqueRegistrationPairRepository } from '@121-service/src/registration/repositories/unique-registration-pair.repository';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { RegistrationsImportService } from '@121-service/src/registration/services/registrations-import.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserService } from '@121-service/src/user/user.service';

const programId = 10001;

describe('RegistrationsService', () => {
  let service: RegistrationsService;
  let registrationScopedRepository: RegistrationScopedRepository;
  let uniqueRegistrationPairRepository: UniqueRegistrationPairRepository;
  let registrationEventsService: RegistrationEventsService;

  beforeEach(async () => {
    const module: TestingModule §= await Test.createTestingModule({
      providers: [
        {
          provide: IntersolveVisaDataSynchronizationService,
          useValue: {
            syncData: jest.fn(),
          },
        },
        RegistrationsService,
        {
          provide: IntersolveVisaAccountManagementService,
          useValue: {
            sendCustomerInformationToIntersolve: jest.fn(),
          },
        },
        {
          provide: RegistrationScopedRepository,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneOrFail: jest.fn().mockImplementation(({ where }) => {
              const id = where.id;
              return Promise.resolve({ id, registrationProgramId: 9999 });
            }),
            getWithRelationsByReferenceIdAndProgramId: jest.fn(),
          },
        },
        {
          provide: UniqueRegistrationPairRepository,
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
          provide: RegistrationEventsService,
          useValue: {
            createForIgnoredDuplicatePair: jest.fn(),
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
          provide: ProgramFspConfigurationRepository,
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
    uniqueRegistrationPairRepository =
      module.get<UniqueRegistrationPairRepository>(
        UniqueRegistrationPairRepository,
      );
    registrationEventsService = module.get<RegistrationEventsService>(
      RegistrationEventsService,
    );
  });

  describe('createUniques', () => {
    it('should throw an error if duplicate registrationIds are provided', async () => {
      const registrationIds = [1, 2, 3, 2];
      const reason = 'testing';

      await expect(
        service.createUniques({
          registrationIds,
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

      jest
        .spyOn(registrationEventsService, 'createForIgnoredDuplicatePair')
        .mockResolvedValue(undefined);

      await service.createUniques({
        registrationIds,
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

      expect(uniqueRegistrationPairRepository.store).toHaveBeenCalledWith({
        smallerRegistrationId: 1,
        largerRegistrationId: 2,
      });
      expect(uniqueRegistrationPairRepository.store).toHaveBeenCalledTimes(1);
    });

    it('should create 3 pairs for 3 registrations', async () => {
      const registrationIds = [1, 2, 3];
      const reason = 'testing';

      jest
        .spyOn(registrationScopedRepository, 'find')
        .mockResolvedValue([
          { id: 1 } as RegistrationEntity,
          { id: 2 } as RegistrationEntity,
          { id: 3 } as RegistrationEntity,
        ]);

      jest
        .spyOn(registrationEventsService, 'createForIgnoredDuplicatePair')
        .mockResolvedValue(undefined);

      await service.createUniques({
        registrationIds,
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

      expect(uniqueRegistrationPairRepository.store).toHaveBeenCalledTimes(3);
      expect(uniqueRegistrationPairRepository.store).toHaveBeenCalledWith({
        smallerRegistrationId: 1,
        largerRegistrationId: 2,
      });
      expect(uniqueRegistrationPairRepository.store).toHaveBeenCalledWith({
        smallerRegistrationId: 1,
        largerRegistrationId: 3,
      });
      expect(uniqueRegistrationPairRepository.store).toHaveBeenCalledWith({
        smallerRegistrationId: 2,
        largerRegistrationId: 3,
      });
    });

    it('should create 6 pairs for 4 registrations', async () => {
      const registrationIds = [1, 2, 3, 4];
      const reason = 'testing';

      jest
        .spyOn(registrationScopedRepository, 'find')
        .mockResolvedValue([
          { id: 1 } as RegistrationEntity,
          { id: 2 } as RegistrationEntity,
          { id: 3 } as RegistrationEntity,
          { id: 4 } as RegistrationEntity,
        ]);

      jest
        .spyOn(registrationEventsService, 'createForIgnoredDuplicatePair')
        .mockResolvedValue(undefined);

      await service.createUniques({
        registrationIds,
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

      // There should be 6 calls to store (n*(n-1)/2 for n = 4)
      expect(uniqueRegistrationPairRepository.store).toHaveBeenCalledTimes(6);

      // Verify all pairs are stored
      const expectedPairs = [
        { smallerRegistrationId: 1, largerRegistrationId: 2 },
        { smallerRegistrationId: 1, largerRegistrationId: 3 },
        { smallerRegistrationId: 1, largerRegistrationId: 4 },
        { smallerRegistrationId: 2, largerRegistrationId: 3 },
        { smallerRegistrationId: 2, largerRegistrationId: 4 },
        { smallerRegistrationId: 3, largerRegistrationId: 4 },
      ];

      expectedPairs.forEach((pair) => {
        expect(uniqueRegistrationPairRepository.store).toHaveBeenCalledWith(
          pair,
        );
      });
    });
  });

  describe('createRegistrationUniquePair', () => {
    beforeEach(() => {
      jest.restoreAllMocks();

      jest
        .spyOn(registrationScopedRepository, 'find')
        .mockResolvedValue([
          { id: 1, registrationProgramId: 101 } as RegistrationEntity,
          { id: 2, registrationProgramId: 102 } as RegistrationEntity,
        ]);
    });

    it('should store a new unique pair and create a registrationEvent', async () => {
      const registrationIds = [11, 12];
      const reason = 'testing';

      jest
        .spyOn(uniqueRegistrationPairRepository, 'findOne')
        .mockResolvedValue(null);
      jest
        .spyOn(uniqueRegistrationPairRepository, 'store')
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
        .spyOn(registrationEventsService, 'createForIgnoredDuplicatePair')
        .mockResolvedValue(undefined);

      // Call the service method that uses the repository
      await service.createUniques({
        registrationIds,
        programId,
        reason,
      });

      // Verify registration find was called with correct parameters
      expect(registrationScopedRepository.findOneOrFail).toHaveBeenCalledTimes(
        2,
      );
      expect(registrationScopedRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: Equal(1) },
      });
      expect(registrationScopedRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: Equal(2) },
      });

      // Verify findOne was called to check if the pair exists
      expect(uniqueRegistrationPairRepository.findOne).toHaveBeenCalledWith({
        where: {
          smallerRegistrationId: Equal(1),
          largerRegistrationId: Equal(2),
        },
      });

      // Verify the pair is stored
      expect(uniqueRegistrationPairRepository.store).toHaveBeenCalledWith({
        smallerRegistrationId: 1,
        largerRegistrationId: 2,
      });

      expect(
        registrationEventsService.createForIgnoredDuplicatePair,
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
        .spyOn(uniqueRegistrationPairRepository, 'findOne')
        .mockResolvedValue({
          id: 1,
          smallerRegistrationId: 1,
          largerRegistrationId: 2,
        });

      await service.createUniques({
        registrationIds: [1, 2],
        programId,
        reason: 'testing',
      });

      // Verify store and registration event creation are not called
      expect(uniqueRegistrationPairRepository.store).not.toHaveBeenCalled();
      expect(
        registrationEventsService.createForIgnoredDuplicatePair,
      ).not.toHaveBeenCalled();
    });
  });
});

import { AppDataSource } from '@121-service/src/appdatasource';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationDataTypeClassValidator } from '@121-service/src/registration/validators/registration-data-type.class.validator';
import { Repository } from 'typeorm';

jest.mock('../../../src/appdatasource', () => ({
  AppDataSource: {
    getRepository: {
      findOne: jest.fn().mockResolvedValue(null),
    },
  },
}));

describe('RegistrationDataTypeClassValidator', () => {
  let validator: RegistrationDataTypeClassValidator;
  let mockRegistrationRepository: Partial<Repository<RegistrationEntity>>;

  beforeEach(() => {
    validator = new RegistrationDataTypeClassValidator();
    mockRegistrationRepository = { findOne: jest.fn().mockResolvedValue(null) };

    AppDataSource.getRepository = jest
      .fn()
      .mockReturnValue(mockRegistrationRepository);
  });

  it('should return false if referenceId or attribute are undefined', async () => {
    const isValid = await validator.validate(undefined, {
      object: { userId: 1 },
      constraints: [{ referenceId: 'referenceId', attribute: 'attribute' }],
      value: undefined,
      targetName: '',
      property: '',
    });

    expect(isValid).toBe(false);
  });

  it('should return false if registration does not exist for provided referenceId', async () => {
    mockRegistrationRepository.findOne = jest.fn().mockResolvedValue(null);
    const isValid = await validator.validate('value', {
      object: { referenceId: 'nonexistent', attribute: 'attribute', userId: 1 },
      constraints: [{ referenceId: 'referenceId', attribute: 'attribute' }],
      value: undefined,
      targetName: '',
      property: '',
    });

    expect(isValid).toBe(false);
  });

  it('should return true for valid attribute type', async () => {
    const mockProgram = {
      getValidationInfoForQuestionName: jest
        .fn()
        .mockResolvedValue({ type: 'text', options: [] }),
    };
    mockRegistrationRepository.findOne = jest
      .fn()
      .mockResolvedValue({ program: mockProgram });
    const isValid = await validator.validate('some text', {
      object: { referenceId: 'existing', attribute: 'attribute', userId: 1 },
      constraints: [{ referenceId: 'referenceId', attribute: 'attribute' }],
      value: undefined,
      targetName: '',
      property: '',
    });

    expect(isValid).toBe(true);
  });

  it('should return false for an invalid scope', async () => {
    const mockAssignmentRepo = {
      findOne: jest
        .fn()
        .mockResolvedValue({ scope: 'allowedScope', userId: 1, programId: 1 }),
    };
    AppDataSource.getRepository = jest.fn().mockImplementation((entity) => {
      if (entity === ProgramAidworkerAssignmentEntity) {
        return mockAssignmentRepo;
      }
      return mockRegistrationRepository;
    });

    const isValid = await validator.validate('invalidScope', {
      object: { referenceId: 'existing', attribute: 'scope', userId: 1 },
      constraints: [{ referenceId: 'referenceId', attribute: 'attribute' }],
      value: undefined,
      targetName: '',
      property: '',
    });

    expect(isValid).toBe(false);
  });
});

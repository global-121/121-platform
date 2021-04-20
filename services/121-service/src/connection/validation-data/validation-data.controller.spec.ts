import { Test, TestingModule } from '@nestjs/testing';
import { ValidationDataController } from './validation-data.controller';
import { ValidationDataValuesDto } from './dto/validation-values.dto';
import { ValidationDataService } from './validation-data.service';
import { RolesGuard } from '../../roles.guard';

const cred = {
  did: 'did:sov:exampleExampleExample',
  programId: 1,
  attributes: [],
  validationDataJson: JSON.parse('{ "encrypted" :"example" }'),
};
class ValidationDatanServiceMock {
  public async issueValidation(
    validationDataValues: ValidationDataValuesDto,
  ): Promise<void> {
    validationDataValues;
  }
}

describe('ValidationData Controller', (): void => {
  let validationDataService: ValidationDataService;
  let validationDataController: ValidationDataController;

  beforeEach(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [ValidationDataController],
        providers: [
          {
            provide: ValidationDataService,
            useValue: new ValidationDatanServiceMock(),
          },
        ],
      })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .compile();
      validationDataService = module.get<ValidationDataService>(
        ValidationDataService,
      );

      validationDataController = module.get<ValidationDataController>(
        ValidationDataController,
      );
    },
  );

  it('should be defined', (): void => {
    expect(validationDataController).toBeDefined();
  });

  describe('issueValidation', (): void => {
    it('should issue validation data', async (): Promise<void> => {
      const spy = jest
        .spyOn(validationDataService, 'issueValidation')
        .mockImplementation((): Promise<void> => Promise.resolve());

      await validationDataController.issue(cred);
      expect(spy).toHaveBeenCalled();
    });
  });
});

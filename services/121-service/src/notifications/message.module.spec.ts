import { MessageModule } from '@121-service/src/notifications/message.module';
import { TwilioEnvVariableValidationService } from '@121-service/src/notifications/services/twilio-env-variable-validation.service';

describe('MessageModule', () => {
  let messageModule: MessageModule;
  let twilioEnvVariableValidationService: jest.Mocked<TwilioEnvVariableValidationService>;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    twilioEnvVariableValidationService = {
      validateTwilioEnvVariables: jest.fn(),
    } as unknown as jest.Mocked<TwilioEnvVariableValidationService>;

    messageModule = new MessageModule(twilioEnvVariableValidationService);

    consoleLogSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onModuleInit', () => {
    it('should log success message when validation passes', () => {
      twilioEnvVariableValidationService.validateTwilioEnvVariables.mockReturnValue(
        { ok: true, messages: ['Twilio is disabled, no variables required'] },
      );

      messageModule.onModuleInit();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Twilio environment variable validation succeeded, Twilio is disabled, no variables required',
      );
    });

    it('should throw and log error messages when validation fails', () => {
      const errorMessages = ['error message 1', 'error message 2'];
      twilioEnvVariableValidationService.validateTwilioEnvVariables.mockReturnValue(
        { ok: false, messages: errorMessages },
      );

      expect(() => messageModule.onModuleInit()).toThrow(
        'Twilio environment variable validation failed, see previously logged errors.',
      );
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith(errorMessages[0]);
      expect(consoleLogSpy).toHaveBeenCalledWith(errorMessages[1]);
    });
  });
});

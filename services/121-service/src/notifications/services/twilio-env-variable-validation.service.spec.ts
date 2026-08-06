import { TwilioMode } from '@121-service/src/notifications/enum/twilio-mode.enum';
import { TwilioEnvVariableValidationService } from '@121-service/src/notifications/services/twilio-env-variable-validation.service';

describe('TwilioEnvVariableValidationService', () => {
  const service = new TwilioEnvVariableValidationService();

  const allVariablesSet = {
    TWILIO_SID: 'ACxxx',
    TWILIO_AUTHTOKEN: 'token',
    TWILIO_WHATSAPP_NUMBER: '15005550006',
    TWILIO_MESSAGING_SID: 'MGxxx',
  };

  it('is ok when Twilio is disabled, even without variables', () => {
    const { ok, messages } = service.validateTwilioEnvVariables({
      mode: TwilioMode.disabled,
      variables: {
        TWILIO_SID: undefined,
        TWILIO_AUTHTOKEN: undefined,
        TWILIO_WHATSAPP_NUMBER: undefined,
        TWILIO_MESSAGING_SID: undefined,
      },
    });

    expect(ok).toBe(true);
    expect(messages).toEqual(['Twilio is disabled, no variables required']);
  });

  it('is ok in mock mode when all variables are set', () => {
    const { ok } = service.validateTwilioEnvVariables({
      mode: TwilioMode.mock,
      variables: allVariablesSet,
    });

    expect(ok).toBe(true);
  });

  it('is ok in external mode when all variables are set', () => {
    const { ok } = service.validateTwilioEnvVariables({
      mode: TwilioMode.external,
      variables: allVariablesSet,
    });

    expect(ok).toBe(true);
  });

  it('is not ok in external mode when variables are missing', () => {
    const { ok, messages } = service.validateTwilioEnvVariables({
      mode: TwilioMode.external,
      variables: {
        ...allVariablesSet,
        TWILIO_SID: undefined,
        TWILIO_MESSAGING_SID: '',
      },
    });

    expect(ok).toBe(false);
    expect(messages[0]).toContain('"TWILIO_SID"');
    expect(messages[0]).toContain('"TWILIO_MESSAGING_SID"');
  });
});

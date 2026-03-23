import { buildTemplateAccountCreated } from '@121-service/src/user/user-emails/templates/account-created.template';
import { buildTemplateAccountCreatedSSO } from '@121-service/src/user/user-emails/templates/account-created-sso.template';
import { buildTemplatePasswordReset } from '@121-service/src/user/user-emails/templates/password-reset.template';

describe('User email templates', () => {
  const baseInput = {
    email: 'user@example.org',
    recipientName: 'Jane Doe',
    password: 'temp-pass-123',
  };

  it('should render account created template', () => {
    expect(buildTemplateAccountCreated(baseInput)).toMatchSnapshot();
  });

  it('should render account created SSO template', () => {
    expect(buildTemplateAccountCreatedSSO(baseInput)).toMatchSnapshot();
  });

  it('should render password reset template', () => {
    expect(buildTemplatePasswordReset(baseInput)).toMatchSnapshot();
  });
});

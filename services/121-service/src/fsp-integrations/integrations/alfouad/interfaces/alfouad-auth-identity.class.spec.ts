import { AlfouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-auth-identity.class';

describe('AlfouadAuthIdentity', () => {
  const authIdentity = new AlfouadAuthIdentity({
    account: '161010004501',
    branchId: '1',
    username: 'Red Crescent',
    password: 'secret',
    publicKey: '<RSAParameters />',
  });

  it('should keep the credential fields readable for building the request', () => {
    expect(authIdentity.account).toBe('161010004501');
    expect(authIdentity.branchId).toBe('1');
    expect(authIdentity.username).toBe('Red Crescent');
    expect(authIdentity.password).toBe('secret');
    expect(authIdentity.publicKey).toBe('<RSAParameters />');
  });

  it('should redact all credentials when serialized', () => {
    expect(JSON.stringify(authIdentity)).toBe('"**REDACTED**"');
  });

  it('should redact the credentials when nested in a logged object', () => {
    const logged = JSON.stringify({ authIdentity });

    expect(logged).toBe('{"authIdentity":"**REDACTED**"}');
    expect(logged).not.toContain('secret');
    expect(logged).not.toContain('161010004501');
  });
});

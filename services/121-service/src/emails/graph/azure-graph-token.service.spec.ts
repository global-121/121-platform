import { CredentialUnavailableError } from '@azure/identity';

import { EmailDeliveryError } from '@121-service/src/emails/errors/email-delivery.error';
import { AzureGraphTokenService } from '@121-service/src/emails/graph/azure-graph-token.service';

const mockGetToken = jest.fn();

jest.mock('@azure/identity', () => ({
  ...jest.requireActual('@azure/identity'),
  ManagedIdentityCredential: jest.fn().mockImplementation(() => ({
    getToken: mockGetToken,
  })),
}));

jest.mock('@121-service/src/env', () => ({
  env: { AZURE_USER_ASSIGNED_IDENTITY_CLIENT_ID: 'test-client-id' },
}));

describe('AzureGraphTokenService', () => {
  let service: AzureGraphTokenService;

  beforeEach(() => {
    mockGetToken.mockReset();
    service = new AzureGraphTokenService();
  });

  it('returns the access token', async () => {
    // Arrange
    mockGetToken.mockResolvedValue({
      token: 'test-token',
      expiresOnTimestamp: 0,
    });

    // Act
    const accessToken = await service.getAccessToken();

    // Assert
    expect(accessToken).toBe('test-token');
  });

  it('throws EmailDeliveryError when the token is empty', async () => {
    // Arrange
    mockGetToken.mockResolvedValue({ token: '', expiresOnTimestamp: 0 });

    // Act
    const error: unknown = await service.getAccessToken().catch((e) => e);

    // Assert
    expect(error).toBeInstanceOf(EmailDeliveryError);
    expect((error as EmailDeliveryError).cause).toEqual(
      new Error('Received an empty access token'),
    );
  });

  it('wraps credential-provider rejections in EmailDeliveryError', async () => {
    // Arrange
    const credentialError = new CredentialUnavailableError(
      'Managed identity unavailable',
    );
    mockGetToken.mockRejectedValue(credentialError);

    // Act
    const error: unknown = await service.getAccessToken().catch((e) => e);

    // Assert
    expect(error).toBeInstanceOf(EmailDeliveryError);
    expect((error as EmailDeliveryError).cause).toBe(credentialError);
  });
});

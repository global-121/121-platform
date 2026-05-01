import { ManagedIdentityCredential } from '@azure/identity';

import { AzureGraphTokenService } from '@121-service/src/emails/azure-graph-token.service';
import { EmailDeliveryError } from '@121-service/src/emails/errors/email-delivery.error';

jest.mock('@121-service/src/env', () => ({
  env: {
    AZURE_USER_ASSIGNED_IDENTITY_CLIENT_ID: 'managed-identity-client-id',
  },
}));

const mockGetToken = jest.fn();

jest.mock('@azure/identity', () => ({
  ManagedIdentityCredential: jest.fn().mockImplementation(() => ({
    getToken: mockGetToken,
  })),
}));

describe('AzureGraphTokenService', () => {
  let service: AzureGraphTokenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AzureGraphTokenService();
  });

  it('should construct ManagedIdentityCredential with the configured client ID', async () => {
    mockGetToken.mockResolvedValueOnce({
      token: 'graph-token',
      expiresOnTimestamp: Date.now() + 60_000,
    });

    await service.getAccessToken();

    expect(ManagedIdentityCredential).toHaveBeenCalledWith({
      clientId: 'managed-identity-client-id',
    });
  });

  it('should request a token for the Microsoft Graph default scope', async () => {
    mockGetToken.mockResolvedValueOnce({
      token: 'graph-token',
      expiresOnTimestamp: Date.now() + 60_000,
    });

    const token = await service.getAccessToken();

    expect(mockGetToken).toHaveBeenCalledWith(
      'https://graph.microsoft.com/.default',
    );
    expect(token).toBe('graph-token');
  });

  it('should reuse the same credential instance across calls', async () => {
    mockGetToken.mockResolvedValue({
      token: 'graph-token',
      expiresOnTimestamp: Date.now() + 60_000,
    });

    await service.getAccessToken();
    await service.getAccessToken();

    expect(ManagedIdentityCredential).toHaveBeenCalledTimes(1);
  });

  it('should throw EmailDeliveryError when no token is returned', async () => {
    mockGetToken.mockResolvedValueOnce(null);

    await expect(service.getAccessToken()).rejects.toThrow(EmailDeliveryError);
  });

  it('should throw EmailDeliveryError when the returned token is empty', async () => {
    mockGetToken.mockResolvedValueOnce({ token: '', expiresOnTimestamp: 0 });

    await expect(service.getAccessToken()).rejects.toThrow(EmailDeliveryError);
  });
});

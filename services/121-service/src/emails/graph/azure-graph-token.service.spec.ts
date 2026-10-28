import { ManagedIdentityCredential } from '@azure/identity';

import { EmailDeliveryError } from '@121-service/src/emails/errors/email-delivery.error';
import { AzureGraphTokenService } from '@121-service/src/emails/graph/azure-graph-token.service';

jest.mock('@azure/identity');

describe('AzureGraphTokenService', () => {
  let service: AzureGraphTokenService;
  let getTokenMock: jest.Mock;

  beforeEach(() => {
    getTokenMock = jest.fn();
    jest.mocked(ManagedIdentityCredential).mockImplementation(
      () =>
        ({
          getToken: getTokenMock,
        }) as unknown as ManagedIdentityCredential,
    );
    service = new AzureGraphTokenService();
  });

  it('should return the token from the managed identity', async () => {
    // Arrange
    getTokenMock.mockResolvedValue({ token: 'access-token' });

    // Act
    const accessToken = await service.getAccessToken();

    // Assert
    expect(accessToken).toBe('access-token');
  });

  it('should throw an EmailDeliveryError when no token is returned', async () => {
    // Arrange
    getTokenMock.mockResolvedValue(null);

    // Act & Assert
    await expect(service.getAccessToken()).rejects.toThrow(EmailDeliveryError);
  });

  it('should wrap a failed token request in an EmailDeliveryError with the original cause', async () => {
    // Arrange
    const credentialError = new Error('Managed identity unavailable');
    getTokenMock.mockRejectedValue(credentialError);

    // Act & Assert
    await expect(service.getAccessToken()).rejects.toMatchObject({
      name: 'EmailDeliveryError',
      cause: credentialError,
    });
  });
});

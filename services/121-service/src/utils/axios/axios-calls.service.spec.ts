import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

describe('AxiosCallsService', () => {
  afterEach(jest.resetAllMocks);

  it('should log a useful message when authentication fails', async () => {
    // Arrange
    const axiosCallsService = new AxiosCallsService();
    jest.spyOn(axiosCallsService, 'loginAsAdmin').mockResolvedValue({
      headers: {
        'set-cookie': undefined,
      },
    });

    // Act
    const promiseGetAccessToken = axiosCallsService.getAccessToken();

    // Assert
    await expect(promiseGetAccessToken).rejects.toThrow(
      "Error while extracting access token from cookies: TypeError: Cannot read properties of undefined (reading 'find')",
    );
  });
});

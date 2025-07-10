import { CronjobInitiateService } from '@121-service/src/cronjob/services/cronjob-initiate.service';

const exampleApiUrl = 'http://example.com/api';
const expectedCronjobUrl = `${exampleApiUrl}/cronjobs`;

describe('Cronjobs', () => {
  let cronjobService;
  const testHeader = { name: 'test name', value: 'test value' };
  beforeAll(() => {
    cronjobService = new CronjobInitiateService();
    // Make this a noop.
    jest
      .spyOn(cronjobService.axiosCallsService, 'getAccessToken')
      .mockResolvedValue(true);
    // Make this a noop. We assert on this return value.
    jest
      .spyOn(cronjobService.axiosCallsService, 'accesTokenToHeaders')
      .mockResolvedValue(testHeader);
    // We assert on this return value.
    jest
      .spyOn(cronjobService.axiosCallsService, 'getBaseUrl')
      .mockResolvedValue(exampleApiUrl);
  });

  afterAll(jest.restoreAllMocks);

  it('that do PUT requests should call httpService.put and pass correct arguments', async () => {
    // Arrange
    const mockFn = jest
      .spyOn(cronjobService.httpService, 'put')
      .mockResolvedValue(true);

    // Act
    await cronjobService.cronValidateCommercialBankEthiopiaAccountEnquiries();

    // Assert
    expect(mockFn).toHaveBeenCalledTimes(1);
    const calledUrl = `${expectedCronjobUrl}/fsps/commercial-bank-ethiopia/account-enquiries`;
    expect(mockFn).toHaveBeenCalledWith(calledUrl, {}, testHeader);

    // Cleanup
    mockFn.mockRestore();
  });

  it('that do PATCH requests should call httpService.patch and pass correct arguments', async () => {
    // Arrange
    const mockFn = jest
      .spyOn(cronjobService.httpService, 'patch')
      .mockResolvedValue(true);

    // Act
    await cronjobService.cronRetrieveAndUpdatedUnusedIntersolveVouchers();

    // Assert
    expect(mockFn).toHaveBeenCalledTimes(1);
    const calledUrl = `${expectedCronjobUrl}/fsps/intersolve-voucher/unused-vouchers`;
    expect(mockFn).toHaveBeenCalledWith(calledUrl, {}, testHeader);

    // Cleanup
    mockFn.mockRestore();
  });

  it('that do POST requests should call httpService.post and pass correct arguments', async () => {
    // Arrange
    const mockFn = jest
      .spyOn(cronjobService.httpService, 'post')
      .mockResolvedValue(true);

    // Act
    await cronjobService.cronCancelByRefposIntersolve();

    // Assert
    expect(mockFn).toHaveBeenCalledTimes(1);
    const calledUrl = `${expectedCronjobUrl}/fsps/intersolve-voucher/cancel`;
    expect(mockFn).toHaveBeenCalledWith(calledUrl, {}, testHeader);

    // Cleanup
    mockFn.mockRestore();
  });

  it('that do DELETE requests should call httpService.delete and pass correct arguments', async () => {
    // Arrange
    const mockFn = jest
      .spyOn(cronjobService.httpService, 'delete')
      .mockResolvedValue(true);

    // Act
    await cronjobService.cronRemoveDeprecatedImageCodes();

    // Assert
    expect(mockFn).toHaveBeenCalledTimes(1);
    const calledUrl = `${expectedCronjobUrl}/fsps/intersolve-voucher/deprecated-image-codes`;
    expect(mockFn).toHaveBeenCalledWith(calledUrl, testHeader);

    // Cleanup
    mockFn.mockRestore();
  });

  it('should log a useful message when authentication fails', async () => {
    // Arrange
    const mockFn = jest
      .spyOn(cronjobService, 'getHeaders')
      .mockImplementation(() => {
        throw new Error('could not get headers');
      });

    const cronjobName = 'cronCancelByRefposIntersolve';
    // Act
    // Dynamically call the method and pass it the method as argument.
    const cronPromise = cronjobService[cronjobName](cronjobName);

    // Assert
    // Necessary: see https://jestjs.io/docs/asynchronous
    await expect(cronPromise).rejects.toThrow(
      new Error(
        `While running cronjob "${cronjobName}" an authentication error occurred: Error: could not get headers`,
      ),
    );

    // Cleanup
    mockFn.mockRestore();
  });

  it('should log a useful message when a request fails', async () => {
    // Arrange
    const mockFn = jest
      .spyOn(cronjobService.httpService, 'patch')
      .mockImplementation(() => {
        throw new Error('patch request failed');
      });

    const cronjobName = 'cronRetrieveAndUpdatedUnusedIntersolveVouchers';
    // Act
    // Dynamically call the method and pass it the method as argument.
    const cronPromise = cronjobService[cronjobName](cronjobName);

    // Assert
    // Necessary: see https://jestjs.io/docs/asynchronous
    await expect(cronPromise).rejects.toThrow(
      new Error(
        `While running cronjob "${cronjobName}" an error occurred during a request: Error: patch request failed`,
      ),
    );

    // Cleanup
    mockFn.mockRestore();
  });
});

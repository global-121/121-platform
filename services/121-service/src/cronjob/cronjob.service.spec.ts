import { CronjobService } from '@121-service/src/cronjob/cronjob.service';

describe('Cronjobs', () => {
  let cronjobService;
  beforeAll(() => {
    cronjobService = new CronjobService();
    // Make these noops so we don't actually call them.
    cronjobService.axiosCallsService.getAccessToken = jest
      .fn()
      .mockResolvedValue(true);
    cronjobService.axiosCallsService.accesTokenToHeaders = jest
      .fn()
      .mockReturnValue(true);
  });

  afterEach(jest.resetAllMocks);

  it('that do PUT requests should call httpService.put and pass correct arguments', async () => {
    // Arrange
    const mockFn = (cronjobService['httpService'].put = jest
      .fn()
      .mockResolvedValue(true));

    // Act
    await cronjobService.cronValidateCommercialBankEthiopiaAccountEnquiries();

    // Assert
    expect(mockFn).toHaveBeenCalledTimes(1);
    const calledUrl = `${cronjobService.baseUrl}/financial-service-providers/commercial-bank-ethiopia/account-enquiries`;
    const headers = cronjobService.headers;
    expect(mockFn).toHaveBeenCalledWith(calledUrl, {}, headers);
  });

  it('that do PATCH requests should call httpService.patch and pass correct arguments', async () => {
    // Arrange
    const mockFn = (cronjobService['httpService'].patch = jest
      .fn()
      .mockResolvedValue(true));

    // Act
    await cronjobService.cronRetrieveAndUpdatedUnusedIntersolveVouchers();

    // Assert
    expect(mockFn).toHaveBeenCalledTimes(1);
    const calledUrl = `${cronjobService.baseUrl}/financial-service-providers/intersolve-voucher/unused-vouchers`;
    const headers = cronjobService.headers;
    expect(mockFn).toHaveBeenCalledWith(calledUrl, {}, headers);
  });

  it('that do POST requests should call httpService.patch and pass correct arguments', async () => {
    // Arrange
    const mockFn = (cronjobService['httpService'].post = jest
      .fn()
      .mockResolvedValue(true));

    // Act
    await cronjobService.cronCancelByRefposIntersolve();

    // Assert
    expect(mockFn).toHaveBeenCalledTimes(1);
    const calledUrl = `${cronjobService.baseUrl}/financial-service-providers/intersolve-voucher/cancel`;
    const headers = cronjobService.headers;
    expect(mockFn).toHaveBeenCalledWith(calledUrl, {}, headers);
  });

  it('that do DELETE requests should call httpService.delete and pass correct arguments', async () => {
    // Arrange
    const mockFn = (cronjobService['httpService'].delete = jest
      .fn()
      .mockResolvedValue(true));

    // Act
    await cronjobService.cronRemoveDeprecatedImageCodes();

    // Assert
    expect(mockFn).toHaveBeenCalledTimes(1);
    const calledUrl = `${cronjobService.baseUrl}/financial-service-providers/intersolve-voucher/deprecated-image-codes`;
    const headers = cronjobService.headers;
    expect(mockFn).toHaveBeenCalledWith(calledUrl, headers);
  });

  it('should log a useful message when authentication fails', () => {
    // Arrange
    cronjobService['getHeaders'] = jest.fn(() => {
      throw new Error('could not get headers');
    });

    const cronjobName = 'cronCancelByRefposIntersolve';
    // Act
    // Dynamically call the method and pass it the method as argument.
    const cronPromise = cronjobService[cronjobName](cronjobName);

    // Assert
    return expect(cronPromise).rejects.toThrow(
      new Error(
        `While running cronjob "${cronjobName}" an authentication error occurred: Error: could not get headers`,
      ),
    );
  });

  it('should log a useful message when a request fails', () => {
    // Arrange
    cronjobService['httpService'].patch = jest.fn(() => {
      throw new Error('patch request failed');
    });

    const cronjobName = 'cronRetrieveAndUpdatedUnusedIntersolveVouchers';
    // Act
    // Dynamically call the method and pass it the method as argument.
    const cronPromise = cronjobService[cronjobName](cronjobName);

    // Assert
    return expect(cronPromise).rejects.toThrow(
      new Error(
        `While running cronjob "${cronjobName}" an error occurred during a request: Error: patch request failed`,
      ),
    );
  });
});

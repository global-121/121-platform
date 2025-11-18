import { IntersolveVisaApiError } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaApiService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa.api.service';

const mockHttpService = {
  request: jest.fn(),
};
const mockTokenValidationService = {
  isTokenValid: jest.fn(),
};

describe('IntersolveVisaApiService - intersolveApiRequest retry logic', () => {
  let service: IntersolveVisaApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IntersolveVisaApiService(
      mockHttpService as any,
      mockTokenValidationService as any,
    );
    service.getAuthenticationToken = jest.fn().mockResolvedValue('token');
  });

  it('retries once if GET and first response is error, succeeds on second', async () => {
    mockHttpService.request
      .mockResolvedValueOnce({ data: {} }) // missing 'status' field
      .mockResolvedValueOnce({ status: 200, statusText: 'OK', data: {} });

    const result = await service['intersolveApiRequest']({
      errorPrefix: 'Test',
      method: 'GET',
      endpoint: 'foo',
      apiPath: 'wallet',
    });
    expect(result).toBeDefined();
    expect(mockHttpService.request).toHaveBeenCalledTimes(2);
  });

  it('throws if GET and both requests fail', async () => {
    mockHttpService.request.mockResolvedValue(
      { data: {} }, // no status property at top level
    );

    await expect(
      service['intersolveApiRequest']({
        errorPrefix: 'Test',
        method: 'GET',
        endpoint: 'foo',
        apiPath: 'wallet',
      }),
    ).rejects.toThrow(IntersolveVisaApiError);
    expect(mockHttpService.request).toHaveBeenCalledTimes(2);
  });

  it('does not retry if GET and first request succeeds', async () => {
    mockHttpService.request.mockResolvedValue({
      status: 200,
      statusText: 'OK',
    });
    const result = await service['intersolveApiRequest']({
      errorPrefix: 'Test',
      method: 'GET',
      endpoint: 'foo',
      apiPath: 'wallet',
    });
    expect(result).toBeDefined();
    expect(mockHttpService.request).toHaveBeenCalledTimes(1);
  });

  it('does not retry for POST even if first request fails', async () => {
    mockHttpService.request.mockResolvedValue(
      { data: {} }, // no status property at top level
    );
    await expect(
      service['intersolveApiRequest']({
        errorPrefix: 'Test',
        method: 'POST',
        endpoint: 'foo',
        apiPath: 'wallet',
      }),
    ).rejects.toThrow(IntersolveVisaApiError);
    expect(mockHttpService.request).toHaveBeenCalledTimes(1);
  });
});

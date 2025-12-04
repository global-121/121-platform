import { IntersolveVisaApiError } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaApiService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.api.service';

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

  describe('if GET request', () => {
    it('retries once if first response is error, succeeds on second', async () => {
      mockHttpService.request
        .mockResolvedValueOnce({ data: {} }) // missing 'status' field
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: { data: {} },
        });

      await service.getToken('tokenCode');
      // By this test not throwing an error, we implicitly assert that the second call succeeded
      expect(mockHttpService.request).toHaveBeenCalledTimes(2);
    });

    it('throws if both requests fail', async () => {
      mockHttpService.request.mockResolvedValue(
        { data: {} }, // no status property at top level
      );

      await expect(service.getToken('tokenCode')).rejects.toThrow(
        IntersolveVisaApiError,
      );
      expect(mockHttpService.request).toHaveBeenCalledTimes(2);
    });

    it('does not retry if first request succeeds', async () => {
      mockHttpService.request.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: { data: {} },
      });
      await service.getToken('tokenCode');
      // By this test not throwing an error, we implicitly assert that the call succeeded
      expect(mockHttpService.request).toHaveBeenCalledTimes(1);
    });
  });

  it('if POST request, it does not retry even if first request fails', async () => {
    mockHttpService.request.mockResolvedValue(
      { data: {} }, // no status property at top level
    );
    await expect(
      service.issueToken({ brandCode: 'VISA', activate: true }),
    ).rejects.toThrow(IntersolveVisaApiError);
    expect(mockHttpService.request).toHaveBeenCalledTimes(1);
  });
});

import { IntersolveVisaApiError } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaApiService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.api.service';

const mockHttpService = {
  request: jest.fn(),
};

describe('IntersolveVisaApiService - intersolveApiRequest retry logic', () => {
  let service: IntersolveVisaApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IntersolveVisaApiService(mockHttpService as any);
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

describe('IntersolveVisaApiService - createPhysicalCard', () => {
  let service: IntersolveVisaApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IntersolveVisaApiService(mockHttpService as any);
    service.getAuthenticationToken = jest.fn().mockResolvedValue('token');
    mockHttpService.request.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: { data: {} },
    });
  });

  const baseContactInformation = {
    name: 'John Doe',
    addressStreet: 'Damrak',
    addressHouseNumber: '1',
    addressPostalCode: '1011AB',
    addressCity: 'Amsterdam',
    phoneNumber: '+31600000000',
  };

  it('includes address3 in the request payload when emailAddress is provided', async () => {
    await service.createPhysicalCard({
      tokenCode: 'token-123',
      coverLetterCode: 'COVER',
      contactInformation: {
        ...baseContactInformation,
        emailAddress: 'john@example.org',
      },
    });

    expect(mockHttpService.request).toHaveBeenCalledTimes(1);
    const callPayload = mockHttpService.request.mock.calls[0][0].payload;
    expect(callPayload.address3).toBe('john@example.org');
  });

  it('does not include address3 in the request payload when emailAddress is undefined', async () => {
    await service.createPhysicalCard({
      tokenCode: 'token-123',
      coverLetterCode: 'COVER',
      contactInformation: baseContactInformation,
    });

    expect(mockHttpService.request).toHaveBeenCalledTimes(1);
    const callPayload = mockHttpService.request.mock.calls[0][0].payload;
    expect(callPayload).not.toHaveProperty('address3');
  });
});

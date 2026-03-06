import { CreateQueryResult } from '@tanstack/angular-query-experimental';

import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';

import { isKoboIntegrated } from '~/domains/kobo/kobo.helpers';

describe('isKoboIntegrated', () => {
  it('should return false when integration is not successful', () => {
    const mockIntegration = {
      isSuccess: () => false,
    } as CreateQueryResult<KoboResponseDto>;

    expect(isKoboIntegrated(mockIntegration)).toBe(false);
  });

  it('should return false when versionId is undefined', () => {
    const mockIntegration = {
      isSuccess: () => true,
      data: () => ({ programId: 1 }) as KoboResponseDto,
    } as CreateQueryResult<KoboResponseDto>;

    expect(isKoboIntegrated(mockIntegration)).toBe(false);
  });

  it('should return false when versionId is empty string', () => {
    const mockIntegration = {
      isSuccess: () => true,
      data: () => ({ versionId: '' }) as KoboResponseDto,
    } as CreateQueryResult<KoboResponseDto>;

    expect(isKoboIntegrated(mockIntegration)).toBe(false);
  });

  it('should return true when versionId has a value', () => {
    const mockIntegration = {
      isSuccess: () => true,
      data: () => ({ versionId: 'v42' }) as KoboResponseDto,
    } as CreateQueryResult<KoboResponseDto>;

    expect(isKoboIntegrated(mockIntegration)).toBe(true);
  });

  it('should return true when versionId has any non-empty string value', () => {
    const mockIntegration = {
      isSuccess: () => true,
      data: () => ({ versionId: '8' }) as KoboResponseDto,
    } as CreateQueryResult<KoboResponseDto>;

    expect(isKoboIntegrated(mockIntegration)).toBe(true);
  });

  it('should not call data() when integration is not successful', () => {
    const dataSpy = jasmine.createSpy();
    const mockIntegration = {
      isSuccess: () => false,
      data: dataSpy,
    } as unknown as CreateQueryResult<KoboResponseDto>;

    isKoboIntegrated(mockIntegration);

    expect(dataSpy).not.toHaveBeenCalled();
  });
});

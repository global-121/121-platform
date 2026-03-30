import { CreateQueryResult } from '@tanstack/angular-query-experimental';
import { describe, expect, it, vi } from 'vitest';

import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';

import {
  buildKoboFormUrl,
  extractServerAndAssetIdFromUrl,
  isKoboIntegrated,
} from '~/domains/kobo/kobo.helpers';

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
    const dataSpy = vi.fn();
    const mockIntegration = {
      isSuccess: () => false,
      data: dataSpy,
    } as unknown as CreateQueryResult<KoboResponseDto>;

    isKoboIntegrated(mockIntegration);

    expect(dataSpy).not.toHaveBeenCalled();
  });
});

describe('buildKoboFormUrl', () => {
  it('should build a valid Kobo form URL', () => {
    const result = buildKoboFormUrl({
      serverUrl: 'https://kobo.example.org/',
      assetUid: 'asset-id-123',
    });

    expect(result).toBe(
      'https://kobo.example.org//#/forms/asset-id-123/summary',
    );
  });

  it('should handle server URLs without trailing slash', () => {
    const result = buildKoboFormUrl({
      serverUrl: 'https://kobo.example.org',
      assetUid: 'abc',
    });

    expect(result).toBe('https://kobo.example.org/#/forms/abc/summary');
  });
});

describe('extractServerAndAssetIdFromUrl', () => {
  it('should extract serverUrl and assetId from valid Kobo form URLs', () => {
    const cases = [
      {
        input: 'https://kobo.example.org/#/forms/asset-id-123/summary',
        expected: {
          serverUrl: 'https://kobo.example.org/',
          assetId: 'asset-id-123',
        },
      },
      {
        input: 'https://kobo.example.org/#/forms/asset-id-123  ',
        expected: {
          serverUrl: 'https://kobo.example.org/',
          assetId: 'asset-id-123',
        },
      },
      {
        input: 'https://example.net/kobo/#/forms/asset-id-123/summary',
        expected: {
          serverUrl: 'https://example.net/kobo/',
          assetId: 'asset-id-123',
        },
      },
      {
        input:
          'https://kobo.example.org/?param=value#/forms/asset-id-123/summary  ',
        expected: {
          serverUrl: 'https://kobo.example.org/',
          assetId: 'asset-id-123',
        },
      },
      {
        input: 'http://localhost:8008/#/forms/asset-id-123/summary  ',
        expected: {
          serverUrl: 'http://localhost:8008/',
          assetId: 'asset-id-123',
        },
      },
    ];

    cases.forEach(({ input, expected }) => {
      const result = extractServerAndAssetIdFromUrl(input);

      expect(result.serverUrl).toBe(expected.serverUrl);
      expect(result.assetId).toBe(expected.assetId);
    });
  });

  it('should return empty object for malformed URL', () => {
    const cases = [
      '',
      'not-a-valid-url',
      'kobo.example.org/#/forms/asset-id-123/summary',
      'https://kobo.example.org/#/views/asset-id-123/summary',
      'https://kobo.example.org/#/forms//details',
      'https://kobo.example.org/forms/asset-id-123/summary',
      'https://kobo.example.org/#/forms/',
    ];

    cases.forEach((caseInput) => {
      const result = extractServerAndAssetIdFromUrl(caseInput);

      expect(result).toEqual({});
    });
  });
});

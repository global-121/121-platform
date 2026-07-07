import { BadRequestException } from '@nestjs/common';
import { MulterError } from 'multer';

import {
  getMulterErrorMessage,
  normalizeMulterBadRequestMessage,
} from '@121-service/src/shared/filters/multer-exception.filter';

describe('getMulterErrorMessage', () => {
  it('should return a friendly message for file size limit errors', () => {
    const error = new MulterError('LIMIT_FILE_SIZE');

    expect(getMulterErrorMessage(error)).toBe(
      'Upload rejected: the file exceeds the maximum allowed size for this endpoint.',
    );
  });

  it('should return a friendly message for file count limit errors', () => {
    const error = new MulterError('LIMIT_FILE_COUNT');

    expect(getMulterErrorMessage(error)).toBe(
      'Upload rejected: too many files. Only 1 file is allowed per upload request.',
    );
  });

  it('should return a friendly message for field count limit errors', () => {
    const error = new MulterError('LIMIT_FIELD_COUNT');

    expect(getMulterErrorMessage(error)).toBe(
      'Upload rejected: too many text fields. At most 5 text fields are allowed per upload request.',
    );
  });

  it('should return a fallback message for unknown multer errors', () => {
    const error = new MulterError('LIMIT_PART_COUNT');
    Object.defineProperty(error, 'code', {
      value: 'UNKNOWN_LIMIT',
    });

    expect(getMulterErrorMessage(error)).toBe(
      'Upload rejected: the request exceeds an upload limit for this endpoint.',
    );
  });
});

describe('normalizeMulterBadRequestMessage', () => {
  it('should normalize the default too many files bad request message', () => {
    const error = new BadRequestException('Too many files');

    expect(normalizeMulterBadRequestMessage(error)).toBe(
      'Upload rejected: too many files. Only 1 file is allowed per upload request.',
    );
  });

  it('should normalize the default file too large bad request message', () => {
    const error = new BadRequestException('File too large');

    expect(normalizeMulterBadRequestMessage(error)).toBe(
      'Upload rejected: the file exceeds the maximum allowed size for this endpoint.',
    );
  });

  it('should leave unrelated bad request messages alone', () => {
    const error = new BadRequestException('Validation failed');

    expect(normalizeMulterBadRequestMessage(error)).toBeUndefined();
  });
});
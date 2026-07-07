import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';

import {
  MAX_FILES_PER_UPLOAD,
  MAX_TEXT_FIELDS_PER_UPLOAD,
} from '@121-service/src/shared/file-upload-limits';

export function getMulterErrorMessage(error: MulterError): string {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return 'Upload rejected: the file exceeds the maximum allowed size for this endpoint.';
    case 'LIMIT_FILE_COUNT':
      return `Upload rejected: too many files. Only ${MAX_FILES_PER_UPLOAD} file is allowed per upload request.`;
    case 'LIMIT_FIELD_COUNT':
      return `Upload rejected: too many text fields. At most ${MAX_TEXT_FIELDS_PER_UPLOAD} text fields are allowed per upload request.`;
    case 'LIMIT_UNEXPECTED_FILE':
      return 'Upload rejected: the request contained an unexpected file field.';
    case 'LIMIT_PART_COUNT':
      return 'Upload rejected: the request contains too many multipart parts.';
    case 'LIMIT_FIELD_KEY':
      return 'Upload rejected: a text field name is too long.';
    case 'LIMIT_FIELD_VALUE':
      return 'Upload rejected: a text field value is too large.';
    default:
      return 'Upload rejected: the request exceeds an upload limit for this endpoint.';
  }
}

function getBadRequestMessage(
  exception: BadRequestException,
): string | string[] | undefined {
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  if (typeof response === 'object' && response && 'message' in response) {
    return response.message as string | string[];
  }

  return undefined;
}

export function normalizeMulterBadRequestMessage(
  exception: BadRequestException,
): string | undefined {
  const message = getBadRequestMessage(exception);

  if (Array.isArray(message)) {
    return undefined;
  }

  switch (message) {
    case 'File too large':
      return 'Upload rejected: the file exceeds the maximum allowed size for this endpoint.';
    case 'Too many files':
      return `Upload rejected: too many files. Only ${MAX_FILES_PER_UPLOAD} file is allowed per upload request.`;
    case 'Too many fields':
      return `Upload rejected: too many text fields. At most ${MAX_TEXT_FIELDS_PER_UPLOAD} text fields are allowed per upload request.`;
    case 'Unexpected field':
      return 'Upload rejected: the request contained an unexpected file field.';
    case 'Too many parts':
      return 'Upload rejected: the request contains too many multipart parts.';
    case 'Field name too long':
      return 'Upload rejected: a text field name is too long.';
    case 'Field value too long':
      return 'Upload rejected: a text field value is too large.';
    default:
      return undefined;
  }
}

@Catch(MulterError, BadRequestException)
export class MulterExceptionFilter
  implements ExceptionFilter<MulterError | BadRequestException>
{
  public catch(
    exception: MulterError | BadRequestException,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof BadRequestException) {
      const normalizedMessage = normalizeMulterBadRequestMessage(exception);

      if (!normalizedMessage) {
        throw exception;
      }

      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: normalizedMessage,
        error: 'Bad Request',
      });
      return;
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: getMulterErrorMessage(exception),
      error: 'Bad Request',
    });
  }
}
import { MulterModuleOptions } from '@nestjs/platform-express';

import {
  MAX_EXCEL_RECONCILIATION_ROWS_PER_UPLOAD,
  MAX_REGISTRATION_BULK_PATCH_ROWS_PER_UPLOAD,
  MAX_REGISTRATION_IMPORT_ROWS_PER_UPLOAD,
} from '@121-service/src/shared/file-upload-row-limits';

type FileUploadLimits = NonNullable<MulterModuleOptions['limits']>;

// Limits for multipart/form-data uploads, passed to multer (via FileInterceptor)
// to help protect against denial-of-service (DoS) attacks.
// See: https://github.com/expressjs/multer#security

const BYTES_PER_MEGABYTE = 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 1;
export const MAX_TEXT_FIELDS_PER_UPLOAD = 5;
const BYTES_PER_ALLOWED_ROW = 1024;

export const REGISTRATION_IMPORT_CSV_FILE_UPLOAD_LIMITS: FileUploadLimits = {
  fileSize:
    MAX_REGISTRATION_IMPORT_ROWS_PER_UPLOAD * BYTES_PER_ALLOWED_ROW,
  files: MAX_FILES_PER_UPLOAD,
  fields: MAX_TEXT_FIELDS_PER_UPLOAD,
};

export const REGISTRATION_BULK_PATCH_CSV_FILE_UPLOAD_LIMITS: FileUploadLimits = {
  fileSize:
    MAX_REGISTRATION_BULK_PATCH_ROWS_PER_UPLOAD * BYTES_PER_ALLOWED_ROW,
  files: MAX_FILES_PER_UPLOAD,
  fields: MAX_TEXT_FIELDS_PER_UPLOAD,
};

export const EXCEL_FILE_UPLOAD_LIMITS: FileUploadLimits = {
  fileSize:
    MAX_EXCEL_RECONCILIATION_ROWS_PER_UPLOAD * BYTES_PER_ALLOWED_ROW,
  files: MAX_FILES_PER_UPLOAD,
  fields: MAX_TEXT_FIELDS_PER_UPLOAD,
};

export const IMAGE_FILE_UPLOAD_LIMITS: FileUploadLimits = {
  fileSize: 5 * BYTES_PER_MEGABYTE,
  files: MAX_FILES_PER_UPLOAD,
  fields: MAX_TEXT_FIELDS_PER_UPLOAD,
};

export const ATTACHMENT_FILE_UPLOAD_LIMITS: FileUploadLimits = {
  fileSize: 100 * BYTES_PER_MEGABYTE,
  files: MAX_FILES_PER_UPLOAD,
  fields: MAX_TEXT_FIELDS_PER_UPLOAD,
};

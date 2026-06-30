import { MulterModuleOptions } from '@nestjs/platform-express';

// Limits for multipart/form-data uploads, passed to multer (via FileInterceptor)
// to help protect against denial-of-service (DoS) attacks.
// See: https://github.com/expressjs/multer#security

const BYTES_PER_MEGABYTE = 1024 * 1024;

// Every upload endpoint accepts a single file, optionally accompanied by a small
// number of text fields (e.g. `reason` or `filename`).
const MAX_FILES_PER_UPLOAD = 1;
const MAX_TEXT_FIELDS_PER_UPLOAD = 5;

// Bulk registration imports/updates of up to 100k rows.
export const CSV_FILE_UPLOAD_LIMITS: MulterModuleOptions['limits'] = {
  fileSize: 50 * BYTES_PER_MEGABYTE,
  files: MAX_FILES_PER_UPLOAD,
  fields: MAX_TEXT_FIELDS_PER_UPLOAD,
};

// Excel reconciliation uploads.
export const EXCEL_FILE_UPLOAD_LIMITS: MulterModuleOptions['limits'] = {
  fileSize: 50 * BYTES_PER_MEGABYTE,
  files: MAX_FILES_PER_UPLOAD,
  fields: MAX_TEXT_FIELDS_PER_UPLOAD,
};

// Image uploads (e.g. voucher instructions).
export const IMAGE_FILE_UPLOAD_LIMITS: MulterModuleOptions['limits'] = {
  fileSize: 5 * BYTES_PER_MEGABYTE,
  files: MAX_FILES_PER_UPLOAD,
  fields: MAX_TEXT_FIELDS_PER_UPLOAD,
};

// Program attachments (images and documents).
export const ATTACHMENT_FILE_UPLOAD_LIMITS: MulterModuleOptions['limits'] = {
  fileSize: 100 * BYTES_PER_MEGABYTE,
  files: MAX_FILES_PER_UPLOAD,
  fields: MAX_TEXT_FIELDS_PER_UPLOAD,
};

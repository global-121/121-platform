import { FileInterceptor } from '@nestjs/platform-express';

import { FileUploadLimits } from '@121-service/src/shared/file-upload-limits';

export function createFileUploadInterceptor({
  fieldName,
  limits,
}: {
  fieldName: string;
  limits: FileUploadLimits;
}) {
  return FileInterceptor(fieldName, { limits });
}
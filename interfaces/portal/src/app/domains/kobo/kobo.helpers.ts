import { CreateQueryResult } from '@tanstack/angular-query-experimental';

import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';

export const isKoboIntegrated = (
  integration: CreateQueryResult<KoboResponseDto>,
) => {
  if (!integration.isSuccess()) {
    return false;
  }
  const data = integration.data();

  return data.versionId ? true : false;
};

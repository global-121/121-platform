import { CreateQueryResult } from '@tanstack/angular-query-experimental';
import { withoutTrailingSlash } from 'ufo';

import { ActivityInfoResponseDto } from '@121-service/src/activityinfo/dtos/activityinfo-response.dto';

const ACTIVITY_INFO_URL_FORM_PREFIX = 'form';

export const isActivityInfoIntegrated = (
  integration: CreateQueryResult<ActivityInfoResponseDto>,
) => {
  if (!integration.isSuccess()) {
    return false;
  }

  const data = integration.data();

  return !!data.formId;
};

// See: https://www.activityinfo.org/support/docs/api/reference/getFormSchema.html
export const buildActivityInfoFormUrl = ({
  serverUrl,
  formId,
}: {
  serverUrl: string;
  formId: string;
}): string =>
  `${withoutTrailingSlash(serverUrl)}/app#${ACTIVITY_INFO_URL_FORM_PREFIX}/${formId}/table`;

/**
 * Parses an ActivityInfo form URL such as
 * 'https://www.activityinfo.org/app#form/cqlnfvvmel72a2ka/table'.
 * The form id is the segment directly after '#form/'; anything after it is
 * view-specific and ignored.
 */
export const extractServerAndFormIdFromUrl = (
  rawUrl: string,
): { serverUrl?: string; formId?: string } => {
  let urlObject: URL;
  try {
    urlObject = new URL(rawUrl);
  } catch {
    return {};
  }

  const hashParts = urlObject.hash.replace(/^#/, '').split('/');
  const partFormPrefix = hashParts[0] ?? '';
  const partFormId = hashParts[1] ?? '';

  const formId = decodeURIComponent(partFormId).trim();

  if (partFormPrefix !== ACTIVITY_INFO_URL_FORM_PREFIX || !formId) {
    return {};
  }

  // The ActivityInfo app is served from a path ('/app'), which is not part of
  // the API base URL, so only the origin is kept as the server URL.
  return { serverUrl: urlObject.origin, formId };
};

export enum ImportExistingRecordsResultKey {
  numberOfRecordsFailed = 'numberOfRecordsFailed',
  numberOfRecordsImported = 'numberOfRecordsImported',
  numberOfRecordsSkipped = 'numberOfRecordsSkipped',
}

export const RECORD_RESULT_LABELS: Record<
  ImportExistingRecordsResultKey,
  string
> = {
  [ImportExistingRecordsResultKey.numberOfRecordsFailed]: $localize`:@@record-result-failed:Records failed`,
  [ImportExistingRecordsResultKey.numberOfRecordsImported]: $localize`:@@record-result-imported:Imported successfully`,
  [ImportExistingRecordsResultKey.numberOfRecordsSkipped]: $localize`:@@record-result-skipped:Records skipped`,
};

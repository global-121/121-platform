import { CreateQueryResult } from '@tanstack/angular-query-experimental';
import { withoutTrailingSlash } from 'ufo';

import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';

const KOBO_URL_FORMS_PREFIX = 'forms';

export const isKoboIntegrated = (
  integration: CreateQueryResult<KoboResponseDto>,
) => {
  if (!integration.isSuccess()) {
    return false;
  }
  const data = integration.data();

  return data.versionId && data.versionId !== '' ? true : false;
};

// See: https://support.kobotoolbox.org/api.html#retrieving-your-project-asset-uid
export const buildKoboFormUrl = ({
  serverUrl,
  assetUid,
}: {
  serverUrl: string;
  assetUid: string;
}): string =>
  `${withoutTrailingSlash(serverUrl)}/#/${KOBO_URL_FORMS_PREFIX}/${assetUid}/summary`;

export const extractServerAndAssetIdFromUrl = (
  rawUrl: string,
): { serverUrl?: string; assetId?: string } => {
  let urlObj: URL;
  try {
    urlObj = new URL(rawUrl);
  } catch {
    return {};
  }

  // NOTE: We're NOT using only `urlObj.origin` as the Kobo server may require a path-segment. (i.e our Mock-Service!)
  const serverUrl = urlObj.origin + urlObj.pathname;

  // Extract the asset UID from the URL hash; In the format: "https://example.net/#/forms/[project asset UID]/summary"
  // See: https://support.kobotoolbox.org/api.html#retrieving-your-project-asset-uid
  const hashParts = urlObj.hash.split('/');
  const partFormPrefix = hashParts[1] ?? '';
  const partFormAssetId = hashParts[2] ?? '';

  const assetId = decodeURIComponent(partFormAssetId).trim();

  if (partFormPrefix === KOBO_URL_FORMS_PREFIX && assetId) {
    return { serverUrl, assetId };
  }

  return {};
};

export enum ImportExistingSubmissionsResultKey {
  numberOfSubmissionsFailed = 'numberOfSubmissionsFailed',
  numberOfSubmissionsImported = 'numberOfSubmissionsImported',
  numberOfSubmissionsSkipped = 'numberOfSubmissionsSkipped',
}

export const SUBMISSION_RESULT_LABELS: Record<
  ImportExistingSubmissionsResultKey,
  string
> = {
  [ImportExistingSubmissionsResultKey.numberOfSubmissionsFailed]: $localize`:@@submission-result-failed:Submissions failed`,
  [ImportExistingSubmissionsResultKey.numberOfSubmissionsImported]: $localize`:@@submission-result-imported:Imported successfully`,
  [ImportExistingSubmissionsResultKey.numberOfSubmissionsSkipped]: $localize`:@@submission-result-skipped:Submissions skipped`,
};

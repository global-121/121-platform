import { stripHtmlTags } from '@121-service/src/utils/strip-html-tags.helper';

export function sanitizeEmailInput<T extends { displayName: string }>(
  input: T,
): T {
  return {
    ...input,
    displayName: stripHtmlTags(input.displayName),
  };
}

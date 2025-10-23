import * as he from 'he';

export function stripHtmlTags(input: string): string {
  const decodedInput = he.decode(input);
  const strippedInput = decodedInput.replace(/<[^>]*>/g, '');

  return strippedInput;
}

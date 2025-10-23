export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

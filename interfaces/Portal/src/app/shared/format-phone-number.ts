export function formatPhoneNumber(value: string): string {
  if (!value) {
    return '';
  }

  return value.replace(/(\+*)(\d{2})(\d{1})(\d{2})(\d{3})(\d+)/, '+$2$3$4$5$6');
}

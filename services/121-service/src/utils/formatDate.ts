function padTo2Digits(num: number): string {
  return num.toString().padStart(2, '0');
}

export function formatDateYYMMDD(date: Date): string {
  return [
    date.getFullYear().toString().substring(2),
    padTo2Digits(date.getMonth() + 1),
    padTo2Digits(date.getDate()),
  ].join('');
}

export function formatDateIntl(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Forces 24-hour time (12:51 instead of 12:51 PM)
  }).format(date);
}

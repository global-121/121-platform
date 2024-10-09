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

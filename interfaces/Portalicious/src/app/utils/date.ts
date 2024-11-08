export function addDaysToDate(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function dateToIsoString(date: Date) {
  return new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  ).toISOString();
}

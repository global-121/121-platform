export const addDaysToDate = (date: Date, days: number) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

export const dateToIsoString = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();

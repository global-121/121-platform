export const dateToIsoString = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();

export const parseDateValue = ({
  value,
}: {
  value: Date | number | string;
}): Date | number | string => {
  if (typeof value === 'string' && /^\d{1,2}-\d{1,2}-\d{4}$/.test(value)) {
    const [day, month, year] = value.split('-').map(Number);
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return new Date(Number.NaN);
    }

    return date;
  }

  return value;
};

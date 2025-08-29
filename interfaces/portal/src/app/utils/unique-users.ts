import { unique } from 'radashi';

export const getUniqueUserOptions = (
  options: { user?: { username?: string } }[],
) =>
  unique(
    options.map(({ user }) => ({
      label: user?.username ?? $localize`Unknown user`,
      value: user?.username ?? $localize`Unknown user`,
    })),
    (activity) => activity.value,
  ).sort((a, b) => a.label.localeCompare(b.label));

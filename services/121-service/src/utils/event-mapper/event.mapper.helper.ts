// TODO this file now is a helper for payment-events.mapper and transaction-events.mapper, but activities.mapper could also be included.
export function mapEventsToDto<T, D>(
  entities: T[],
  mapEntityToDto: (entity: T) => D,
  getType: (entity: T) => string | number,
): {
  meta: { count: Partial<Record<string | number, number>>; total: number };
  data: D[];
} {
  const data = entities.map(mapEntityToDto);
  const count: Partial<Record<string | number, number>> = {};
  for (const entity of entities) {
    const type = getType(entity);
    count[type] = (count[type] ?? 0) + 1;
  }
  const total = entities.length;
  return {
    meta: { count, total },
    data,
  };
}

export function mapUserToDto(user?: {
  id?: number;
  username?: string | null;
}): { id: number; username: string } | null {
  if (user?.id && user?.username) {
    return { id: user.id, username: user.username };
  } else {
    return null;
  }
}

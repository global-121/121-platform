import { mapEventsToDto } from '@121-service/src/utils/event-mapper/event.mapper.helper';

interface TestEvent {
  id: number;
  type: string;
  created: Date;
  user?: unknown;
}

describe('mapEventsToDto', () => {
  it('should handle empty input array', () => {
    const events: TestEvent[] = [];
    const result = mapEventsToDto(
      events,
      (e) => e,
      (e) => e.type,
    );
    expect(result.meta).toEqual({ count: {}, total: 0 });
    expect(result.data).toHaveLength(0);
  });

  it('should handle events without user information', () => {
    const testDate = new Date();
    const events: TestEvent[] = [
      {
        id: 1,
        type: 'created',
        created: testDate,
        user: undefined,
      },
    ];
    const result = mapEventsToDto(
      events,
      (e) => ({
        id: e.id,
        type: e.type,
        created: e.created,
        user: e.user ?? null,
      }),
      (e) => e.type,
    );

    expect(result.meta).toEqual({
      count: { created: 1 },
      total: 1,
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({
      id: 1,
      type: 'created',
      created: testDate,
      user: null,
    });
  });

  // Add more generic tests for count, total, etc. if needed
});

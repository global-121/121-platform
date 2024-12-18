import { TestBed } from '@automock/jest';

import { EventsService } from '@121-service/src/events/events.service';

describe('Works!', () => {
  let eventsService: EventsService;

  beforeEach(() => {
    const { unit } = TestBed.create(EventsService).compile();
    eventsService = unit;
  });

  it('should be defined', () => {
    expect(eventsService).toBeDefined();
  });
});

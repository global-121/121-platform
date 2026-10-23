import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  provideTanStackQuery,
  QueryClient,
  queryOptions,
} from '@tanstack/angular-query-experimental';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { ProgramApiService } from '~/domains/program/program.api.service';
import { AccessGroupsCardComponent } from '~/pages/program-settings-registration-data/components/access-groups-card/access-groups-card.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import { TrackingService } from '~/services/tracking/tracking.service';

describe('Access group editing availability', () => {
  let fixture: ComponentFixture<AccessGroupsCardComponent>;
  let hasEditPermission: boolean;

  const programQuery = vi.fn(() =>
    Promise.resolve({ programRegistrationAttributes: [] }),
  );
  const accessGroupLevelsQuery = vi.fn(() =>
    Promise.resolve({
      accessGroupRegistrationAttributeNames: ['county', 'ward'],
    }),
  );

  beforeEach(async () => {
    hasEditPermission = true;
    programQuery.mockReset();
    programQuery.mockResolvedValue({ programRegistrationAttributes: [] });
    accessGroupLevelsQuery.mockReset();
    accessGroupLevelsQuery.mockResolvedValue({
      accessGroupRegistrationAttributeNames: ['county', 'ward'],
    });

    await TestBed.configureTestingModule({
      imports: [AccessGroupsCardComponent],
      providers: [
        provideTanStackQuery(
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
            },
          }),
        ),
        {
          provide: ProgramApiService,
          useValue: {
            getProgram: () => () =>
              queryOptions({
                queryKey: ['program'],
                queryFn: programQuery,
              }),
            getAccessGroupLevels: () => () =>
              queryOptions({
                queryKey: ['accessGroupLevels'],
                queryFn: accessGroupLevelsQuery,
              }),
          },
        },
        {
          provide: AuthService,
          useValue: {
            hasPermission: ({
              requiredPermission,
            }: {
              requiredPermission: PermissionEnum;
            }) =>
              requiredPermission === PermissionEnum.ProgramREAD ||
              hasEditPermission,
          },
        },
        { provide: ToastService, useValue: { showToast: vi.fn() } },
        { provide: TrackingService, useValue: { trackEvent: vi.fn() } },
        MessageService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessGroupsCardComponent);
    fixture.componentRef.setInput('programId', '1');
  });

  it.each([
    { query: 'program', status: 'pending' },
    { query: 'program', status: 'error' },
    { query: 'accessGroupLevels', status: 'pending' },
    { query: 'accessGroupLevels', status: 'error' },
  ] as const)(
    'should prevent editing when $query is $status',
    async ({ query, status }) => {
      // Arrange
      const queryFunction =
        query === 'program' ? programQuery : accessGroupLevelsQuery;
      if (status === 'pending') {
        queryFunction.mockImplementation(
          () => new Promise<never>(() => undefined),
        );
      } else {
        queryFunction.mockRejectedValue(new Error('Request failed'));
      }

      // Act
      fixture.detectChanges();
      const component = fixture.componentInstance;
      await vi.waitFor(() => {
        expect(component[query].status()).toBe(status);
        const otherQuery =
          query === 'program' ? component.accessGroupLevels : component.program;
        expect(otherQuery.status()).toBe('success');
      });
      fixture.detectChanges();

      // Assert
      expect(component.canEdit()).toBe(false);
      expect(
        (fixture.nativeElement as HTMLElement).querySelector(
          'button[aria-label="Edit access groups"]',
        ),
      ).toBeNull();
    },
  );

  it('should allow editing with the existing levels after both queries succeed', async () => {
    // Arrange
    const component = fixture.componentInstance;

    // Act
    fixture.detectChanges();
    await vi.waitFor(() => {
      expect(component.program.isSuccess()).toBe(true);
      expect(component.accessGroupLevels.isSuccess()).toBe(true);
    });
    fixture.detectChanges();

    // Assert
    expect(component.canEdit()).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'button[aria-label="Edit access groups"]',
      ),
    ).not.toBeNull();
    expect(component.accessGroupLevelControls.getRawValue()).toEqual([
      'county',
      'ward',
    ]);
  });

  it('should prevent editing without update permission even after both queries succeed', async () => {
    // Arrange
    hasEditPermission = false;
    const component = fixture.componentInstance;

    // Act
    fixture.detectChanges();
    await vi.waitFor(() => {
      expect(component.program.isSuccess()).toBe(true);
      expect(component.accessGroupLevels.isSuccess()).toBe(true);
    });
    fixture.detectChanges();

    // Assert
    expect(component.canEdit()).toBe(false);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'button[aria-label="Edit access groups"]',
      ),
    ).toBeNull();
  });
});

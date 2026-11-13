import { TestBed } from '@angular/core/testing';

import {
  provideTanStackQuery,
  QueryClient,
  queryOptions,
} from '@tanstack/angular-query-experimental';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProgramApiService } from '~/domains/program/program.api.service';
import { ProgramUserWithRolesLabel } from '~/domains/program/program.model';
import { ProgramSettingsTeamPageComponent } from '~/pages/program-settings-team/program-settings-team.page';
import { AuthService } from '~/services/auth.service';

const mockQueryFactory = <T>({
  data,
  queryKey,
}: {
  data: T;
  queryKey: string;
}) => {
  return () =>
    queryOptions({
      queryKey: [queryKey, data],
      queryFn: () => Promise.resolve(data),
      initialData: data,
    });
};

const user: ProgramUserWithRolesLabel = {
  id: 1,
  username: 'team-member@example.org',
  admin: false,
  active: true,
  lastLogin: undefined,
  scope: 'north',
  isEligiblePaymentApprover: false,
  roles: [],
  allRolesLabel: '',
  accessGroups: [],
};

describe('Program team access groups', () => {
  const programApiService = {
    getProgram: vi.fn(),
    getProgramUsers: vi.fn(),
    getAccessGroupLevels: vi.fn(),
  };

  beforeEach(async () => {
    programApiService.getProgram.mockReturnValue(
      mockQueryFactory({
        queryKey: 'program',
        data: { enableScope: false, programRegistrationAttributes: [] },
      }),
    );
    programApiService.getProgramUsers.mockReturnValue(
      mockQueryFactory({ queryKey: 'users', data: [user] }),
    );
    programApiService.getAccessGroupLevels.mockReturnValue(
      mockQueryFactory({
        queryKey: 'access-group-levels',
        data: { accessGroupRegistrationAttributeNames: [] },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [ProgramSettingsTeamPageComponent],
      providers: [
        provideTanStackQuery(new QueryClient()),
        { provide: ProgramApiService, useValue: programApiService },
        {
          provide: AuthService,
          useValue: { hasPermission: () => false },
        },
        MessageService,
      ],
    })
      .overrideComponent(ProgramSettingsTeamPageComponent, {
        set: { imports: [], template: '' },
      })
      .compileComponents();
  });

  const createComponent = () => {
    const fixture = TestBed.createComponent(ProgramSettingsTeamPageComponent);
    fixture.componentRef.setInput('programId', '1');
    return fixture.componentInstance;
  };

  it.each([undefined, { accessGroupRegistrationAttributeNames: [] }])(
    'hides the column when access groups are not configured (%j)',
    (data) => {
      // Arrange
      programApiService.getAccessGroupLevels.mockReturnValue(
        mockQueryFactory({ queryKey: 'access-group-levels', data }),
      );
      const component = createComponent();

      // Act
      const fields = component.columns().map(({ field }) => field);

      // Assert
      expect(fields).toEqual(['username', 'allRolesLabel']);
    },
  );

  it.each([false, true])(
    'shows the column for configured programs independently of scope (%s)',
    (enableScope) => {
      // Arrange
      programApiService.getProgram.mockReturnValue(
        mockQueryFactory({
          queryKey: 'program',
          data: { enableScope, programRegistrationAttributes: [] },
        }),
      );
      programApiService.getAccessGroupLevels.mockReturnValue(
        mockQueryFactory({
          queryKey: 'access-group-levels',
          data: { accessGroupRegistrationAttributeNames: ['region'] },
        }),
      );
      const component = createComponent();

      // Act
      const fields = component.columns().map(({ field }) => field);

      // Assert
      expect(fields).toEqual([
        'username',
        'allRolesLabel',
        ...(enableScope ? ['scope'] : []),
        'accessGroupLabel',
      ]);
    },
  );

  it('leaves the cell empty for an unrestricted team member', () => {
    // Arrange
    const component = createComponent();

    // Act
    const rows = component.tableRows();

    // Assert
    expect(rows).toEqual([{ ...user, accessGroupLabel: '' }]);
  });

  it('shows localized labels in assigned hierarchy order', () => {
    // Arrange
    programApiService.getProgram.mockReturnValue(
      mockQueryFactory({
        queryKey: 'program',
        data: {
          programRegistrationAttributes: [
            {
              name: 'district',
              options: [{ option: 'west', label: { en: 'West district' } }],
            },
            {
              name: 'region',
              options: [{ option: 'north', label: { en: 'North region' } }],
            },
          ],
        },
      }),
    );
    programApiService.getProgramUsers.mockReturnValue(
      mockQueryFactory({
        queryKey: 'users',
        data: [
          {
            ...user,
            accessGroups: [
              { programRegistrationAttributeName: 'region', value: 'north' },
              { programRegistrationAttributeName: 'district', value: 'west' },
            ],
          },
        ],
      }),
    );
    const component = createComponent();

    // Act
    const rows = component.tableRows();

    // Assert
    expect(rows[0].accessGroupLabel).toBe('North region / West district');
  });

  it.each([
    { attributes: [] },
    { attributes: [{ name: 'region', options: [] }] },
    {
      attributes: [
        { name: 'region', options: [{ option: 'north', label: {} }] },
      ],
    },
    {
      attributes: [
        { name: 'region', options: [{ option: 'north', label: { en: '' } }] },
      ],
    },
  ])(
    'keeps the value when no translated label exists (%j)',
    ({ attributes }) => {
      // Arrange
      programApiService.getProgram.mockReturnValue(
        mockQueryFactory({
          queryKey: 'program',
          data: { programRegistrationAttributes: attributes },
        }),
      );
      programApiService.getProgramUsers.mockReturnValue(
        mockQueryFactory({
          queryKey: 'users',
          data: [
            {
              ...user,
              accessGroups: [
                { programRegistrationAttributeName: 'region', value: 'north' },
              ],
            },
          ],
        }),
      );
      const component = createComponent();

      // Act
      const rows = component.tableRows();

      // Assert
      expect(rows[0].accessGroupLabel).toBe('north');
    },
  );

  it('returns no rows while team members are loading', () => {
    // Arrange
    programApiService.getProgramUsers.mockReturnValue(
      mockQueryFactory({ queryKey: 'users', data: undefined }),
    );
    const component = createComponent();

    // Act
    const rows = component.tableRows();

    // Assert
    expect(rows).toEqual([]);
  });
});

import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  provideTanStackQuery,
  QueryClient,
  queryOptions,
} from '@tanstack/angular-query-experimental';
import { beforeEach, describe, expect, it } from 'vitest';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { DEFAULT_USER_ROLES } from '@121-service/src/user/const/default-user-roles.const';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';

import { DataListComponent } from '~/components/data-list/data-list.component';
import { PageLayoutRegistrationComponent } from '~/components/page-layout-registration/page-layout-registration.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { AccessGroupLevels, Program } from '~/domains/program/program.model';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { AuthService } from '~/services/auth.service';
import { PaginateQueryService } from '~/services/paginate-query.service';
import { RegistrationActionMenuService } from '~/services/registration-action-menu.service';
import { RegistrationAttributeService } from '~/services/registration-attribute.service';
import { RegistrationLookupService } from '~/services/registration-lookup.service';
import { Locale } from '~/utils/locale';

const mockQuery = <T>({ key, data }: { key: string; data: T }) =>
  queryOptions({
    queryKey: [key, data],
    queryFn: () => Promise.resolve(data),
    initialData: data,
    staleTime: Infinity,
  });

describe('Registration profile access group', () => {
  let levels: AccessGroupLevels;
  let program: {
    enableScope: boolean;
    programRegistrationAttributes: Pick<
      Program['programRegistrationAttributes'][number],
      'name' | 'options'
    >[];
  };
  let registration: Record<string, unknown>;
  let queryClient: QueryClient;
  let userPermissions: PermissionEnum[];

  const getRolePermissions = (defaultUserRole: DefaultUserRole) => {
    const userRole = DEFAULT_USER_ROLES.find(
      ({ role }) => role === defaultUserRole,
    );
    if (!userRole) {
      throw new Error(`${defaultUserRole} role must be configured`);
    }
    return userRole.permissions;
  };

  beforeEach(async () => {
    userPermissions = getRolePermissions(DefaultUserRole.ViewWithoutPII);

    levels = {
      accessGroupRegistrationAttributeNames: ['region', 'district'],
    };
    program = {
      enableScope: false,
      programRegistrationAttributes: [
        {
          name: 'district',
          options: [
            {
              option: 'turkana-north',
              label: { en: 'Turkana North', nl: 'Noord-Turkana' },
            },
          ],
        },
        {
          name: 'region',
          options: [
            { option: 'turkana', label: { en: 'Turkana', nl: 'Turkana (NL)' } },
          ],
        },
      ],
    };
    registration = {
      status: RegistrationStatusEnum.included,
      paymentCount: 6,
      region: 'turkana',
      district: 'turkana-north',
      scope: 'turkana.turkana-north',
    };
    queryClient = new QueryClient();

    TestBed.overrideComponent(PageLayoutRegistrationComponent, {
      set: {
        imports: [DataListComponent],
        template: '<app-data-list [data]="registrationData()" />',
      },
    });
    await TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(queryClient),
        provideRouter([]),
        { provide: LOCALE_ID, useValue: Locale.en },
        {
          provide: ProgramApiService,
          useValue: {
            getProgram: () => () =>
              mockQuery({ key: 'program', data: program }),
            getAccessGroupLevels: () => () =>
              mockQuery({ key: 'levels', data: levels }),
          },
        },
        {
          provide: RegistrationApiService,
          useValue: {
            getRegistrationById: () => () =>
              mockQuery({ key: 'registration', data: registration }),
          },
        },
        {
          provide: RegistrationAttributeService,
          useValue: {
            getRegistrationAttributes: () => {
              throw new Error(
                'ViewWithoutPII cannot read program registration attributes',
              );
            },
          },
        },
        {
          provide: AuthService,
          useValue: {
            hasPermission: ({
              requiredPermission,
            }: {
              requiredPermission: PermissionEnum;
            }) => userPermissions.includes(requiredPermission),
          },
        },
        { provide: PaginateQueryService, useValue: {} },
        { provide: RegistrationActionMenuService, useValue: {} },
        { provide: RegistrationLookupService, useValue: {} },
      ],
    }).compileComponents();
  });

  const createFixture = () => {
    const fixture = TestBed.createComponent(PageLayoutRegistrationComponent);
    fixture.componentRef.setInput('programId', '1');
    fixture.componentRef.setInput('registrationId', '1');
    fixture.detectChanges();
    return fixture;
  };

  it('shows option labels in configured level order, separated by >', () => {
    // Arrange
    const fixture = createFixture();

    // Act
    const row = fixture.componentInstance
      .registrationData()
      .find((item) => item.label === 'Access group');

    // Assert
    expect(row).toMatchObject({
      type: 'text',
      value: 'Turkana > Turkana North',
      loading: false,
    });
  });

  it('renders translated option labels for the current locale', () => {
    // Arrange
    TestBed.overrideProvider(LOCALE_ID, { useValue: Locale.nl });
    const fixture = createFixture();

    // Act
    const text = (fixture.nativeElement as HTMLElement).textContent;

    // Assert
    expect(text).toContain('Turkana (NL) > Noord-Turkana');
  });

  it('shows labels for ViewWithoutPII without requesting protected attribute metadata', () => {
    // Arrange
    const fixture = createFixture();

    // Act
    const accessGroup = fixture.componentInstance
      .registrationData()
      .find((item) => item.label === 'Access group');

    // Assert
    expect(userPermissions).not.toContain(
      PermissionEnum.ProgramRegistrationAttributesREAD,
    );
    expect(accessGroup?.value).toBe('Turkana > Turkana North');
  });

  it.each([DefaultUserRole.Approver, DefaultUserRole.ProgramTeamManager])(
    'does not request access group levels for %s without ProgramREAD',
    async (role) => {
      // Arrange
      userPermissions = getRolePermissions(role);
      let accessGroupLevelsRequestCount = 0;
      TestBed.overrideProvider(ProgramApiService, {
        useValue: {
          getProgram: () => () => mockQuery({ key: 'program', data: program }),
          getAccessGroupLevels: () => () =>
            queryOptions({
              queryKey: ['levels-without-initial-data', levels],
              queryFn: () => {
                accessGroupLevelsRequestCount++;
                return Promise.resolve(levels);
              },
            }),
        },
      });
      const fixture = createFixture();

      // Act
      await fixture.whenStable();
      const accessGroup = fixture.componentInstance
        .registrationData()
        .find((item) => item.label === 'Access group');

      // Assert
      expect(userPermissions).not.toContain(PermissionEnum.ProgramREAD);
      expect(accessGroupLevelsRequestCount).toBe(0);
      expect(accessGroup).toBeUndefined();
    },
  );

  it('hides the access group row when no levels are configured', () => {
    // Arrange
    levels = { accessGroupRegistrationAttributeNames: [] };
    const fixture = createFixture();

    // Act
    const rows = fixture.componentInstance.registrationData();

    // Assert
    expect(rows.map((item) => item.label)).not.toContain('Access group');
  });

  it('shows a dash when configured access group values are missing', () => {
    // Arrange
    registration.region = null;
    registration.district = undefined;
    const fixture = createFixture();

    // Act
    const text = (fixture.nativeElement as HTMLElement).textContent;

    // Assert
    expect(text).toMatch(/Access group:\s*—/);
  });

  it.each([null, undefined, '', 42, false, []])(
    'skips an empty or non-string level value (%j)',
    (value) => {
      // Arrange
      registration.district = value;
      const fixture = createFixture();

      // Act
      const row = fixture.componentInstance
        .registrationData()
        .find((item) => item.label === 'Access group');

      // Assert
      expect(row?.value).toBe('Turkana');
    },
  );

  it('falls back to the stored value when no option matches', () => {
    // Arrange
    registration.district = 'unknown-district';
    const fixture = createFixture();

    // Act
    const row = fixture.componentInstance
      .registrationData()
      .find((item) => item.label === 'Access group');

    // Assert
    expect(row?.value).toBe('Turkana > unknown-district');
  });

  it.each([{}, { en: '' }])(
    'falls back to the stored value when an option has no label (%j)',
    (label) => {
      // Arrange
      program.programRegistrationAttributes[0].options = [
        { option: 'turkana-north', label },
      ];
      const fixture = createFixture();

      // Act
      const row = fixture.componentInstance
        .registrationData()
        .find((item) => item.label === 'Access group');

      // Assert
      expect(row?.value).toBe('Turkana > turkana-north');
    },
  );

  it.each([true, false])(
    'only shows Scope when scope is enabled (%j), independently of access groups',
    (enableScope) => {
      // Arrange
      program.enableScope = enableScope;
      const fixture = createFixture();

      // Act
      const rows = fixture.componentInstance.registrationData();

      // Assert
      expect(rows.some((item) => item.label === 'Scope')).toBe(enableScope);
      expect(rows.some((item) => item.label === 'Access group')).toBe(true);
    },
  );

  it('updates the access group when registration data changes', async () => {
    // Arrange
    const fixture = createFixture();
    queryClient.setQueriesData(
      { queryKey: ['registration'] },
      { ...registration, district: null },
    );
    // Act & Assert
    await expect
      .poll(
        () =>
          fixture.componentInstance
            .registrationData()
            .find((item) => item.label === 'Access group')?.value,
      )
      .toBe('Turkana');
  });
});

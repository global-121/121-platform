import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  provideTanStackQuery,
  QueryClient,
  queryOptions,
} from '@tanstack/angular-query-experimental';
import { MessageService } from 'primeng/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { ProgramApiService } from '~/domains/program/program.api.service';
import {
  AccessGroupLevels,
  Program,
  ProgramAttachment,
  ProgramAttachmentFileType,
} from '~/domains/program/program.model';
import { ProgramMonitoringFilesPageComponent } from '~/pages/program-monitoring-files/program-monitoring-files.page';
import { AuthService } from '~/services/auth.service';
import { DownloadService } from '~/services/download.service';
import { Locale } from '~/utils/locale';

const mockQuery = <T>({ key, data }: { key: string; data: T }) =>
  queryOptions({
    queryKey: [key, data],
    queryFn: () => Promise.resolve(data),
    initialData: data,
    staleTime: Infinity,
  });

describe('Monitoring files access groups', () => {
  let levels: AccessGroupLevels;
  let program: {
    enableScope: boolean;
    programRegistrationAttributes: Pick<
      Program['programRegistrationAttributes'][number],
      'name' | 'options'
    >[];
  };
  let attachments: ProgramAttachment[];
  let queryClient: QueryClient;
  let canReadProgram: boolean;

  beforeEach(() => {
    levels = {
      accessGroupRegistrationAttributeNames: ['region', 'district'],
    };
    program = {
      enableScope: false,
      programRegistrationAttributes: [
        {
          name: 'region',
          options: [{ option: 'north', label: { en: 'North' } }],
        },
        {
          name: 'district',
          options: [{ option: 'central', label: { en: 'Central' } }],
        },
      ],
    };
    attachments = [
      {
        id: 1,
        created: '2026-11-13T12:00:00.000Z',
        updated: '2026-11-13T12:00:00.000Z',
        programId: 1,
        user: { id: 1, username: 'uploader@example.org' },
        filename: 'report.pdf',
        mimetype: 'application/pdf',
        fileType: ProgramAttachmentFileType.PDF,
        scope: 'north.central',
        accessGroups: [
          { programRegistrationAttributeName: 'region', value: 'north' },
          { programRegistrationAttributeName: 'district', value: 'central' },
        ],
      },
    ];
    queryClient = new QueryClient();
    canReadProgram = true;
  });

  afterEach(() => {
    queryClient.clear();
  });

  const createFixture = async () => {
    TestBed.overrideComponent(ProgramMonitoringFilesPageComponent, {
      set: {
        imports: [],
        template: '',
      },
    });
    await TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(queryClient),
        MessageService,
        { provide: LOCALE_ID, useValue: Locale.en },
        {
          provide: ProgramApiService,
          useValue: {
            getProgram: () => () =>
              mockQuery({ key: 'program', data: program }),
            getAccessGroupLevels: () => () => ({
              queryKey: ['levels', levels],
              queryFn: () => Promise.resolve(levels),
              staleTime: Infinity,
            }),
            getProgramAttachments: () => () =>
              mockQuery({ key: 'attachments', data: attachments }),
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
              requiredPermission === PermissionEnum.ProgramREAD &&
              canReadProgram,
          },
        },
        { provide: DownloadService, useValue: {} },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(
      ProgramMonitoringFilesPageComponent,
    );
    fixture.componentRef.setInput('programId', '1');
    fixture.detectChanges();
    if (canReadProgram) {
      await vi.waitFor(() => {
        expect(fixture.componentInstance.accessGroupLevels.isSuccess()).toBe(
          true,
        );
      });
    }
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  it('shows the access group column when levels are configured', async () => {
    // Arrange
    const fixture = await createFixture();

    // Act
    const column = fixture.componentInstance
      .columns()
      .find(({ field }) => field === 'accessGroupLabel');

    // Assert
    expect(column).toMatchObject({ header: 'Access group' });
  });

  it('hides access groups when no levels are configured', async () => {
    // Arrange
    levels = { accessGroupRegistrationAttributeNames: [] };
    const fixture = await createFixture();

    // Act
    const fields = fixture.componentInstance
      .columns()
      .map(({ field }) => field);

    // Assert
    expect(fields).not.toContain('accessGroupLabel');
  });

  it('does not request or show access group levels without program read permission', async () => {
    // Arrange
    canReadProgram = false;
    const fixture = await createFixture();

    // Act
    const state = queryClient.getQueryState(['levels', levels]);
    const fields = fixture.componentInstance
      .columns()
      .map(({ field }) => field);

    // Assert
    expect(state).toMatchObject({ fetchStatus: 'idle', data: undefined });
    expect(fields).not.toContain('accessGroupLabel');
  });

  it('keeps files with no recorded access groups visible', async () => {
    // Arrange
    attachments = [{ ...attachments[0], accessGroups: [] }];
    const fixture = await createFixture();

    // Act
    const rows = fixture.componentInstance.attachmentTableRows();

    // Assert
    expect(rows).toMatchObject([{ accessGroupLabel: '' }]);
  });

  it('uses the labels of the access groups recorded at upload time', async () => {
    // Arrange
    levels = { accessGroupRegistrationAttributeNames: ['new-region'] };
    const fixture = await createFixture();

    // Act
    const rows = fixture.componentInstance.attachmentTableRows();

    // Assert
    expect(rows[0].accessGroupLabel).toBe('North / Central');
  });

  it('uses recorded values when the access group attributes no longer exist', async () => {
    // Arrange
    program.programRegistrationAttributes = [];
    const fixture = await createFixture();

    // Act
    const rows = fixture.componentInstance.attachmentTableRows();

    // Assert
    expect(rows[0].accessGroupLabel).toBe('north / central');
  });
});

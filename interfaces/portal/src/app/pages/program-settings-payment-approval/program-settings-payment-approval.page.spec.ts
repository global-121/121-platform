import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  provideTanStackQuery,
  QueryClient,
  queryOptions,
} from '@tanstack/angular-query-experimental';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { ProgramSettingsPaymentApprovalPageComponent } from '~/pages/program-settings-payment-approval/program-settings-payment-approval.page';
import { AuthService } from '~/services/auth.service';

// Returns a query factory (matching the shape returned by generateQueryOptions)
// that immediately resolves with the provided data (success state via initialData).
const mockQueryFactory =
  <T>(initialData: T) =>
  () =>
    queryOptions({
      queryKey: ['mock', initialData],
      queryFn: (): Promise<T> => {
        throw new Error('mock query - should never be called');
      },
      initialData,
    });

class ResizeObserverMock {
  observe(): void {
    return;
  }
  unobserve(): void {
    return;
  }
  disconnect(): void {
    return;
  }
}

describe('ProgramSettingsPaymentApprovalPageComponent', () => {
  let mockFspConfigurationApiService: {
    getFspConfigurations: ReturnType<typeof vi.fn>;
  };
  let mockProgramApiService: {
    getApprovalThresholds: ReturnType<typeof vi.fn>;
    getProgram: ReturnType<typeof vi.fn>;
    getProgramUsers: ReturnType<typeof vi.fn>;
    createOrReplaceApprovalThresholds: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: {
    hasAllPermissions: ReturnType<typeof vi.fn>;
    hasSomePermission: ReturnType<typeof vi.fn>;
    hasPermission: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: ResizeObserverMock,
    });

    mockFspConfigurationApiService = {
      getFspConfigurations: vi
        .fn()
        .mockName('FspConfigurationApiService.getFspConfigurations')
        .mockReturnValue(mockQueryFactory([])),
    };
    mockProgramApiService = {
      getApprovalThresholds: vi
        .fn()
        .mockName('ProgramApiService.getApprovalThresholds')
        .mockReturnValue(mockQueryFactory([])),
      getProgram: vi
        .fn()
        .mockName('ProgramApiService.getProgram')
        .mockReturnValue(mockQueryFactory({ currency: 'EUR' })),
      getProgramUsers: vi
        .fn()
        .mockName('ProgramApiService.getProgramUsers')
        .mockReturnValue(mockQueryFactory([])),
      createOrReplaceApprovalThresholds: vi
        .fn()
        .mockName('ProgramApiService.createOrReplaceApprovalThresholds')
        .mockResolvedValue([]),
    };
    mockAuthService = {
      hasAllPermissions: vi
        .fn()
        .mockName('AuthService.hasAllPermissions')
        .mockReturnValue(false),
      hasSomePermission: vi
        .fn()
        .mockName('AuthService.hasSomePermission')
        .mockReturnValue(false),
      hasPermission: vi
        .fn()
        .mockName('AuthService.hasPermission')
        .mockReturnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [ProgramSettingsPaymentApprovalPageComponent],
      providers: [
        provideTanStackQuery(new QueryClient()),
        provideRouter([]),
        {
          provide: FspConfigurationApiService,
          useValue: mockFspConfigurationApiService,
        },
        { provide: ProgramApiService, useValue: mockProgramApiService },
        { provide: AuthService, useValue: mockAuthService },
        MessageService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  const createFixture = () => {
    const fixture = TestBed.createComponent(
      ProgramSettingsPaymentApprovalPageComponent,
    );
    fixture.componentRef.setInput('programId', '1');
    return fixture;
  };

  it('should create', () => {
    // Arrange / Act
    const fixture = createFixture();

    // Assert
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should return an empty table when the API returns no thresholds', () => {
    // Arrange
    mockProgramApiService.getApprovalThresholds.mockReturnValue(
      mockQueryFactory([]),
    );
    const fixture = createFixture();

    // Act
    const rows = fixture.componentInstance.tableRows();

    // Assert
    expect(rows).toEqual([]);
  });

  it('should render a single approver username in the users column', () => {
    // Arrange
    mockProgramApiService.getApprovalThresholds.mockReturnValue(
      mockQueryFactory([
        {
          id: 1,
          thresholdAmount: 500,
          approvers: [{ id: 10, userId: 4, username: 'john@example.org' }],
        },
      ]),
    );
    const fixture = createFixture();

    // Act
    const rows = fixture.componentInstance.tableRows();

    // Assert
    expect(rows).toHaveLength(1);
    expect(rows[0].users).toBe('john@example.org');
  });

  it('should join multiple approver usernames with a comma', () => {
    // Arrange
    mockProgramApiService.getApprovalThresholds.mockReturnValue(
      mockQueryFactory([
        {
          id: 1,
          thresholdAmount: 1000,
          approvers: [
            { id: 10, userId: 4, username: 'alice@example.org' },
            { id: 11, userId: 5, username: 'bob@example.org' },
          ],
        },
      ]),
    );
    const fixture = createFixture();

    // Act
    const rows = fixture.componentInstance.tableRows();

    // Assert
    expect(rows[0].users).toBe('alice@example.org, bob@example.org');
  });

  it('should number steps starting at 1 in the order returned by the API', () => {
    // Arrange
    mockProgramApiService.getApprovalThresholds.mockReturnValue(
      mockQueryFactory([
        {
          id: 1,
          thresholdAmount: 100,
          approvers: [{ id: 10, userId: 4, username: 'alice@example.org' }],
        },
        {
          id: 2,
          thresholdAmount: 500,
          approvers: [{ id: 11, userId: 5, username: 'bob@example.org' }],
        },
        {
          id: 3,
          thresholdAmount: 1000,
          approvers: [{ id: 12, userId: 6, username: 'carol@example.org' }],
        },
      ]),
    );
    const fixture = createFixture();

    // Act
    const rows = fixture.componentInstance.tableRows();

    // Assert
    expect(rows.map((r) => r.step)).toEqual([1, 2, 3]);
  });

  it('uses the sort order the API returns', () => {
    // Arrange
    mockProgramApiService.getApprovalThresholds.mockReturnValue(
      mockQueryFactory([
        {
          id: 2,
          thresholdAmount: 500,
          approvers: [{ id: 11, userId: 5, username: 'bob@example.org' }],
        },
        {
          id: 1,
          thresholdAmount: 100,
          approvers: [{ id: 10, userId: 4, username: 'alice@example.org' }],
        },
      ]),
    );
    const fixture = createFixture();

    // Act
    const rows = fixture.componentInstance.tableRows();

    // Assert
    expect(rows[0].step).toBe(1);
    expect(rows[0].users).toBe('bob@example.org');
    expect(rows[0].thresholdAmount).toBe('€500');
    expect(rows[1].step).toBe(2);
    expect(rows[1].users).toBe('alice@example.org');
    expect(rows[1].thresholdAmount).toBe('€100');
  });

  it('should include the threshold amount for each row', () => {
    // Arrange
    mockProgramApiService.getApprovalThresholds.mockReturnValue(
      mockQueryFactory([
        {
          id: 1,
          thresholdAmount: 250,
          approvers: [{ id: 10, userId: 4, username: 'alice@example.org' }],
        },
      ]),
    );
    const fixture = createFixture();

    // Act
    const rows = fixture.componentInstance.tableRows();

    // Assert
    expect(rows[0].thresholdAmount).toBe('€250');
  });

  it('should ignore null usernames in the joined list', () => {
    // Arrange
    mockProgramApiService.getApprovalThresholds.mockReturnValue(
      mockQueryFactory([
        {
          id: 1,
          thresholdAmount: 500,
          approvers: [
            { id: 10, userId: 4, username: null },
            { id: 11, userId: 5, username: 'bob@example.org' },
          ],
        },
      ]),
    );
    const fixture = createFixture();

    // Act
    const rows = fixture.componentInstance.tableRows();

    // Assert
    expect(rows[0].users).toBe('bob@example.org');
  });

  it('should render a fallback when all usernames are empty', () => {
    // Arrange
    mockProgramApiService.getApprovalThresholds.mockReturnValue(
      mockQueryFactory([
        {
          id: 1,
          thresholdAmount: 500,
          approvers: [{ id: 10, userId: 4, username: null }],
        },
      ]),
    );
    const fixture = createFixture();

    // Act
    const rows = fixture.componentInstance.tableRows();

    // Assert
    expect(rows[0].users).toBe('-');
  });

  describe('availableApproversForAdditionalStep', () => {
    it('should exclude users selected in the first step', () => {
      // Arrange
      mockProgramApiService.getProgramUsers.mockReturnValue(
        mockQueryFactory([
          {
            id: 1,
            username: 'alice@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 2,
            username: 'bob@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 3,
            username: 'carol@example.org',
            isEligiblePaymentApprover: true,
          },
        ]),
      );
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.formGroup.controls.firstStepUserIds.setValue([1, 2]);

      // Act
      const options = component.availableApproversForAdditionalStep(0);

      // Assert
      expect(options.map((o) => o.value)).toEqual([3]);
    });

    it('should exclude users selected in earlier additional steps', () => {
      // Arrange
      mockProgramApiService.getProgramUsers.mockReturnValue(
        mockQueryFactory([
          {
            id: 1,
            username: 'alice@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 2,
            username: 'bob@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 3,
            username: 'carol@example.org',
            isEligiblePaymentApprover: true,
          },
        ]),
      );
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.addApprovalStep();
      component.additionalSteps.at(0).controls.userIds.setValue([2]);

      // Act
      const options = component.availableApproversForAdditionalStep(1);

      // Assert
      expect(options.map((o) => o.value)).toEqual([1, 3]);
    });

    it('should exclude users selected in later additional steps', () => {
      // Arrange
      mockProgramApiService.getProgramUsers.mockReturnValue(
        mockQueryFactory([
          {
            id: 1,
            username: 'alice@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 2,
            username: 'bob@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 3,
            username: 'carol@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 4,
            username: 'dave@example.org',
            isEligiblePaymentApprover: true,
          },
        ]),
      );
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.formGroup.controls.firstStepUserIds.setValue([1]);
      component.addApprovalStep();
      component.addApprovalStep();
      component.additionalSteps.at(0).controls.userIds.setValue([2]);
      component.additionalSteps.at(1).controls.userIds.setValue([3]);

      // Act
      const options = component.availableApproversForAdditionalStep(0);

      // Assert
      expect(options.map((o) => o.value)).toEqual([2, 4]);
    });

    it('should exclude scoped users from available options', () => {
      // Arrange
      mockProgramApiService.getProgramUsers.mockReturnValue(
        mockQueryFactory([
          {
            id: 1,
            username: 'alice@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 2,
            username: 'scoped@example.org',
            isEligiblePaymentApprover: false,
          },
        ]),
      );
      const fixture = createFixture();
      const component = fixture.componentInstance;

      // Act
      const options = component.availableApproverOptions();

      // Assert
      expect(options.map((o) => o.value)).toEqual([1]);
    });

    it('should exclude empty and null usernames from available options', () => {
      // Arrange
      mockProgramApiService.getProgramUsers.mockReturnValue(
        mockQueryFactory([
          {
            id: 1,
            username: 'alice@example.org',
            isEligiblePaymentApprover: true,
          },
          { id: 2, username: '', isEligiblePaymentApprover: true },
          { id: 3, username: null, isEligiblePaymentApprover: true },
        ]),
      );
      const fixture = createFixture();
      const component = fixture.componentInstance;

      // Act
      const options = component.availableApproverOptions();

      // Assert
      expect(options.map((o) => o.value)).toEqual([1]);
    });
  });

  describe('availableApproversForFirstStep', () => {
    it('should exclude users selected in additional steps', () => {
      // Arrange
      mockProgramApiService.getProgramUsers.mockReturnValue(
        mockQueryFactory([
          {
            id: 1,
            username: 'alice@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 2,
            username: 'bob@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 3,
            username: 'carol@example.org',
            isEligiblePaymentApprover: true,
          },
        ]),
      );
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.formGroup.controls.firstStepUserIds.setValue([1]);
      component.addApprovalStep();
      component.additionalSteps.at(0).controls.userIds.setValue([2]);

      // Act
      const options = component.availableApproversForFirstStep();

      // Assert
      expect(options.map((o) => o.value)).toEqual([1, 3]);
    });
  });

  describe('edit mode initialization', () => {
    it('should prefill existing additional approval steps with saved values', async () => {
      // Arrange
      mockProgramApiService.getProgramUsers.mockReturnValue(
        mockQueryFactory([
          {
            id: 1,
            username: 'alice@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 2,
            username: 'bob@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 3,
            username: 'carol@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 4,
            username: 'dave@example.org',
            isEligiblePaymentApprover: true,
          },
        ]),
      );
      mockProgramApiService.getApprovalThresholds.mockReturnValue(
        mockQueryFactory([
          {
            id: 1,
            thresholdAmount: 0,
            approvers: [{ id: 10, userId: 1, username: 'alice@example.org' }],
          },
          {
            id: 2,
            thresholdAmount: 100,
            approvers: [{ id: 11, userId: 2, username: 'bob@example.org' }],
          },
          {
            id: 3,
            thresholdAmount: 500,
            approvers: [
              { id: 12, userId: 3, username: 'carol@example.org' },
              { id: 13, userId: 4, username: 'dave@example.org' },
            ],
          },
        ]),
      );

      const fixture = createFixture();
      const component = fixture.componentInstance;

      // Act
      component.isEditing.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      // Assert
      expect(component.formGroup.controls.firstStepUserIds.value).toEqual([1]);
      expect(component.additionalSteps.length).toBe(2);
      expect(
        component.additionalSteps.at(0).controls.thresholdAmount.value,
      ).toBe(100);
      expect(component.additionalSteps.at(0).controls.userIds.value).toEqual([
        2,
      ]);
      expect(
        component.additionalSteps.at(1).controls.thresholdAmount.value,
      ).toBe(500);
      expect(component.additionalSteps.at(1).controls.userIds.value).toEqual([
        3, 4,
      ]);
      expect(component.showAdditionalSteps()).toBe(true);
    });

    it('should remove saved approvers that are not eligible for the logged-in user', async () => {
      // Arrange
      mockProgramApiService.getProgramUsers.mockReturnValue(
        mockQueryFactory([
          {
            id: 2,
            username: 'bob@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 3,
            username: 'carol@example.org',
            isEligiblePaymentApprover: true,
          },
        ]),
      );
      mockProgramApiService.getApprovalThresholds.mockReturnValue(
        mockQueryFactory([
          {
            id: 1,
            thresholdAmount: 0,
            approvers: [
              { id: 10, userId: 1, username: 'program-admin@example.org' },
              { id: 11, userId: 2, username: 'bob@example.org' },
            ],
          },
          {
            id: 2,
            thresholdAmount: 100,
            approvers: [
              { id: 12, userId: 1, username: 'program-admin@example.org' },
              { id: 13, userId: 3, username: 'carol@example.org' },
            ],
          },
        ]),
      );

      const fixture = createFixture();
      const component = fixture.componentInstance;

      // Act
      component.isEditing.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      // Assert
      expect(component.formGroup.controls.firstStepUserIds.value).toEqual([2]);
      expect(component.additionalSteps.length).toBe(1);
      expect(component.additionalSteps.at(0).controls.userIds.value).toEqual([
        3,
      ]);
    });

    it('should keep first step empty when no zero-threshold record exists', async () => {
      // Arrange
      mockProgramApiService.getProgramUsers.mockReturnValue(
        mockQueryFactory([
          {
            id: 2,
            username: 'bob@example.org',
            isEligiblePaymentApprover: true,
          },
        ]),
      );
      mockProgramApiService.getApprovalThresholds.mockReturnValue(
        mockQueryFactory([
          {
            id: 2,
            thresholdAmount: 100,
            approvers: [{ id: 11, userId: 2, username: 'bob@example.org' }],
          },
        ]),
      );

      const fixture = createFixture();
      const component = fixture.componentInstance;

      // Act
      component.isEditing.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      // Assert
      expect(component.formGroup.controls.firstStepUserIds.value).toEqual([]);
      expect(component.additionalSteps.length).toBe(1);
      expect(component.showAdditionalSteps()).toBe(true);
    });
  });

  describe('pruneInvalidSelectionsForAdditionalSteps', () => {
    it('should remove users from later steps when they are also selected in the first step', () => {
      // Arrange
      mockProgramApiService.getProgramUsers.mockReturnValue(
        mockQueryFactory([
          {
            id: 1,
            username: 'alice@example.org',
            isEligiblePaymentApprover: true,
          },
          {
            id: 2,
            username: 'bob@example.org',
            isEligiblePaymentApprover: true,
          },
        ]),
      );
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.addApprovalStep();
      component.additionalSteps.at(0).controls.userIds.setValue([1, 2]);
      component.formGroup.controls.firstStepUserIds.setValue([1]);

      // Act
      component.onApproverSelectionChanged();

      // Assert
      expect(component.additionalSteps.at(0).controls.userIds.value).toEqual([
        2,
      ]);
    });
  });

  describe('positiveNumberValidator', () => {
    it('should return an error when the value is 0', () => {
      // Arrange
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.addApprovalStep();
      const control = component.additionalSteps.at(0).controls.thresholdAmount;

      // Act
      control.setValue(0);
      control.markAsTouched();

      // Assert
      expect(control.errors).toMatchObject({ mustBeLargerThanZero: true });
    });

    it('should return an error when the value is negative', () => {
      // Arrange
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.addApprovalStep();
      const control = component.additionalSteps.at(0).controls.thresholdAmount;

      // Act
      control.setValue(-10);

      // Assert
      expect(control.errors).toMatchObject({ mustBeLargerThanZero: true });
    });

    it('should be valid when the value is positive', () => {
      // Arrange
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.addApprovalStep();
      const control = component.additionalSteps.at(0).controls.thresholdAmount;

      // Act
      control.setValue(50);

      // Assert
      expect(control.errors).toBeNull();
    });
  });

  describe('canDeactivate', () => {
    it('should allow deactivation when not editing', () => {
      // Arrange
      const fixture = createFixture();
      const component = fixture.componentInstance;

      // Act
      const canDeactivate = component.canDeactivate();

      // Assert
      expect(canDeactivate).toBe(true);
    });

    it('should block deactivation when editing with unsaved changes', () => {
      // Arrange
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.isEditing.set(true);
      component.formGroup.controls.firstStepUserIds.markAsDirty();

      // Act
      const canDeactivate = component.canDeactivate();

      // Assert
      expect(canDeactivate).toBe(false);
    });
  });

  describe('uniqueThresholdAmountValidator', () => {
    it('should return an error on the FormArray when duplicate amounts exist', () => {
      // Arrange
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.addApprovalStep();
      component.addApprovalStep();
      component.additionalSteps.at(0).controls.thresholdAmount.setValue(100);
      component.additionalSteps.at(1).controls.thresholdAmount.setValue(100);

      // Assert
      expect(component.additionalSteps.errors).toMatchObject({
        duplicateThresholdAmount: true,
      });
    });

    it('should have no error when all amounts are unique', () => {
      // Arrange
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.addApprovalStep();
      component.addApprovalStep();
      component.additionalSteps.at(0).controls.thresholdAmount.setValue(100);
      component.additionalSteps.at(1).controls.thresholdAmount.setValue(200);

      // Assert
      expect(component.additionalSteps.errors).toBeNull();
    });
  });

  describe('mutationData', () => {
    it('should always include a zero-threshold first step', () => {
      // Arrange
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.formGroup.controls.firstStepUserIds.setValue([1, 2]);

      // Act
      const payload = component.mutationData().thresholds;

      // Assert
      expect(payload[0]).toEqual({ thresholdAmount: 0, userIds: [1, 2] });
    });

    it('should include additional steps sorted by thresholdAmount', () => {
      // Arrange
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.addApprovalStep();
      component.addApprovalStep();
      component.additionalSteps.at(0).controls.thresholdAmount.setValue(300);
      component.additionalSteps.at(0).controls.userIds.setValue([3]);
      component.additionalSteps.at(1).controls.thresholdAmount.setValue(100);
      component.additionalSteps.at(1).controls.userIds.setValue([2]);

      // Act
      const payload = component.mutationData().thresholds;

      // Assert
      expect(payload[1]).toEqual({ thresholdAmount: 100, userIds: [2] });
      expect(payload[2]).toEqual({ thresholdAmount: 300, userIds: [3] });
    });

    it('should exclude additional steps where thresholdAmount is null', () => {
      // Arrange
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.addApprovalStep();
      component.additionalSteps.at(0).controls.thresholdAmount.setValue(null);
      component.additionalSteps.at(0).controls.userIds.setValue([1]);

      // Act
      const payload = component.mutationData().thresholds;

      // Assert
      expect(payload).toHaveLength(1);
    });

    it('should update when form values change after an earlier read', () => {
      // Arrange
      const fixture = createFixture();
      const component = fixture.componentInstance;

      const initialPayload = component.mutationData().thresholds;

      component.formGroup.controls.firstStepUserIds.setValue([1]);
      component.addApprovalStep();
      component.additionalSteps.at(0).controls.userIds.setValue([2]);
      component.additionalSteps.at(0).controls.thresholdAmount.setValue(1000);

      // Act
      const updatedPayload = component.mutationData().thresholds;

      // Assert
      expect(initialPayload).toEqual([{ thresholdAmount: 0, userIds: [] }]);
      expect(updatedPayload).toEqual([
        { thresholdAmount: 0, userIds: [1] },
        { thresholdAmount: 1000, userIds: [2] },
      ]);
    });
  });

  describe('saveApprovalThresholdsMutation', () => {
    it('should call createOrReplaceApprovalThresholds with provided thresholds', async () => {
      // Arrange
      const fixture = createFixture();
      const component = fixture.componentInstance;
      const thresholds = [{ thresholdAmount: 0, userIds: [1] }];

      // Act
      await component.saveApprovalThresholdsMutation.mutateAsync({
        thresholds,
      });

      // Assert
      expect(
        mockProgramApiService.createOrReplaceApprovalThresholds,
      ).toHaveBeenCalledTimes(1);
      const [typedRequest] = mockProgramApiService
        .createOrReplaceApprovalThresholds.mock.calls[0] as [
        {
          programId: () => string;
          thresholds: { thresholdAmount: number; userIds: number[] }[];
        },
      ];

      expect(typeof typedRequest.programId).toBe('function');
      expect(typedRequest.programId()).toBe('1');
      expect(typedRequest.thresholds).toEqual(thresholds);
    });
  });
});

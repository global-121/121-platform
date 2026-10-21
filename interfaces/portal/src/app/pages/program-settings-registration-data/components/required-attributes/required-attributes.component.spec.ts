import type { Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  provideTanStackQuery,
  QueryClient,
  queryOptions,
} from '@tanstack/angular-query-experimental';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { RequiredAttributesComponent } from '~/pages/program-settings-registration-data/components/required-attributes/required-attributes.component';
import { FspConfigurationService } from '~/services/fsp-configuration.service';
import { ToastService } from '~/services/toast.service';
import { InfoTooltipTrackingName } from '~/services/tracking/tracking.enums';
import { TrackingService } from '~/services/tracking/tracking.service';

class TrackingServiceStub {
  trackEvent = vi.fn();
}

const mockQueryFactory =
  <T>(getData: () => T, queryKey: string) =>
  () =>
    queryOptions({
      queryKey: [queryKey],
      queryFn: () => Promise.resolve(getData()),
      initialData: getData(),
    });

describe('RequiredAttributesComponent', () => {
  let component: RequiredAttributesComponent;
  let fixture: ComponentFixture<RequiredAttributesComponent>;

  let mockProgramData: {
    enableScope: boolean;
    accessGroupRegistrationAttributeNames: string[];
  };

  const mockProgramAttributes = [
    {
      name: 'fullName',
      label: 'Full name',
      type: RegistrationAttributeTypes.text,
    },
    {
      name: 'region',
      label: 'Region',
      type: RegistrationAttributeTypes.dropdown,
    },
    {
      name: 'district',
      label: 'District',
      type: RegistrationAttributeTypes.dropdown,
    },
    {
      name: 'extraQuestion',
      label: 'Extra question',
      type: RegistrationAttributeTypes.text,
    },
  ];

  const setupTestBed = async () => {
    await TestBed.configureTestingModule({
      imports: [RequiredAttributesComponent],
      providers: [
        {
          provide: FspConfigurationApiService,
          useValue: {
            getFspConfigurations: (_programId: Signal<number | string>) =>
              mockQueryFactory(() => [], 'fspConfigurations'),
          },
        },
        {
          provide: FspConfigurationService,
          useValue: {
            getRequiredFspAttributes: () => [],
          },
        },
        {
          provide: ProgramApiService,
          useValue: {
            getProgram: (_programId: Signal<number | string>) =>
              mockQueryFactory(() => mockProgramData, 'program'),
            getProgramAttributes: (_options: {
              programId: Signal<number | string>;
            }) =>
              mockQueryFactory(
                () => mockProgramAttributes,
                'programAttributes',
              ),
          },
        },
        ToastService,
        MessageService,
        provideTanStackQuery(
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
            },
          }),
        ),
        { provide: TrackingService, useClass: TrackingServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RequiredAttributesComponent);
    fixture.componentRef.setInput('programId', 1);
    fixture.componentRef.setInput('isKoboIntegrated', false);
    component = fixture.componentInstance;
  };

  beforeEach(async () => {
    mockProgramData = {
      enableScope: false,
      accessGroupRegistrationAttributeNames: [],
    };
    await setupTestBed();
  });

  it('should not include access group level attributes when none are configured', async () => {
    // Arrange
    mockProgramData = {
      enableScope: false,
      accessGroupRegistrationAttributeNames: [],
    };

    // Act
    fixture.detectChanges();
    await fixture.whenStable();

    // Assert
    const names = component.requiredAttributes().map((attr) => attr.name);
    expect(names).toEqual(['fsp', 'fullName']);
  });

  it('should include configured access group level attributes with tooltip data', async () => {
    // Arrange
    mockProgramData = {
      enableScope: false,
      accessGroupRegistrationAttributeNames: ['region', 'district'],
    };

    // Act
    fixture.detectChanges();
    await fixture.whenStable();

    // Assert
    const required = component.requiredAttributes();
    const regionAttr = required.find((attr) => attr.name === 'region');
    const districtAttr = required.find((attr) => attr.name === 'district');

    expect(regionAttr).toBeDefined();
    expect(regionAttr?.infoTooltipData).toEqual({
      message:
        "This field is used to calculate access groups for the program and must be a 'select_one' question in your form.",
      trackingName: InfoTooltipTrackingName.requiredAttributeAccessGroupInfo,
    });
    expect(districtAttr).toBeDefined();
    expect(districtAttr?.infoTooltipData).toEqual({
      message:
        "This field is used to calculate access groups for the program and must be a 'select_one' question in your form.",
      trackingName: InfoTooltipTrackingName.requiredAttributeAccessGroupInfo,
    });
  });

  it('should attach access group tooltip data even if attribute is also required by an FSP', async () => {
    // Arrange
    mockProgramData = {
      enableScope: false,
      accessGroupRegistrationAttributeNames: ['region'],
    };
    const fspConfigService = TestBed.inject(FspConfigurationService);
    vi.spyOn(fspConfigService, 'getRequiredFspAttributes').mockReturnValue([
      'region',
    ]);

    // Act
    fixture.detectChanges();
    await fixture.whenStable();

    // Assert
    const matchingAttrs = component
      .requiredAttributes()
      .filter((attr) => attr.name === 'region');
    expect(matchingAttrs).toHaveLength(1);
    expect(matchingAttrs[0].infoTooltipData?.trackingName).toBe(
      InfoTooltipTrackingName.requiredAttributeAccessGroupInfo,
    );
  });
});

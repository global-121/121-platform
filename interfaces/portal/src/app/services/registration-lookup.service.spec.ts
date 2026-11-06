import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';

import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { RegistrationLookupService } from '~/services/registration-lookup.service';

describe('RegistrationLookupService', () => {
  let queryParamMap: Subject<ParamMap>;
  let service: RegistrationLookupService;

  beforeEach(() => {
    queryParamMap = new Subject<ParamMap>();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMap.asObservable(),
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
      ],
    });
    service = TestBed.inject(RegistrationLookupService);
  });

  it('updates the phone number when iframe query parameters change', () => {
    // Arrange
    queryParamMap.next(convertToParamMap({ phonenumber: '31612345678' }));

    // Act
    queryParamMap.next(convertToParamMap({ phonenumber: '31687654321' }));

    // Assert
    expect(service.phonenumber()).toBe('31687654321');
    expect(service.isActive()).toBe(true);
  });

  it('supports the camel-case phone number query parameter', () => {
    // Arrange & Act
    queryParamMap.next(convertToParamMap({ phoneNumber: '31612345678' }));

    // Assert
    expect(service.phonenumber()).toBe('31612345678');
  });

  it('is inactive when the query parameter is removed', () => {
    // Arrange
    queryParamMap.next(convertToParamMap({ phonenumber: '31612345678' }));

    // Act
    queryParamMap.next(convertToParamMap({}));

    // Assert
    expect(service.phonenumber()).toBeUndefined();
    expect(service.isActive()).toBe(false);
  });
});

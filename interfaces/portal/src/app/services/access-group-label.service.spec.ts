import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { Program } from '~/domains/program/program.model';
import { AccessGroupLabelService } from '~/services/access-group-label.service';
import { Locale } from '~/utils/locale';

const programRegistrationAttributes = [
  {
    name: 'region',
    options: [{ option: 'north', label: { en: 'North' } }],
  },
  {
    name: 'district',
    options: [
      { option: 'north-central', label: { en: 'North Central' } },
      { option: 'unlabelled', label: { en: '' } },
    ],
  },
] as Program['programRegistrationAttributes'];

describe('AccessGroupLabelService', () => {
  let service: AccessGroupLabelService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: LOCALE_ID, useValue: Locale.en }],
    });
    service = TestBed.inject(AccessGroupLabelService);
  });

  describe('labels of access groups', () => {
    it('joins the option labels of the access groups in the given order', () => {
      // Act
      const label = service.getAccessGroupLabel({
        programRegistrationAttributes,
        accessGroups: [
          { programRegistrationAttributeName: 'region', value: 'north' },
          {
            programRegistrationAttributeName: 'district',
            value: 'north-central',
          },
        ],
      });

      // Assert
      expect(label).toBe('North / North Central');
    });

    it('falls back to the stored value when no option label is available', () => {
      // Act
      const label = service.getAccessGroupLabel({
        programRegistrationAttributes,
        accessGroups: [
          { programRegistrationAttributeName: 'removed', value: 'east' },
          { programRegistrationAttributeName: 'region', value: 'south' },
          {
            programRegistrationAttributeName: 'district',
            value: 'unlabelled',
          },
        ],
      });

      // Assert
      expect(label).toBe('east / south / unlabelled');
    });

    it('skips empty and non-string values', () => {
      // Act
      const label = service.getAccessGroupLabel({
        programRegistrationAttributes,
        accessGroups: [
          { programRegistrationAttributeName: 'region', value: 'north' },
          { programRegistrationAttributeName: 'district', value: null },
          { programRegistrationAttributeName: 'village', value: 42 },
          { programRegistrationAttributeName: 'subVillage', value: '' },
        ],
      });

      // Assert
      expect(label).toBe('North');
    });

    it('returns no label when there are no access groups', () => {
      // Act
      const label = service.getAccessGroupLabel({
        programRegistrationAttributes,
        accessGroups: [],
      });

      // Assert
      expect(label).toBeUndefined();
    });
  });

  describe('labels of registrations', () => {
    it('uses the registration values of the access group attributes', () => {
      // Act
      const label = service.getRegistrationAccessGroupLabel({
        programRegistrationAttributes,
        accessGroupRegistrationAttributeNames: ['region', 'district'],
        registration: { region: 'north', district: 'north-central' },
      });

      // Assert
      expect(label).toBe('North / North Central');
    });

    it('returns no label while the registration is not loaded', () => {
      // Act
      const label = service.getRegistrationAccessGroupLabel({
        programRegistrationAttributes,
        accessGroupRegistrationAttributeNames: ['region'],
        registration: undefined,
      });

      // Assert
      expect(label).toBeUndefined();
    });
  });
});

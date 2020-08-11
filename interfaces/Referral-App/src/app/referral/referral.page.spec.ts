import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReferralPage } from './referral.page';

describe('ReferralPage', () => {
  let component: ReferralPage;
  let fixture: ComponentFixture<ReferralPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ReferralPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReferralPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

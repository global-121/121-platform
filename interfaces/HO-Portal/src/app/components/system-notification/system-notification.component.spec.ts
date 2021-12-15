import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SystemNotificationComponent } from './system-notification.component';

describe('SystemNotification', () => {
  let component: SystemNotificationComponent;
  let fixture: ComponentFixture<SystemNotificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SystemNotificationComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

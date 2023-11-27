import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SystemNotificationComponent } from './system-notification.component';

describe('SystemNotification', () => {
  let component: SystemNotificationComponent;
  let fixture: ComponentFixture<SystemNotificationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SystemNotificationComponent],
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

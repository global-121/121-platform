import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { MessageHistoryPopupComponent } from './message-history-popup.component';

describe('MessageHistoryPopupComponent', () => {
  let component: MessageHistoryPopupComponent;
  let fixture: ComponentFixture<MessageHistoryPopupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MessageHistoryPopupComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(MessageHistoryPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

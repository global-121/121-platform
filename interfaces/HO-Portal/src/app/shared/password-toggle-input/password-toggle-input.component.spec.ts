import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PasswordToggleInputComponent } from './password-toggle-input.component';

describe('PasswordToggleInputComponent', () => {
  let component: PasswordToggleInputComponent;
  let fixture: ComponentFixture<PasswordToggleInputComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PasswordToggleInputComponent],
      imports: [FormsModule, IonicModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordToggleInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

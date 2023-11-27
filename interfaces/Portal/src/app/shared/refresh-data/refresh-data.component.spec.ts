import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { RefreshDataComponent } from './refresh-data.component';

describe('RefreshDataComponent', () => {
  let component: RefreshDataComponent;
  let fixture: ComponentFixture<RefreshDataComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RefreshDataComponent],
      imports: [IonicModule, TranslateModule.forRoot()],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RefreshDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger the provided refresh-method when clicked', () => {
    const refreshSpy = spyOn(component.refresh, 'emit');

    document.getElementById('refresh').click();
    document.getElementById('refresh').click();

    expect(refreshSpy).toHaveBeenCalledTimes(2);
  });
});

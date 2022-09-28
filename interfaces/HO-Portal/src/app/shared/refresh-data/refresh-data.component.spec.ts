import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RefreshDataComponent } from './refresh-data.component';

describe('RefreshDataComponent', () => {
  let component: RefreshDataComponent;
  let fixture: ComponentFixture<RefreshDataComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [RefreshDataComponent],
        imports: [TranslateModule.forRoot()],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();
    }),
  );

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
